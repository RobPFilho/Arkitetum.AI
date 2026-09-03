# Arkitetum / Match.ai

Uma aplicação Node.js + MongoDB que conecta clientes e arquitetos. Ela usa um sistema de pontuação com peso e utiliza o Gemini para a expliação de cada pontuação.

## Como rodar o código

1. Clone o repositório para seu computador;
2. Copie o arquivo `KEYS.env` do Teams para a pasta raiz do projeto;
3. Abra a pasta do projeto no VSCode;
4. CTRL + J para abrir o terminal;
5. `npm install`(Caso não tenho o npm em seu computador.);
6. `npm run seed:materials`(Cadastra os materiais no banco de dados. Rodar apenas se o banco de dados estiver vazio, consultar Roberto.);
7. `npm install mongodb mongoose`(Atualiza as dependências do MongoDB para a versão mais recente.);
8. `npm run dev`(Comando para rodar o servidor.).

A interface básica se encontra em `http://localhost:3000`. rotas de API estão em `/api`.

## Flows principais

- `POST /api/auth/register/client` e `/architect` criam perfis específicos de cliente/arquiteto.
- `POST /api/auth/login` retorna um token de portador.
- `GET/PATCH /api/dashboard/me` recupera ou atualiza o perfil da conta conectada.
- `POST /api/dashboard/portfolio` permite que o arquiteto adicione um link de portfolio.
- `GET /api/materials` lista materiais semeáveis.
- `POST /api/matches/run` retorna os top 4 arquitetos mais compatíveis ao cliente.

Use `Authorization: Bearer <token>` para rotas protegidas. Gemini é opcional: o match ainda funciona sem IA porém retornará uma explicação genérica.
