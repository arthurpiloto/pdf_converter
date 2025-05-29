// src/utils/excelGenerator.js
const XLSX = require('xlsx');

const createWorkbook = () => {
	return XLSX.utils.book_new();
};

const addSheet = (workbook, data, sheetName) => {
	// Converte um array de arrays (dados) para uma planilha
	const worksheet = XLSX.utils.aoa_to_sheet(data);
	// Adiciona a planilha ao workbook
	XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
};

const writeWorkbook = (workbook) => {
	// Escreve o workbook para um buffer (que pode ser enviado como resposta HTTP)
	return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
};

module.exports = {
	createWorkbook,
	addSheet,
	writeWorkbook,
};
