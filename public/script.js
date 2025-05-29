// public/script.js
document.addEventListener('DOMContentLoaded', () => {
	const pdfInput = document.getElementById('pdfInput');
	const convertBtn = document.getElementById('convertBtn');
	const messagesDiv = document.getElementById('messages');
	const loadingIndicator = document.getElementById('loadingIndicator');

	convertBtn.addEventListener('click', async () => {
		const file = pdfInput.files[0];
		if (!file) {
			messagesDiv.textContent = 'Por favor, selecione um arquivo PDF.';
			messagesDiv.classList.remove('text-green-600', 'text-red-600');
			messagesDiv.classList.add('text-gray-600');
			return;
		}

		messagesDiv.textContent = ''; // Limpa mensagens anteriores
		loadingIndicator.classList.remove('hidden'); // Mostra o indicador de carregamento
		convertBtn.disabled = true; // Desabilita o botão durante o processamento

		const formData = new FormData();
		formData.append('pdfFile', file);

		try {
			const response = await fetch('/api/convert', {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.style.display = 'none';
				a.href = url;
				// Tenta obter o nome do arquivo do cabeçalho Content-Disposition
				const contentDisposition = response.headers.get('Content-Disposition');
				let filename = 'converted.xlsx';
				if (contentDisposition && contentDisposition.includes('filename=')) {
					filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
				}
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);

				messagesDiv.textContent =
					'Conversão bem-sucedida! Seu download deve começar em breve.';
				messagesDiv.classList.remove('text-gray-600', 'text-red-600');
				messagesDiv.classList.add('text-green-600');
			} else {
				const errorData = await response.json(); // Assumindo que o backend retorna JSON em caso de erro
				messagesDiv.textContent = `Erro: ${errorData.message || 'Ocorreu um erro na conversão.'}`;
				messagesDiv.classList.remove('text-gray-600', 'text-green-600');
				messagesDiv.classList.add('text-red-600');
			}
		} catch (error) {
			console.error('Erro de rede ou servidor inacessível:', error);
			messagesDiv.textContent =
				'Erro de rede ou servidor inacessível. Verifique se o backend está rodando.';
			messagesDiv.classList.remove('text-gray-600', 'text-green-600');
			messagesDiv.classList.add('text-red-600');
		} finally {
			loadingIndicator.classList.add('hidden'); // Esconde o indicador de carregamento
			convertBtn.disabled = false; // Reabilita o botão
			pdfInput.value = ''; // Limpa o input do arquivo
		}
	});
});
