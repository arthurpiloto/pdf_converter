// src/controllers/convertController.js
const fs = require('fs');
const pdfParser = require('../utils/pdfParser');
const excelGenerator = require('../utils/excelGenerator');
const dataExtractors = require('../utils/dataExtractors'); // Contém as funções de extração específicas

const convertPdfToExcel = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'Nenhum arquivo PDF enviado.' });
	}

	const pdfFilePath = req.file.path;
	let excelFileName = `${req.file.originalname.replace(/\.pdf$/i, '')}.xlsx`;

	try {
		// 1. Extrair texto do PDF
		const pdfText = await pdfParser.extractText(pdfFilePath);
		let extractedData = [];
		let sheetName = 'Dados Extraídos';

		// 2. Detectar o tipo de PDF e extrair dados
		if (
			pdfText.includes('Lista do Espectro de Renda') &&
			pdfText.includes('Número de Salários')
		) {
			extractedData = dataExtractors.extractEspectroDeRenda(pdfText);
			sheetName = 'Espectro de Renda';
			excelFileName = 'Espectro_de_Renda.xlsx';
		} else if (
			pdfText.includes('Relatório Quantitativo de Alunos Matriculados') &&
			pdfText.includes('Alunos Especiais')
		) {
			// Este PDF pode ter dados de Graduação e Pós-Graduação, então pode gerar múltiplas abas
			const { gradData, postGradData, totalAlunos } =
				dataExtractors.extractGeralMatriculaNiveis(pdfText);
			const workbook = excelGenerator.createWorkbook();

			if (gradData.length > 0) {
				excelGenerator.addSheet(workbook, gradData, 'Graduação');
			}
			if (postGradData.length > 0) {
				excelGenerator.addSheet(workbook, postGradData, 'Pós-Graduação');
			}
			if (totalAlunos.length > 0) {
				excelGenerator.addSheet(workbook, totalAlunos, 'Total Geral');
			}

			excelFileName = 'Matricula_Niveis.xlsx';
			const excelBuffer = excelGenerator.writeWorkbook(workbook);

			res.setHeader('Content-Disposition', `attachment; filename=${excelFileName}`);
			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			);
			return res.send(excelBuffer); // Envia o arquivo e encerra
		} else if (pdfText.includes('SUMÁRIO DE ÍNDICES ACADÊMICOS POR CURSO DE GRADUAÇÃO')) {
			const { ingressoData, iraData } = dataExtractors.extractIra20222025(pdfText);
			const workbook = excelGenerator.createWorkbook();

			if (ingressoData.length > 0) {
				excelGenerator.addSheet(workbook, ingressoData, 'Forma de Ingresso');
			}
			if (iraData.length > 0) {
				excelGenerator.addSheet(workbook, iraData, 'Índice Acadêmico');
			}

			excelFileName = 'Ira_2022_2025.xlsx';
			const excelBuffer = excelGenerator.writeWorkbook(workbook);

			res.setHeader('Content-Disposition', `attachment; filename=${excelFileName}`);
			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			);
			return res.send(excelBuffer); // Envia o arquivo e encerra
		} else if (
			pdfText.includes('RELATÓRIO QUANTITATIVO DE ALUNOS MATRICULADOS') &&
			pdfText.includes('TODOS OS CURSOS PRESENCIAIS')
		) {
			extractedData = dataExtractors.extractMatriculadosPresenciais(pdfText);
			sheetName = 'Matriculados Presenciais';
			excelFileName = 'Matriculados_Presenciais.xlsx';
		} else if (
			pdfText.includes('Relatório Quantitativo de Alunos Matriculado') &&
			pdfText.includes('TODOS OS CURSOS A DISTÂNCIA')
		) {
			extractedData = dataExtractors.extractMatriculadosEAD(pdfText);
			sheetName = 'Matriculados EAD';
			excelFileName = 'Matriculados_EAD.xlsx';
		} else if (pdfText.includes('Relatório de Quantitativos de Alunos por Sexo e Ingresso')) {
			extractedData = dataExtractors.extractSexoEIngresso(pdfText);
			sheetName = 'Sexo e Ingresso';
			excelFileName = 'Sexo_e_Ingresso.xlsx';
		} else if (pdfText.includes('Relatório Quantitativo de Trancamentos por Justificativa')) {
			extractedData = dataExtractors.extractTrancamentoPorMotivo(pdfText);
			sheetName = 'Trancamentos por Motivo';
			excelFileName = 'Trancamentos_por_Motivo.xlsx';
		} else {
			// Se nenhum padrão for encontrado, exporta o texto bruto
			extractedData = [['Texto Bruto do PDF']];
			extractedData.push([pdfText]);
			sheetName = 'Texto Bruto';
		}

		// 3. Gerar o arquivo Excel (para PDFs que geram uma única aba)
		if (extractedData.length > 0) {
			const workbook = excelGenerator.createWorkbook();
			excelGenerator.addSheet(workbook, extractedData, sheetName);
			const excelBuffer = excelGenerator.writeWorkbook(workbook);

			// 4. Enviar o arquivo Excel para o cliente
			res.setHeader('Content-Disposition', `attachment; filename=${excelFileName}`);
			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			);
			res.send(excelBuffer);
		} else {
			res.status(404).json({ message: 'Nenhum dado tabular encontrado para extração.' });
		}
	} catch (error) {
		console.error('Erro ao processar PDF:', error);
		res.status(500).json({ message: `Erro interno do servidor: ${error.message}` });
	} finally {
		// Limpa o arquivo PDF temporário
		fs.unlink(pdfFilePath, (err) => {
			if (err) console.error('Erro ao deletar o arquivo temporário:', err);
		});
	}
};

module.exports = {
	convertPdfToExcel,
};
