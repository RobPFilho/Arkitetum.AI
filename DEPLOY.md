# Publicar o match.IA (checklist)

O código já está pronto pra isso — um único serviço Node hospeda a API **e** o
site (mesmo processo, mesma porta, ver `backend/src/server.js`). Falta só criar
as contas (grátis) nos serviços e conectar. Nenhum desses passos pode ser feito
por mim: exigem login/OAuth em contas que só vocês têm acesso. Sigam na ordem.

## 1. Banco de dados: MongoDB Atlas (grátis)

1. Crie uma conta em https://www.mongodb.com/cloud/atlas/register.
2. Crie um cluster gratuito (M0).
3. Em "Database Access", crie um usuário com senha.
4. Em "Network Access", libere `0.0.0.0/0` (qualquer IP — ok pra um TCC).
5. Em "Connect" → "Drivers", copie a *connection string*
   (`mongodb+srv://usuario:senha@cluster.../matchia`).

## 2. Código no GitHub

Já está — https://github.com/natanaelmgs04/TCC---MatchAI. Qualquer alteração
nova: `git add`, `git commit`, `git push` na branch `main`.

**Atenção**: `backend/KEYS.env` está no `.gitignore` — as chaves do Gemini,
Unsplash e o `JWT_SECRET` não vão pro GitHub. Confiram com `git status` antes
de qualquer commit que nenhum arquivo de segredo apareça.

## 3. Hospedagem: Render (grátis)

Um serviço só, cuidando de tudo (API + site):

1. Crie uma conta em https://render.com (dá pra logar com o GitHub direto).
2. "New" → "Blueprint" → selecione o repositório — o Render vai ler o
   `backend/render.yaml` que já está pronto no projeto.
3. Quando pedir as variáveis de ambiente, preencham:
   - `MONGODB_URI`: a connection string do Atlas (passo 1), trocando `/matchia`
     no final se o nome do banco for diferente.
   - `GEMINI_API_KEY`: a chave que já está em `backend/KEYS.env` local.
   - `UNSPLASH_ACCESS_KEY`: idem, já está em `backend/KEYS.env` local.
   - `EMAIL_*`: opcional — só se quiserem e-mail de verdade (senão, o
     e-mail simulado no console continua funcionando normalmente).
   - `JWT_SECRET`: o Render pode gerar um valor aleatório sozinho.
4. Depois do deploy, a URL pública (algo como
   `https://matchia.onrender.com`) já serve o site inteiro — não precisa de
   nenhum outro serviço (Vercel, Netlify etc.), nem trocar nada em
   `assets/js/api.js` (ele já usa um caminho relativo, `/api`, que funciona
   em qualquer domínio).
5. Rodem os seeds contra o banco de produção (uma vez só), do seu
   computador, apontando pra connection string do Atlas: em
   `backend/KEYS.env`, troque `MONGODB_URI` temporariamente pela do Atlas e
   rode `npm run seed:architects` e `npm run seed:demo` (dentro de
   `backend/`) — depois volte o `KEYS.env` local pro Mongo local, se quiser
   continuar testando local.

   > O plano gratuito do Render "dorme" depois de alguns minutos sem uso —
   > a primeira requisição depois disso demora ~30s pra acordar. Se for
   > demonstrar ao vivo, acessem o site uns minutos antes pra "esquentar".

## 4. Checklist final

- [ ] `https://SEU-APP.onrender.com/api/health` responde `{"status":"ok"}`
- [ ] `https://SEU-APP.onrender.com` carrega a home do site
- [ ] `https://SEU-APP.onrender.com/destaques.html` carrega arquitetos de verdade
- [ ] Login com a conta demo (`demo@matchia.com` / `MatchIA@Demo2026`) funciona
- [ ] Um match rodado no site publicado retorna resultados reais
