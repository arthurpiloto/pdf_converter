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

		// Detecta o início da seção de dados procurando pela string de cabeçalho concatenada
		if (line.includes('Número de SaláriosNúmero de Alunos')) {
			extractedData.push(['Número de Salários', 'Número de Alunos']); // Adiciona cabeçalhos
			inDataSection = true; // Ativa a flag para começar a extrair dados
			continue; // Pula para a próxima iteração do loop, que será a primeira linha de dados
		}

		// Se já estamos na seção de dados, podemos procurar pelo fim ou pelos dados
		if (inDataSection) {
			// Detecta o fim da seção de dados SOMENTE SE JÁ ESTAMOS NA SEÇÃO DE DADOS
			if (line.includes('Total de Registros:')) {
				inDataSection = false; // Desativa a flag
				break; // Sai do loop
			}

			// Se estamos na seção de dados e não é a linha de fim, processa como linha de dados
			if (line.trim() !== '') {
				// Se a linha não estiver vazia
				// Regex para extrair dois grupos de dígitos de uma linha concatenada.
				// ^(\d+): Captura o primeiro grupo de dígitos (Número de Salários) do início da linha.
				// (\d{1,4})$: Captura o segundo grupo de dígitos (Número de Alunos) com 1 a 4 dígitos no final da linha.
				// Essa é uma heurística baseada nos exemplos fornecidos, onde o segundo número é tipicamente menor.
				const match = line.match(/^(\d+)(\d{1,4})$/);

				if (match && match.length === 3) {
					// match[0] é a string completa, match[1] e match[2] são os grupos capturados.
					extractedData.push([Number(match[1]), Number(match[2])]);
				} else {
					console.warn(
						`[EspectroDeRenda] Linha de dados não corresponde ao padrão esperado (salário/alunos): "${line.trim()}"`,
					);
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
 * @returns {{gradData: Array<Array<any>>, postGradData: Array<Array<any>>, totalAlunos: Array<Array<any>>}}
 */
const extractGeralMatriculaNiveis = (text) => {
	const gradData = [['Categoria', 'Quantidade']];
	const postGradData = [['Categoria', 'Quantidade']];
	const totalAlunos = [['Total Geral', 'Quantidade']];

	const lines = text.split('\n');
	let currentSection = '';

	for (const line of lines) {
		if (line.includes('Graduação') && !line.includes('Pós-Graduação')) {
			currentSection = 'Graduação';
			continue;
		}
		if (line.includes('Pós-Graduação')) {
			currentSection = 'Pós-Graduação';
			continue;
		}
		if (line.includes('Total de Alunos:')) {
			const match = line.match(/Total de Alunos: (\d+)/);
			if (match) {
				totalAlunos.push(['Total de Alunos', Number(match[1])]);
			}
			currentSection = ''; // Fim das seções principais
			continue;
		}

		// Expressão regular para capturar "Texto", "Número"
		const match = line.match(/"([^"]+)"\s*,\s*"(\d+)"/);
		if (match) {
			const category = match[1].trim();
			const quantity = Number(match[2].trim());

			if (currentSection === 'Graduação') {
				gradData.push([category, quantity]);
			} else if (currentSection === 'Pós-Graduação') {
				postGradData.push([category, quantity]);
			}
		} else {
			// Captura os totais específicos de cada seção (ex: "Total: 10028")
			const totalMatch = line.match(/,"Total: (\d+)"/);
			if (totalMatch) {
				const total = Number(totalMatch[1]);
				if (currentSection === 'Graduação') {
					gradData.push(['Total Graduação', total]);
				} else if (currentSection === 'Pós-Graduação') {
					postGradData.push(['Total Pós-Graduação', total]);
				}
			}
		}
	}
	return { gradData, postGradData, totalAlunos };
};

/**
 * Função para extrair dados do PDF "Ira 2022 2025.pdf".
 * Este PDF possui múltiplas tabelas e seções.
 * Será necessário identificar blocos de dados por cabeçalhos e municípios.
 * A extração será mais complexa, focando nos blocos "Forma de Ingresso" e "Média do Índice Acadêmico".
 * @param {string} text - O texto completo extraído do PDF.
 * @returns {{ingressoData: Array<Array<any>>, iraData: Array<Array<any>>}}
 */
const extractIra20222025 = (text) => {
	const ingressoData = [
		[
			'Município',
			'Curso',
			'Alunos Ativos',
			'Vestibular',
			'Transf. Voluntária',
			'Portador de Diploma',
			'Reingresso Automático',
			'Outras',
		],
	];
	const iraData = [
		['Município', 'Curso', 'MC', 'MCN', 'IRA', 'IECH', 'IEPL', 'IEA', 'IEAN', 'ISPL', 'IECHP'],
	];

	const lines = text.split('\n');
	let currentMunicipality = '';
	let inIngressoTable = false;
	let inIraTable = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// Detectar município
		const municipalityMatch = line.match(/MUNICÍPIO: (.+)/);
		if (municipalityMatch) {
			currentMunicipality = municipalityMatch[1].trim();
			inIngressoTable = false; // Reset flags
			inIraTable = false; // Reset flags
			continue;
		}

		// Detectar início da tabela "Forma de Ingresso"
		if (
			line.includes('Forma de Ingresso') &&
			lines[i + 1] &&
			lines[i + 1].includes('Curso') &&
			lines[i + 1].includes('Alunos')
		) {
			inIngressoTable = true;
			inIraTable = false;
			i += 1; // Pula a linha do cabeçalho secundário
			continue;
		}

		// Detectar início da tabela "Média do Índice Acadêmico"
		if (
			line.includes('Média do Índice Acadêmico') &&
			lines[i + 1] &&
			lines[i + 1].includes('Curso') &&
			lines[i + 1].includes('MC')
		) {
			inIraTable = true;
			inIngressoTable = false;
			i += 1; // Pula a linha do cabeçalho secundário
			continue;
		}

		// Detectar fim das tabelas (ex: "Turmas Trancadas no Ano")
		if (line.includes('Turmas Trancadas no Ano') || line.includes('SIGAA | NTInf')) {
			inIngressoTable = false;
			inIraTable = false;
			continue;
		}

		if (inIngressoTable) {
			// Regex para capturar dados da tabela de ingresso
			// Ex: "Bioquímica Bacharelado MTN","334","0","1","1","0","332"
			const dataMatch = line.match(
				/"([^"]+)"\s*,\s*"(\d+)"\s*,\s*"(\d+)"\s*,\s*"(\d+)"\s*,\s*"(\d+)"\s*,\s*"(\d+)"\s*,\s*"(\d+)"/,
			);
			if (dataMatch) {
				const row = [
					currentMunicipality,
					dataMatch[1].trim(),
					Number(dataMatch[2]),
					Number(dataMatch[3]),
					Number(dataMatch[4]),
					Number(dataMatch[5]),
					Number(dataMatch[6]),
					Number(dataMatch[7]),
				];
				ingressoData.push(row);
			}
		} else if (inIraTable) {
			// Regex para capturar dados da tabela de IRA
			// Ex: "Bioquímica Bacharelado MTN","5,4673 309,0222","4,7001","0,5048","0,4325","2,5899","151,3731","0,4906","0,4000"
			// Note: MC e MCN estão na mesma string em alguns casos, precisando de tratamento especial
			const dataMatch = line.match(
				/"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/,
			);
			if (dataMatch) {
				let mcMcn = dataMatch[2].trim().split(/\s+/); // Divide MC e MCN se estiverem juntos
				let mc = mcMcn[0].replace(',', '.');
				let mcn = mcMcn.length > 1 ? mcMcn[1].replace(',', '.') : '';

				const row = [
					currentMunicipality,
					dataMatch[1].trim(),
					Number(mc),
					Number(mcn),
					Number(dataMatch[3].replace(',', '.')),
					Number(dataMatch[4].replace(',', '.')),
					Number(dataMatch[5].replace(',', '.')),
					Number(dataMatch[6].replace(',', '.')),
					Number(dataMatch[7].replace(',', '.')),
					Number(dataMatch[8].replace(',', '.')),
					Number(dataMatch[9].replace(',', '.')),
				];
				iraData.push(row);
			}
		}
	}
	return { ingressoData, iraData };
};

/**
 * Função para extrair dados do PDF "Matriculados 2025 1.pdf" (Presenciais).
 * @param {string} text - O texto completo extraído do PDF.
 * @returns {Array<Array<any>>} Array de arrays representando as linhas e colunas.
 */
const extractMatriculadosPresenciais = (text) => {
	const extractedData = [['Curso/Turno/Cidade/Grau Acadêmico', 'Quantidade de Alunos']];
	const lines = text.split('\n');
	let inDataSection = false;

	for (const line of lines) {
		if (
			line.includes('Curso/Turno/Cidade/Grau Acadêmico') &&
			line.includes('Quantidade de Alunos')
		) {
			inDataSection = true;
			continue;
		}
		if (line.includes('Total Geral:')) {
			const totalMatch = line.match(/Total Geral:\s*"(\d+)"/);
			if (totalMatch) {
				extractedData.push(['Total Geral', Number(totalMatch[1])]);
			}
			inDataSection = false;
			break;
		}

		if (inDataSection && line.trim() !== '') {
			// Regex para capturar o nome do curso/grau e a quantidade
			const match = line.match(/"([^"]+)"\s*,\s*"(\d+)"/);
			if (match) {
				extractedData.push([match[1].trim(), Number(match[2])]);
			} else {
				// Tenta capturar "Total:" para cada curso
				const totalCourseMatch = line.match(/Total:\s*"(\d+)"/);
				if (totalCourseMatch) {
					extractedData.push(['Total:', Number(totalCourseMatch[1])]);
				}
			}
		}
	}
	return extractedData;
};

/**
 * Função para extrair dados do PDF "Matriculados25 1 EAD.pdf" (EAD).
 * @param {string} text - O texto completo extraído do PDF.
 * @returns {Array<Array<any>>} Array de arrays representando as linhas e colunas.
 */
const extractMatriculadosEAD = (text) => {
	const extractedData = [['Curso/Turno/Cidade/Grau Acadêmico', 'Quantidade de Alunos']];
	const lines = text.split('\n');
	let inDataSection = false;

	for (const line of lines) {
		if (
			line.includes('Curso/Turno/Cidade/Grau Acadêmico') &&
			line.includes('Quantidade de Alunos')
		) {
			inDataSection = true;
			continue;
		}
		if (line.includes('Total Geral:')) {
			const totalMatch = line.match(/Total Geral:\s*"(\d+)"/);
			if (totalMatch) {
				extractedData.push(['Total Geral', Number(totalMatch[1])]);
			}
			inDataSection = false;
			break;
		}

		if (inDataSection && line.trim() !== '') {
			const match = line.match(/"([^"]+)"\s*,\s*"(\d+)"/);
			if (match) {
				extractedData.push([match[1].trim(), Number(match[2])]);
			} else {
				const totalCourseMatch = line.match(/Total:\s*"(\d+)"/);
				if (totalCourseMatch) {
					extractedData.push(['Total:', Number(totalCourseMatch[1])]);
				}
			}
		}
	}
	return extractedData;
};

/**
 * Função para extrair dados do PDF "Sexo e Ingresso 2025 1.pdf".
 * Este PDF tem uma estrutura mais aninhada com "Curso", "Forma de Ingresso", "Homens" e "Mulheres".
 * @param {string} text - O texto completo extraído do PDF.
 * @returns {Array<Array<any>>} Array de arrays representando as linhas e colunas.
 */
const extractSexoEIngresso = (text) => {
	const extractedData = [['Curso', 'Forma de Ingresso', 'Homens', 'Mulheres']];
	const lines = text.split('\n');
	let currentCourse = '';
	let inCourseSection = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// Detecta o início de uma nova seção de curso
		// Ex: "CCO - Bioquímica - Divinópolis"
		const courseHeaderMatch = line.match(/^([A-Z]{2,5}\s*-\s*.+)\s*$/);
		if (courseHeaderMatch && !line.includes('Forma de Ingresso')) {
			currentCourse = courseHeaderMatch[1].trim();
			inCourseSection = true;
			continue;
		}

		// Detecta o total de registros ou o total geral (fim dos dados principais)
		if (
			line.includes('Total de Registros:') ||
			line.includes('Total de Homens:') ||
			line.includes('SIGAA | NTInf')
		) {
			inCourseSection = false;
			// Captura os totais gerais
			const totalMenMatch = text.match(/Total de Homens:\s*(\d+)/);
			const totalWomenMatch = text.match(/Total de Mulheres:\s*(\d+)/);
			if (totalMenMatch && totalWomenMatch) {
				extractedData.push([
					'',
					'Total Geral',
					Number(totalMenMatch[1]),
					Number(totalWomenMatch[1]),
				]);
			}
			break;
		}

		if (inCourseSection) {
			// Captura a forma de ingresso e os números de homens e mulheres
			// Ex: "Forma de Ingresso\n Sistema de Seleção Unificada (SISU)\n","Homens\n\n\n11\n","Mulheres\n\n\n41\n"
			const entryMatch = line.match(
				/"Forma de Ingresso\s*([^"]+)"\s*,\s*"Homens\s*(\d+)"\s*,\s*"Mulheres\s*(\d+)"/,
			);
			if (entryMatch) {
				extractedData.push([
					currentCourse,
					entryMatch[1].trim(),
					Number(entryMatch[2]),
					Number(entryMatch[3]),
				]);
			} else {
				// Tenta capturar linhas de total para a forma de ingresso
				const totalEntryMatch = line.match(/,"Total:\s*(\d+)"\s*,\s*"(\d+)"/);
				if (totalEntryMatch) {
					extractedData.push([
						'',
						'Total da Forma de Ingresso',
						Number(totalEntryMatch[1]),
						Number(totalEntryMatch[2]),
					]);
				}
			}
		}
	}
	return extractedData;
};

/**
 * Função para extrair dados do PDF "Trancamento por motivo 2025 1.pdf".
 * Este PDF tem uma estrutura de agrupamento por "COORDENAÇÃO DO CURSO DE GRADUAÇÃO".
 * @param {string} text - O texto completo extraído do PDF.
 * @returns {Array<Array<any>>} Array de arrays representando as linhas e colunas.
 */
const extractTrancamentoPorMotivo = (text) => {
	const extractedData = [
		['Coordenação do Curso', 'Componente Curricular', 'Justificativa', 'Total'],
	];
	const lines = text.split('\n');
	let currentCoordination = '';
	let inCoordinationSection = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		// Detecta o início de uma nova coordenação
		const coordinationMatch = line.match(/^COORDENAÇÃO DO CURSO DE GRADUAÇÃO EM (.+)$/);
		if (coordinationMatch) {
			currentCoordination = coordinationMatch[1].trim();
			inCoordinationSection = true;
			continue;
		}

		// Detecta o total geral do departamento (fim da seção de coordenação)
		if (line.includes('Total Geral do Departamento:')) {
			const totalDepartmentMatch = line.match(/Total Geral do Departamento:\s*(\d+)/);
			if (totalDepartmentMatch) {
				extractedData.push([
					currentCoordination,
					'Total Geral do Departamento',
					'',
					Number(totalDepartmentMatch[1]),
				]);
			}
			inCoordinationSection = false;
			continue;
		}

		if (inCoordinationSection) {
			// Captura o componente curricular e a justificativa/total
			// Ex: "BB00720233 - CALCULO I T01\n",,\r\n"INCOMPATIBILIDADE DE HORÁRIO COM TRABALHO, ESTÁGIO OU BOLSA\n",,"2\n"
			const componentMatch = line.match(/^"([^"]+)"\s*,,/);
			if (componentMatch) {
				const component = componentMatch[1].trim();
				let justification = '';
				let total = '';

				// Procura a justificativa e o total nas linhas seguintes
				for (let j = i + 1; j < lines.length; j++) {
					const subLine = lines[j].trim();
					const totalLineMatch = subLine.match(/,"Total:\s*"(\d+)"/);
					if (totalLineMatch) {
						total = Number(totalLineMatch[1]);
						i = j; // Avança o índice principal para a linha do total
						break;
					} else if (subLine.includes('Justificativa') || subLine.includes('Total')) {
						// Ignora linhas de cabeçalho dentro da seção
						continue;
					} else if (subLine.trim() !== '') {
						// Concatena justificativas de múltiplas linhas
						const justificationTextMatch = subLine.match(/"([^"]+)"\s*,,?"(\d+)"/);
						if (justificationTextMatch) {
							justification +=
								(justification ? '; ' : '') + justificationTextMatch[1].trim();
							total = Number(justificationTextMatch[2]);
							i = j;
							break;
						} else {
							justification +=
								(justification ? '; ' : '') +
								subLine.replace(/"/g, '').replace(/,/g, '').trim();
						}
					}
				}
				extractedData.push([currentCoordination, component, justification, total]);
			}
		}
	}
	return extractedData;
};

module.exports = {
	extractEspectroDeRenda,
	extractGeralMatriculaNiveis,
	extractIra20222025,
	extractMatriculadosPresenciais,
	extractMatriculadosEAD,
	extractSexoEIngresso,
	extractTrancamentoPorMotivo,
};
