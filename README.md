# match.IA — Site (Front-end)

Site institucional e aplicação web do **match.IA**, projeto de TCC (FIAP School) que conecta
clientes e arquitetos por meio de compatibilidade calculada por Inteligência Artificial.

Front-end estático (HTML + CSS + JS puro, sem build step) construído a partir da identidade
visual e da documentação do TCC, com integração pronta para o back-end de referência
[Arkitetum.AI](https://github.com/RobPFilho/Arkitetum.AI) (Node.js + Express + MongoDB).

## Estrutura

```
index.html         Landing page (hero, como funciona, match inteligente, 3D, CTA)
cadastro.html       Cadastro de cliente/arquiteto (POST /api/auth/register/:role)
login.html          Login (POST /api/auth/login)
dashboard.html       Painel autenticado — match para clientes, portfólio para arquitetos
arquiteto.html       Perfil público de arquiteto (GET /api/architects/:id)
projetos.html         IA + estudo volumétrico 3D interativo + banco de materiais
sobre.html           Empresa, modelo de negócio, mercado e time (a partir do TCC)
blog.html            Blog institucional (stub)
assets/css/style.css  Design system (cores, tipografia, componentes)
assets/js/api.js      Cliente da API (fetch + sessão em localStorage)
assets/js/*.js         Lógica de cada página
assets/img/mark.svg   Símbolo da marca (casa + pessoas + arco tecnológico)
assets/3d/            Estudo volumétrico 3D interativo (three.js), embutido via <iframe>
```

## Identidade visual

- **Cores**: Off-white quente `#FAF9F6`, Bege areia `#EEE3DA`, Verde sálvia `#7B8E7E`,
  Terracota/cobre `#B0755A`, Grafite `#333333`.
- **Tipografia**: Playfair Display (títulos) + Inter (corpo de texto).
- **Símbolo**: casa (arquitetura) + pessoas (cliente e arquiteto) + arco com circuitos
  (tecnologia/IA) — ver `assets/img/mark.svg`.

## Rodando localmente

Use o `serve.py` incluído no projeto — ele desliga o cache do navegador, então uma
alteração em qualquer arquivo aparece no reload sem precisar de Ctrl+Shift+R:

```bash
python serve.py 8080
```

Depois acesse `http://localhost:8080`. (Qualquer outro servidor estático também funciona,
já que os módulos JS e o `fetch` só exigem `http://`, não `file://` — mas sem
cabeçalhos anti-cache, um `python -m http.server` puro pode "esconder" alterações
recentes atrás do cache do navegador.)

## Conectando ao back-end (Arkitetum.AI)

1. Clone e rode o back-end: https://github.com/RobPFilho/Arkitetum.AI
   (`npm install`, `npm run seed:materials`, `npm run dev` — sobe em `http://localhost:3000`).
2. O front-end já aponta por padrão para `http://localhost:3000/api`
   (ver `DEFAULT_BASE` em `assets/js/api.js`).
3. Para apontar para uma API publicada, rode no console do navegador:
   ```js
   localStorage.setItem('matchia_api_base', 'https://sua-api.exemplo.com/api')
   ```

Sem o back-end no ar, o site continua navegável: formulários mostram um aviso de conexão e
páginas com dados dinâmicos (materiais, cadastro) usam listas de referência offline.

## Artefato 3D

`assets/3d/mansion-3d.html` é um estudo volumétrico interativo (three.js) de uma residência
contemporânea, usado como exemplo de "IA auxiliando no desenvolvimento do projeto" — é
carregado via `<iframe>` na home (`#ia-projeto`) e na página `projetos.html`.
