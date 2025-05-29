// src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garante que o diretório de uploads exista
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

// Configuração do armazenamento do Multer
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Define o diretório onde os arquivos serão salvos temporariamente
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// Define o nome do arquivo, usando o nome original e um timestamp para evitar colisões
		cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
	},
});

// Configuração do Multer
const upload = multer({
	storage: storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB para o arquivo
	fileFilter: (req, file, cb) => {
		// Filtra para aceitar apenas arquivos PDF
		const filetypes = /pdf/;
		const mimetype = filetypes.test(file.mimetype);
		const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

		// Se o MIME type e a extensão corresponderem a PDF, Aceita o arquivo.
		if (mimetype && extname) {
			return cb(null, true);
		}
		cb(new Error('Apenas arquivos PDF são permitidos!'));
	},
});

module.exports = upload;
