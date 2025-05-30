// src/utils/dataExtractors.js

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

		if (line.includes('Número de SaláriosNúmero de Alunos')) {
			extractedData.push(['Número de Salários', 'Número de Alunos']);
			inDataSection = true;
			continue;
		}

		if (inDataSection) {
			if (line.includes('Total de Registros:')) {
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
		if (line.includes('Ano-Semestre Matrícula:')) {
			currentSection = 'Graduação';
			continue;
		}

		if (line.includes('Pós-Graduação') && currentSection === 'Graduação') {
			currentSection = 'Pós-Graduação';
			continue;
		}

		if (line.includes('Total de Alunos:')) {
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

module.exports = {
	extractEspectroDeRenda,
	extractGeralMatriculaNiveis,
};
