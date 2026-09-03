# Publicar o match.IA (checklist)

O código já está pronto pra isso — falta só criar as contas (grátis) nos
serviços e conectar. Nenhum desses passos pode ser feito por mim: exigem
login/OAuth em contas que só vocês têm acesso. Sigam na ordem.

## 1. Banco de dados: MongoDB Atlas (grátis)

1. Crie uma conta em https://www.mongodb.com/cloud/atlas/register.
2. Crie um cluster gratuito (M0).
3. Em "Database Access", crie um usuário com senha.
4. Em "Network Access", libere `0.0.0.0/0` (qualquer IP — ok pra um TCC).
5. Em "Connect" → "Drivers", copie a *connection string*
   (`mongodb+srv://usuario:senha@cluster.../matchia`).

## 2. Subir o código pro GitHub

Na raiz do projeto (`MatchAI/`), ainda não é um repositório git. Rodem:

```bash
git init
git add .
git commit -m "Versão inicial do match.IA"
```

Criem um repositório vazio no GitHub e sigam as instruções que ele mostra
pra conectar (`git remote add origin ...` e `git push`).

**Atenção**: `backend/KEYS.env` já está no `.gitignore` — a chave do Gemini
e o `JWT_SECRET` não vão pro GitHub. Confiram com `git status` antes do
primeiro commit que nenhum arquivo de segredo aparece.

## 3. Back-end: Render (grátis)

1. Crie uma conta em https://render.com (dá pra logar com o GitHub direto).
2. "New" → "Blueprint" → selecione o repositório — o Render vai ler o
   `backend/render.yaml` que já está pronto no projeto.
3. Quando pedir as variáveis de ambiente, preencham:
   - `MONGODB_URI`: a connection string do Atlas (passo 1), trocando `/matchia`
     no final se o nome do banco for diferente.
   - `GEMINI_API_KEY`: a chave que já está em `backend/KEYS.env` local.
   - `EMAIL_*`: opcional — só se quiserem e-mail de verdade (senão, o
     e-mail simulado no console continua funcionando normalmente).
   - `JWT_SECRET`: o Render pode gerar um valor aleatório sozinho.
4. Depois do deploy, anotem a URL pública (algo como
   `https://matchia-backend.onrender.com`).
5. Rodem os seeds contra o banco de produção (uma vez só), do seu
   computador, apontando pra connection string do Atlas: em
   `backend/KEYS.env`, troque `MONGODB_URI` temporariamente pela do Atlas e
   rode `npm run seed:architects` e `npm run seed:demo` — depois volte o
   `KEYS.env` local pro Mongo local, se quiser continuar testando local.

   > O plano gratuito do Render "dorme" depois de alguns minutos sem uso —
   > a primeira requisição depois disso demora ~30s pra acordar. Se for
   > demonstrar ao vivo, acessem o site uns minutos antes pra "esquentar".

## 4. Front-end: Vercel (grátis)

1. Crie uma conta em https://vercel.com (também dá pra logar com GitHub).
2. "Add New" → "Project" → selecione o mesmo repositório.
3. Framework preset: "Other" (é HTML/CSS/JS puro, sem build). Root
   Directory: raiz do projeto (onde está o `index.html`).
4. Deploy. A Vercel dá uma URL tipo `https://matchia.vercel.app`.

## 5. Conectar o front no back-end publicado

Abram `assets/js/api.js` e troquem esta linha:

```js
const PRODUCTION_BASE = 'https://SEU-BACKEND.onrender.com/api';
```

pela URL real do passo 3 (com `/api` no final). Commitem e enviem
(`git add`, `git commit`, `git push`) — a Vercel republica sozinha a cada
push. Em `localhost` nada muda: o site continua usando o back-end local.

## 6. Checklist final

- [ ] `https://SEU-BACKEND.onrender.com/api/health` responde `{"status":"ok"}`
- [ ] O site publicado carrega arquitetos em `destaques.html`
- [ ] Login com a conta demo (`demo@matchia.com` / `MatchIA@Demo2026`) funciona
- [ ] Um match rodado no site publicado retorna resultados reais
