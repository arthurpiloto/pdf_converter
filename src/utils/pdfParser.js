// src/utils/pdfParser.js
const pdf = require('pdf-parse');
const fs = require('fs');

const extractText = async (filePath) => {
	try {
		const dataBuffer = fs.readFileSync(filePath);
		const data = await pdf(dataBuffer);
		return data.text;
	} catch (error) {
		console.error('Erro ao extrair texto do PDF:', error);
		throw new Error('Falha ao extrair texto do PDF.');
	}
};

module.exports = {
	extractText,
};
