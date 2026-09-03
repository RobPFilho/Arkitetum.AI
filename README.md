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

**Um processo só serve tudo** — o Express em `backend/src/server.js` responde a API
(`/api/*`) e também o site estático (HTML/CSS/JS da raiz), na mesma porta:

```bash
npm install --prefix backend   # só na primeira vez
npm run dev
```

Depois acesse **`http://localhost:3000`** — é a mesma URL pro site e pra API, não tem
mais duas portas nem dois processos pra coordenar. Em desenvolvimento os arquivos do site
são servidos sem cache (headers `Cache-Control: no-store`), então uma alteração em
qualquer arquivo aparece no reload sem precisar de Ctrl+Shift+R.

`Ctrl+C` encerra tudo. Se preferir, `cd backend && npm run dev` faz exatamente a mesma
coisa (o comando na raiz só delega pra lá).

Sem o MongoDB no ar, o servidor não sobe (a conexão é obrigatória no `connectDatabase()`);
com o Mongo no ar mas alguma chave de API faltando (Gemini, Unsplash), as funcionalidades
de IA caem em respostas padrão em vez de falhar — ver `KEYS.env`.

## Publicando (Arkitetum.AI de referência)

Como o site e a API agora são o mesmo processo, publicar é só subir a pasta `backend/`
inteira (que inclui o site na raiz do projeto, um nível acima) num serviço Node — ver
`DEPLOY.md` pro passo a passo com Render. O repositório de referência original,
[Arkitetum.AI](https://github.com/RobPFilho/Arkitetum.AI), continua sendo a base do
back-end (rotas, modelos, autenticação) — este projeto é um fork local dele mais o
front-end e os módulos novos.

## Artefato 3D

`assets/3d/mansion-3d.html` é um estudo volumétrico interativo (three.js) de uma residência
contemporânea, usado como exemplo de "IA auxiliando no desenvolvimento do projeto" — é
carregado via `<iframe>` na home (`#ia-projeto`) e na página `projetos.html`.

## Módulos novos no back-end (mensagens, avaliações, moodboard, CAU)

A pasta `backend/` (clone local do Arkitetum.AI) recebeu 3 módulos aditivos — arquivos novos,
nada do código original do Roberto foi alterado além de 3 linhas em `server.js` (import +
`app.use`) e um campo novo em `User.js` (`architectProfile.cauVerification`):

- `POST /api/messages`, `GET /api/messages/:userId`, `GET /api/messages/conversations` — chat
  entre cliente e arquiteto (modelo `Message`).
- `POST /api/reviews`, `GET /api/reviews/:architectId` — avaliações com nota e comentário
  (modelo `Review`), exibidas no perfil público do arquiteto.
- `POST /api/moodboard` — gera um parágrafo de conceito visual via Gemini a partir do
  questionário do cliente (usa a mesma `GEMINI_API_KEY` do match; sem a chave, cai num texto
  padrão simples).
- `architectProfile.cauVerification: { number, status }` — o arquiteto solicita verificação
  pelo painel (`status` vira `"pending"`); a equipe aprova manualmente. A forma recomendada é
  `npm run approve:cau -- email@do-arquiteto.com` (dentro de `backend/`) — atualiza o status
  para `"verified"` **e** dispara o e-mail de confirmação (real ou simulado, ver seção de
  e-mail abaixo). Rodar direto no Mongo (`db.users.updateOne(...)`) ainda funciona para
  ajustes rápidos, mas não passa pelo código da aplicação, então não envia o e-mail. Não
  existe (nem deveria existir, nesta fase) verificação automática contra a base pública do
  CAU/BR — a aprovação é sempre uma decisão humana da equipe.

**Antes de mandar isso pro repositório principal**, esses arquivos precisam da revisão do
Roberto — não fizemos `git push`, só editamos o clone local em `backend/`.

## Chave da IA (Gemini) e arquitetos fictícios de demonstração

- A `GEMINI_API_KEY` usada por `geminiService.js` (explicações de compatibilidade) e
  `moodboardController.js` (moodboard) fica **só** em `backend/KEYS.env` (arquivo local,
  no `.gitignore`, nunca enviado ao front-end nem logado no console) — é uma chave paga,
  então os dois módulos usam o modelo mais econômico disponível, `gemini-3.5-flash-lite`
  (o `gemini-1.5-flash` original foi descontinuado pelo Google), e nenhuma chamada extra de
  IA foi adicionada além dessas duas já existentes, para não estourar o plano.
- `npm run seed:architects` (dentro de `backend/`) cria 10 arquitetos fictícios com estilos,
  materiais, cidades e experiências variadas, só para o algoritmo de match ter bons
  resultados neste protótipo (identificáveis pelo domínio de e-mail
  `@match.arquitetos.demo`). É seguro rodar mais de uma vez — o script pula quem já existe.

## Múltiplos projetos, mensagens não lidas, e-mail e mais robustez no back-end

- **Múltiplos projetos do cliente**: além do perfil principal (dados do cadastro), o cliente
  pode criar projetos extras no painel ("Meus projetos" em `dashboard.html`) — cada um com
  seu próprio estilo, orçamento, materiais e objetivos — e rodar um match separado para cada
  um (`POST /api/matches/run` aceita `{ projectId }` opcional; sem ele, usa o perfil do
  cadastro como antes). Modelo novo `Project` + rotas em `/api/projects`. O limite do plano
  Gratuito (1 projeto extra) é o mesmo tipo de checagem client-side já usado no restante do
  freemium — não é uma trava de segurança real, só a régua do modelo de negócio.
- **Mensagens não lidas**: `Message` ganhou o campo `read`; a lista de conversas
  (`GET /api/messages/conversations`) retorna `unreadCount` por conversa, e
  `GET /api/messages/unread-count` alimenta um contador visível na navbar (em qualquer
  página logada) e nos cards de "Mensagens" do painel.
- **Arquitetos em destaque** (`destaques.html`): página pública com todos os arquitetos
  cadastrados, filtrável por estilo, usando o novo `GET /api/architects` (lista) — antes só
  existia a busca por id.
- **E-mail transacional simulado**: `backend/src/services/emailService.js` envia (ou simula,
  se não houver SMTP configurado em `KEYS.env`) um e-mail de boas-vindas no cadastro e um
  aviso de nova mensagem no chat. Sem `EMAIL_HOST`/`EMAIL_USER`/`EMAIL_PASS`, o e-mail só é
  registrado no console do servidor — nada quebra, nenhum e-mail real sai.
- **Robustez do back-end**: todo handler assíncrono agora passa por `asyncHandler`, então um
  erro de validação do Mongoose (ex.: campo obrigatório faltando) responde 400 ao cliente em
  vez de derrubar o processo Node inteiro (bug real encontrado e corrigido nesta rodada). As
  rotas de IA (`/api/matches/run`, `/api/moodboard`) agora têm limite de 30 chamadas/hora por
  usuário, para não estourar o plano pago do Gemini por engano.
- **Histórico de buscas**: `GET /api/matches/history` lista as últimas 20 buscas do cliente
  (com projeto, resultados e pontuação), exibido no painel em "Histórico de buscas".
- **Validação mútua do resumo do projeto, agora real**: antes o botão "validar" do cliente e
  do arquiteto só gravava no `localStorage` (inclusive o do arquiteto era um "simular"
  clicado pelo próprio cliente). Agora existe o modelo `Validation` (`client`, `architect`,
  `clientConfirmed`, `architectConfirmed`) e as rotas `/api/validations` — o cliente confirma
  do lado dele, e o arquiteto vê um card "Resumos para confirmar" no painel dele e confirma
  de verdade, sem o cliente poder fingir essa parte.
- **Exportar comparativo em PDF**: o comparador lado a lado ganhou um botão de exportação,
  reaproveitando o mesmo mecanismo de impressão do resumo do projeto.

## Mais 5 rodadas: e-mail de fechamento, limite de chat, selo de validação, filtros e testes

- **E-mail quando as duas partes confirmam o resumo**: ao fechar a validação mútua
  (`clientConfirmed` e `architectConfirmed` os dois `true`), cliente e arquiteto recebem um
  e-mail (real ou simulado) avisando que o resumo foi confirmado — só dispara uma vez, na
  transição, não a cada nova chamada do endpoint.
- **Limite de mensagens no plano Gratuito**: `MatchExtras.PLANS.client.free.maxVisibleMessages`
  e o equivalente do arquiteto (ambos = 5; Premium/Pro = ilimitado). O chat mostra só as
  últimas N mensagens de cada conversa no plano Gratuito, com aviso e botão de upgrade —
  mesma régua de freemium client-side já usada no resto do site.
- **Selo "Resumo validado"**: aparece como linha no comparador lado a lado (cliente) e como
  selo "✓ Resumo validado com você" no perfil público do arquiteto (`arquiteto.html`), quando
  as duas partes já confirmaram o resumo daquele match.
- **Filtros e paginação em "Arquitetos em destaque"**: além do filtro por estilo, agora dá
  para filtrar por cidade (com debounce) e experiência mínima, e a lista pagina 9 por vez com
  "Carregar mais" — tudo resolvido no back-end (`GET /api/architects` aceita `city`,
  `minExperience`, `page`, `pageSize`).
- **Testes automatizados do algoritmo de match**: `backend/tests/scoringEngine.test.js` cobre
  cada fator de pontuação isoladamente (estilo, material, localização, especialidade,
  disponibilidade, experiência, os tetos/caps de cada um) e o `rankArchitects` (filtra score
  zero, ordena, limita a 4). Rodar com `npm test` dentro de `backend/`.

## Navbar

O menu foi ajustado depois de crescer para 8 links: fonte um pouco menor (0.85rem),
espaçamento mais enxuto, e o breakpoint do menu hambúrguer subiu de 900px para 1180px (com 8
links + logo + ações, esse é o ponto real onde para de caber numa linha só). Também corrigido
um bug em que o menu mobile (`position: fixed` com `inset: 72px 0 0 0`) calculava altura
errada nesta ferramenta de preview — trocado por `top/left/right` + `height: calc(100vh -
72px)` explícitos, que é mais robusto entre navegadores.

## Assinatura (freemium) e outras funcionalidades novas

- **Planos** (`planos.html`): cliente Gratuito (3 buscas/mês, 2 resultados) vs Premium R$29/mês;
  arquiteto Gratuito (3 projetos) vs Pro R$49/mês. O "checkout" é uma simulação (sem gateway de
  pagamento) — ver `assets/js/checkout.js` e `MatchExtras.setPlan` em `assets/js/extras.js`.
- **Modo escuro**: botão 🌓 na navbar, alterna sistema/claro/escuro (`assets/js/theme.js`).
- **PWA**: `manifest.json` + `sw.js` (service worker "network-first" — nunca esconde uma
  atualização recente atrás de cache).
- **Exportar PDF, moodboard com IA, comparador de arquitetos, compartilhar perfil (link + QR)**:
  tudo no painel (`dashboard.html` / `assets/js/dashboard.js`).

## Preparação para a pré-banca (30/09)

- **Conta de demonstração pronta**: `npm run seed:demo` (dentro de `backend/`) recria do zero
  a conta `demo@matchia.com` / `MatchIA@Demo2026` com perfil completo, um projeto extra, um
  match já rodado de verdade (via `scoringEngine`), conversa, avaliação e resumo do projeto
  já validado pelos dois lados — tudo pronto pra abrir e mostrar, sem precisar cadastrar nada
  ao vivo. Roda de novo sempre que precisar resetar o estado da demo.
- **Decomposição visual da pontuação**: cada resultado de match tem um botão "Ver detalhes da
  pontuação" mostrando os 6 critérios do `scoringEngine` em barras (estilo, materiais,
  localização, especialidade, disponibilidade, experiência) — reforça visualmente a explicação
  em texto que a IA já gera.
- **LGPD — baixar dados / excluir conta**: no painel, qualquer usuário pode baixar um JSON com
  tudo que a plataforma guarda sobre ele (`GET /api/dashboard/me/export`) ou apagar a conta
  permanentemente (`DELETE /api/dashboard/me`, com cascata em projetos, mensagens, avaliações,
  histórico e validações).
- **Estatística real na home**: o "X% de compatibilidade média" do hero agora vem de
  `GET /api/stats` (média real de todas as buscas já rodadas), com `95%` como valor de
  reserva caso o banco esteja vazio ou a API esteja fora do ar.
  ⚠️ **atenção**: como o motor de match soma 0 pontos em qualquer critério não preenchido, o
  número real cai bastante se houver muitas buscas de teste com perfil incompleto no banco
  (aconteceu durante o desenvolvimento — a média real ficou em ~28%, bem abaixo do "95%"
  ilustrativo dos cards de exemplo na mesma página). Antes da banca, rodem alguns matches
  com a conta demo (perfil completo) ou considerem excluir buscas de teste antigas via
  `db.matchhistories.deleteMany(...)` no Mongo, senão o número real pode contradizer o
  exemplo ilustrativo ao lado.
- **Página 404 personalizada**: `404.html` na raiz, servida pelo `serve.py` para qualquer
  URL inexistente (antes era o erro cru do Python).
- **Deploy**: ver `DEPLOY.md` — checklist completo pra publicar em MongoDB Atlas + Render
  (back-end) + Vercel (front-end), todos com plano gratuito. Exige contas próprias da equipe
  em cada serviço (login/OAuth), então não é algo que a IA consegue fazer sozinha — o
  `backend/render.yaml` e a troca de `PRODUCTION_BASE` em `assets/js/api.js` já estão prontos
  pra quando vocês chegarem nessa etapa.
- **Roteiro da apresentação**: documento separado com checklist, ordem sugerida de telas,
  tabela "real vs. simulado" e perguntas prováveis da banca — pedir o link ao Natanael/Claude
  se precisar de novo.

## Referência visual real (foto, não geração de imagem)

Botão "🖼 Ver referência visual" ao lado do moodboard, no painel do cliente
(`POST /api/moodboard/reference-image`): busca uma foto real de arquitetura/interiores
parecida com o estilo/materiais/palavras-chave do cliente, via **API do Unsplash**
(banco de fotos gratuito, sem cartão, licenciado para uso livre — chave em
`UNSPLASH_ACCESS_KEY` no `KEYS.env`, servidor apenas).

Decidimos por isso em vez de gerar a imagem com IA (Gemini "Nano Banana" ou DALL-E)
porque geração de imagem é paga desde a primeira chamada em qualquer provedor testado
(~$0,04/imagem no Gemini, sem camada gratuita) — buscar uma foto real já existente
resolve o mesmo problema ("é mais ou menos assim que você imagina?") sem custo nenhum.
O texto em português do cliente é traduzido pra uma busca em inglês pelo Gemini
(reaproveitando a mesma chamada de texto, dentro do limite gratuito); se o Gemini
falhar, cai num dicionário de tradução simples do vocabulário fixo de estilos/materiais
do site, então a busca nunca quebra por causa da tradução. Toda foto exibida credita o
fotógrafo e o Unsplash com link, conforme exigido pela licença da API.

## Formulário de cadastro "inteligente" e banco de materiais real

- **Banco de materiais com fotos reais**: `npm run seed:materials` agora busca uma foto
  real e distinta no Unsplash pra cada um dos 18 materiais (antes, todos usavam a mesma
  imagem genérica — o "banco de materiais" existia no código mas não cumpria o que a
  própria página `projetos.html` prometia). O `Material` ganhou os campos
  `photographerName`/`photographerUrl` pra manter a atribuição correta.
- **Chips de material com miniatura**: no cadastro (cliente e arquiteto), cada chip de
  material agora mostra a foto do próprio banco de materiais ao lado do nome — não é
  mais só texto. Função `buildChipList` em `cadastro.js` ganhou suporte a `item.thumb`.
- **Prévia visual no resumo do cadastro**: a última etapa do cadastro (antes de criar a
  conta) busca automaticamente uma referência visual real no Unsplash a partir dos
  estilos e materiais escolhidos nas etapas anteriores — "É mais ou menos assim que
  você imagina?" — pra cliente e arquiteto. Como isso acontece antes de existir conta/
  token, criei uma rota pública `POST /api/moodboard/preview` (sem login, limitada por
  IP a 20/hora, já que não dá pra identificar o usuário ainda).

## Mais integrações do Unsplash e finalização do painel

- **Referência visual do arquiteto, calculada uma vez e cacheada**: `architectProfile.referenceImage`
  guarda a foto real gerada a partir do estilo/materiais do arquiteto — calculada na
  primeira vez que alguém precisa dela (`GET /api/architects/:id/reference-image`) e
  reaproveitada depois por qualquer cliente, em qualquer lugar. Isso é o que permite os
  dois itens abaixo sem estourar o limite de 50 buscas/hora do Unsplash: um arquiteto
  popular nos resultados de match não gera uma busca nova a cada clique, só na primeira vez.
  - **Perfil público do arquiteto**: card "Referência visual" ao lado da paleta de estilo.
  - **Resultados de match**: miniatura de 56x56px ao lado do nome de cada arquiteto sugerido.
- **Banco de materiais e blog**: o banco de materiais já usa fotos reais (seção acima); os
  3 posts do blog já tinham capas reais do Unsplash desde antes — conferido que continuam
  no ar.
- **Checklist de onboarding do arquiteto**: card "Complete seu perfil" no painel,
  mostrando o que falta (bio, portfólio, materiais favoritos, perfil de estilo,
  verificação CAU) — só aparece enquanto houver pendência, some sozinho quando tudo
  estiver completo.
- **E-mail ao receber avaliação**: mesmo padrão dos outros e-mails (simulado sem SMTP
  configurado) — o arquiteto é avisado quando um cliente avalia o atendimento.

## Bug importante corrigido: navbar não detectava login em lugar nenhum

`site.js` checava `window.MatchAPI` pra saber se a API carregou, mas `MatchAPI` é
declarado com `const` no topo de `api.js` — e `const`/`let` no nível raiz de um script
clássico **não** viram propriedade de `window` (só `var`/`function` viram). Resultado:
essa checagem sempre dava falso, então em toda página do site (fora do próprio painel)
a navbar mostrava "Entrar/Cadastrar" mesmo com o usuário logado, o contador de mensagens
não lidas nunca aparecia, e a estatística real da home nunca calculava. Corrigido
trocando as 3 ocorrências por `typeof MatchAPI !== 'undefined'`, que funciona
independente de como a variável foi declarada. Vale testar de novo o "Entrar" vs. nome
do usuário na navbar de cada página depois de long tempo sem revisar isso.

## Filtro de avaliação, comparador público, notificações, PDF do match e indicação

- **Filtro por avaliação + comparador em `destaques.html`**: `GET /api/architects` agora
  calcula a média de avaliações por arquiteto via `$lookup` na coleção `reviews` (campo
  `minRating` no filtro). Cada card tem uma caixa "Comparar" (até 4 arquitetos) que abre
  o mesmo tipo de tabela comparativa do painel, sem precisar estar logado.
- **Central de notificações no site**: sino 🔔 na navbar (visível logado, qualquer
  página) agregando os eventos que já existiam como e-mail — mensagem nova, avaliação
  recebida, resumo validado, CAU aprovado, e agora também indicação — model `Notification`
  novo, rotas `/api/notifications` (`GET /`, `GET /unread-count`, `POST /read-all`).
- **Exportar resultados do match em PDF**: reaproveita o mesmo mecanismo de impressão já
  usado pro resumo do projeto e pelo comparativo.
- **Programa de indicação real**: cada usuário tem um link próprio
  (`cadastro.html?ref=<seu-id>`) no card "Convide e ganhe" do painel. Quem se cadastra
  por esse link grava `referredBy` no próprio usuário (campo novo em `User`), e quem
  indicou ganha um bônus real e persistido: +1 busca de match (cliente,
  `clientProfile.bonusMatches`) ou +1 vaga de portfólio (arquiteto,
  `architectProfile.bonusPortfolioSlots`) — somado ao limite do plano em todos os
  lugares que checam esse limite no painel.
