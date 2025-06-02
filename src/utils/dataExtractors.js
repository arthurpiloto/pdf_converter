// src/utils/dataExtractors.js

const toTitleCase = (str) => {
	if (!str) return '';
	const minorWords = new Set([
		'a',
		'as',
		'o',
		'os',
		'e',
		'ou',
		'nem',
		'mas',
		'porém',
		'contudo',
		'todavia',
		'entretanto',
		'no entanto',
		'de',
		'da',
		'do',
		'das',
		'dos',
		'em',
		'na',
		'no',
		'nas',
		'nos',
		'para',
		'com',
		'por',
		'sem',
		'sob',
		'sobre',
		'entre',
		'após',
		'até',
		'contra',
		'desde',
		'durante',
		'mediante',
		'perante',
		'segundo',
		'trás',
		'um',
		'uma',
		'uns',
		'umas',
		'suas',
		'ao',
		'à',
		'aos',
		'às',
		'del',
	]);

	const parts = str.toLowerCase().split(/(\s+|-|\/)/);

	let result = [];
	let isFirstWordOfPhrase = true;

	for (let i = 0; i < parts.length; i++) {
		let part = parts[i];

		if (part.match(/^\s+$/) || part === '-' || part === '/') {
			result.push(part);
			isFirstWordOfPhrase = true;
		} else {
			if (isFirstWordOfPhrase || !minorWords.has(part)) {
				result.push(part.charAt(0).toUpperCase() + part.slice(1));
			} else {
				result.push(part);
			}
			isFirstWordOfPhrase = false;
		}
	}
	return result.join('');
};

/**
 * Função para extrair dados do PDF "Espectro de renda.pdf".
 * Espera um formato de duas colunas: "Número de Salários" e "Número de Alunos".
 * @param {string} text - O texto completo extraído do PDF.
 * @returns {Array<Array<any>>} Array de arrays representando as linhas e colunas.
 */
const extractEspectroDeRenda = (text) => {
	const extractedData = [];
	const lines = text.split('\n');
	let inDataSection = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (line.includes('número de saláriosnúmero de alunos')) {
			extractedData.push(['Número de Salários', 'Número de Alunos']);
			inDataSection = true;
			continue;
		}

		if (inDataSection) {
			if (line.includes('total de registros:')) {
				inDataSection = false;
				break;
			}

			if (line.trim() !== '') {
				const match = line.match(/^(\d+)(\d{1,4})$/);

				if (match && match.length === 3) {
					extractedData.push([Number(match[1]), Number(match[2])]);
				}
			}
		}
	}
	return extractedData;
};

/**
 * Função para extrair dados do PDF "Geral Matricula niveis.pdf".
 * Extrai dados de Graduação, Pós-Graduação e o Total Geral de Alunos.
 * @param {string} text - O texto completo extraído do PDF.
 * @returns {{gradData: Array<Array<any>>, postGradData: Array<Array<any>>, totalGeral: Array<Array<any>>}}
 */
const extractGeralMatriculaNiveis = (text) => {
	const gradData = [['Categoria', 'Quantidade']];
	const postGradData = [['Categoria', 'Quantidade']];
	const totalGeral = [['Total Geral de Alunos', 'Quantidade']];

	const lines = text.split('\n');
	let currentSection = '';

	for (const line of lines) {
		if (line.includes('ano-semestre matrícula:')) {
			currentSection = 'Graduação';
			continue;
		}

		if (line.includes('pós-graduação') && currentSection === 'Graduação') {
			currentSection = 'Pós-Graduação';
			continue;
		}

		if (line.includes('total de alunos:')) {
			const match = line.match(/Total de Alunos:\s*(\d+)/);
			if (match) {
				totalGeral.push(['Total de Alunos', Number(match[1])]);
			}
			currentSection = '';
			continue;
		}

		const dataMatch = line.match(/(.+?)(\d+)$/);

		if (dataMatch && dataMatch.length === 3) {
			const category = dataMatch[1].trim();
			const quantity = Number(dataMatch[2]);

			if (currentSection === 'Graduação') {
				gradData.push([category, quantity]);
			} else if (currentSection === 'Pós-Graduação') {
				postGradData.push([category, quantity]);
			}
		} else {
			const totalSectionMatch = line.match(/^Total:\s*(\d+)$/);

			if (totalSectionMatch) {
				const total = Number(totalSectionMatch[1]);
				if (currentSection === 'Graduação') {
					gradData.push(['Total Graduação', total]);
				} else if (currentSection === 'Pós-Graduação') {
					postGradData.push(['Total Pós-Graduação', total]);
				}
			}
		}
	}
	return { gradData, postGradData, totalGeral };
};

/**
 * Função para extrair dados dos PDFs de alunos matriculados (Presencial e EAD).
 * Organiza os dados por Grau Acadêmico (Bacharelado/Licenciatura) em diferentes outputs,
 * com detalhes de Curso, Turno, Cidade e Quantidade de Alunos.
 *
 * @param {string} text - O texto completo extraído do PDF.
 * @param {string} modality - A modalidade do curso ('Presencial' ou 'EAD'). Usado para logs e, futuramente, se houver diferença de parsing.
 * @returns {{bachareladoData: Array<Array<any>>, licenciaturaData: Array<Array<any>>, overallTotals: Array<Array<any>>}}
 */
const extractMatriculados = (text) => {
	const bachareladoData = [
		['Curso', 'Turno', 'Cidade', 'Grau Acadêmico', 'Quantidade de Alunos'],
	];
	const licenciaturaData = [
		['Curso', 'Turno', 'Cidade', 'Grau Acadêmico', 'Quantidade de Alunos'],
	];
	const overallTotals = [['Categoria', 'Quantidade']];

	const lines = text.split('\n');

	let currentCourseName = '';
	let currentTurno = '';
	let currentCity = '';

	const courseInfoRegex =
		/^([a-z]{2,5})\s*-\s*(.+?)\s*-\s*(mtn|n)\s*-\s*([a-zçéàèáéíóúãõâêîôûü\s]+(?:-[a-zçéàèáéíóúãõâêîôûü\s]+)*)$/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		const courseInfoMatch = line.match(courseInfoRegex);
		if (courseInfoMatch) {
			currentCourseName = toTitleCase(courseInfoMatch[2].trim());
			currentTurno = courseInfoMatch[3].toUpperCase(); // Converte de volta para maiúsculas para a saída
			currentCity = toTitleCase(courseInfoMatch[4].trim());

			if (lines[i + 1]) {
				const concatenatedDegreeQuantityLine = lines[i + 1].trim();
				const degreeQuantityMatch = concatenatedDegreeQuantityLine.match(
					/^(bacharelado|licenciatura)(\d+)$/,
				);

				if (degreeQuantityMatch && degreeQuantityMatch.length === 3) {
					const currentGrauAcademico = degreeQuantityMatch[1].trim();
					const currentQuantity = Number(degreeQuantityMatch[2]);

					const row = [
						currentCourseName,
						currentTurno,
						currentCity,
						currentGrauAcademico.charAt(0).toUpperCase() +
							currentGrauAcademico.slice(1), // Capitaliza a primeira letra
						currentQuantity,
					];

					if (currentGrauAcademico === 'bacharelado') {
						bachareladoData.push(row);
					} else if (currentGrauAcademico === 'licenciatura') {
						licenciaturaData.push(row);
					}

					i += 1;
					if (lines[i + 1] && lines[i + 1].trim().startsWith('total:')) {
						i++;
					}
					continue;
				}
			}
		}

		if (line.startsWith('total geral:')) {
			const totalGeralMatch = line.match(/total geral:\s*(\d+)$/);
			if (totalGeralMatch) {
				overallTotals.push(['Total Geral', Number(totalGeralMatch[1])]);
				continue;
			}
		}
	}
	return { bachareladoData, licenciaturaData, overallTotals };
};

module.exports = {
	extractEspectroDeRenda,
	extractGeralMatriculaNiveis,
	extractMatriculados,
};
