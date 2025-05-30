// src/controllers/convertController.js
const fs = require('fs');
const pdfParser = require('../utils/pdfParser');
const excelGenerator = require('../utils/excelGenerator');
const dataExtractors = require('../utils/dataExtractors');

const convertPdfToExcel = async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: 'Nenhum arquivo PDF enviado.' });
	}

	const pdfFilePath = req.file.path;
	let excelFileName = `${req.file.originalname.replace(/\.pdf$/i, '')}.xlsx`;
	let workbook = null;
	let extractedData = [];
	let sheetName = 'Dados Extraídos';

	try {
		// 1. Extrair texto do PDF
		const pdfText = (await pdfParser.extractText(pdfFilePath)).toLowerCase();

		// 2. Detectar o tipo de PDF e extrair dados
		if (
			pdfText.includes('lista do espectro de renda') &&
			pdfText.includes('número de saláriosnúmero de alunos')
		) {
			extractedData = dataExtractors.extractEspectroDeRenda(pdfText);
			sheetName = 'Espectro de Renda';
			excelFileName = 'espectro_de_renda.xlsx';
		} else if (
			pdfText.includes('relatório quantitativo de alunos matriculados') &&
			pdfText.includes('ano-semestre matrícula:')
		) {
			const { gradData, postGradData, totalGeral } =
				dataExtractors.extractGeralMatriculaNiveis(pdfText);

			workbook = excelGenerator.createWorkbook();

			if (gradData.length > 1) {
				excelGenerator.addSheet(workbook, gradData, 'Graduação');
			}
			if (postGradData.length > 1) {
				excelGenerator.addSheet(workbook, postGradData, 'Pós-Graduação');
			}
			if (totalGeral.length > 1) {
				excelGenerator.addSheet(workbook, totalGeral, 'Total Geral');
			}

			excelFileName = 'quantitativo_alunos_matriculados.xlsx';
		} else {
			// Se nenhuma condição específica de PDF for encontrada, exporta texto bruto
			extractedData = [['Texto Bruto do PDF']];
			extractedData.push([pdfText]);
			sheetName = 'Texto Bruto';
		}

		// 3. Gerar e enviar o arquivo Excel (Lógica Centralizada)
		if (!workbook && extractedData.length > 0) {
			workbook = excelGenerator.createWorkbook();
			excelGenerator.addSheet(workbook, extractedData, sheetName);
		}

		if (workbook && workbook.SheetNames.length > 0) {
			const excelBuffer = excelGenerator.writeWorkbook(workbook);

			// 4. Enviar o arquivo Excel para o cliente
			res.setHeader('Content-Disposition', `attachment; filename=${excelFileName}`);
			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			);
			res.send(excelBuffer);
		} else {
			// Se nenhum dado foi extraído ou o workbook não foi populado
			res.status(404).json({
				message:
					'Nenhum dado tabular encontrado para extração ou o PDF não pôde ser processado.',
			});
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
