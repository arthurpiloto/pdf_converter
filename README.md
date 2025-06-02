# Pró-Reitoria de Ensino de Graduação (PROEN)

## 📄 Descrição

Este projeto visa a conversão automatizada de relatórios em PDF, contendo dados qualitativos dos alunos da UFSJ, para planilhas do Excel devidamente formatadas. O principal objetivo é estruturar esses dados para facilitar a administração e o uso no PowerBI, que popula o Portal de Egressos dentro da aplicação Web da PROEN.

A aplicação é capaz de analisar diferentes padrões de documentos PDF (como espectros de renda, matrículas por nível, dados de ingresso/egresso, e trancamentos por motivo) e transformar os dados de colunas e linhas de forma correta, gerando arquivos Excel organizados.

## 🛠️ Tecnologias

### Frontend (Interface do Usuário):

- HTML5: Estrutura da página web.

- CSS3: Estilização da interface.

- JavaScript: Lógica interativa no navegador.

- Tailwind CSS: Framework CSS para estilização rápida e responsiva.

### Backend (Processamento de Dados):

- Node.js: Ambiente de execução JavaScript no servidor.

- Express.js: Framework web para Node.js, utilizado para construir a API.

- `multer`: Middleware para Node.js, utilizado para lidar com o upload de arquivos PDF.

- `pdf-parse`: Biblioteca para extração de texto de PDFs com camada de texto.

- `xlsx`: Biblioteca para leitura, manipulação e escrita de arquivos Excel (.xlsx).

## ⚙️ Configurações

Siga estas instruções para configurar e executar a aplicação localmente para desenvolvimento e testes.

1. Clone o repositório:

```bash
git clone https://github.com/arthurpiloto/pdf_converter.git
cd pdf_converter
```

2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo de variáveis de ambiente:

    Na raiz do projeto, crie um arquivo chamado `.env` e adicione as seguintes variáveis:

```bash
PORT=3000
UPLOAD_DIR=./uploads
```

## 🧰 Iniciando o Servidor

Após instalar as dependências e configurar o `.env`, você pode iniciar o projeto de duas formas:

### 🛠 Modo Produção

```bash
npm start
```

> Este comando roda o servidor em **modo produção**. Ideal para quando o projeto estiver pronto para ser colocado no ar.

### 🛠 Modo Desenvolvimento

```bash
npm run dev
```

> Este comando usa o **nodemon** para reiniciar automaticamente o servidor a cada alteração no código.
> Ideal para testes e desenvolvimento.

> ⚠️ Se `npm run dev` não funcionar, instale o `nodemon` globalmente com:

```bash
npm install -g nodemon
```

### 🚀 Acesso à Aplicação

Abra seu navegador web e navegue para:

```bash
http://localhost:3000
```

## 💡 Uso da Aplicação

1. Selecione o PDF: Na interface da aplicação, clique no botão "Escolher arquivo" e selecione o arquivo PDF que deseja converter.

2. Inicie a Conversão: Clique no botão "Converter para Excel".

3. Aguarde: A aplicação processará o PDF.

4. Download do Excel: Uma vez concluída a conversão, o arquivo Excel será baixado automaticamente para o seu computador.

## 📄 Licença

Distribuído sob a Licença MIT. Veja [LICENSE](LICENSE) para mais informações.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para fazer um fork e enviar um pull request.
