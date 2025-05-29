// src/routes/convertRoutes.js
const express = require('express');
const convertController = require('../controllers/convertController');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Rota para converter PDF para Excel
// 'pdfFile' é o nome do campo no formulário que conterá o arquivo PDF
router.post('/convert', upload.single('pdfFile'), convertController.convertPdfToExcel);

module.exports = router;
