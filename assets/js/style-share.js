/**
 * Cartão compartilhável do "perfil de estilo" do cliente — gerado 100% via
 * Canvas 2D (sem lib externa, sem servidor): desenha o cartão no cliente e
 * oferece só o download da imagem. Gancho de crescimento orgânico barato:
 * a pessoa recebe algo bonito pra postar, que carrega a marca match.IA.
 */
const StyleShare = (() => {
  const W = 1080, H = 1350;
  let overlay, canvas;

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'checkout-modal-overlay share-card-overlay';
    overlay.innerHTML = `
      <div class="checkout-modal share-card-modal" role="dialog" aria-modal="true" aria-label="Compartilhar perfil de estilo">
        <button type="button" class="founder-close share-card-close" aria-label="Fechar" style="position:absolute; top:14px; right:14px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>
        </button>
        <h3>Seu perfil de estilo</h3>
        <p style="color:var(--ink-soft); font-size:0.86rem; margin:0 0 16px;">Uma imagem pra postar ou mandar pra alguém — carrega junto o seu estilo e a marca match.IA.</p>
        <div class="share-card-preview"><canvas id="styleShareCanvas" width="${W}" height="${H}"></canvas></div>
        <div class="checkout-actions">
          <button type="button" class="btn btn-secondary" id="styleShareCloseBtn">Fechar</button>
          <button type="button" class="btn btn-primary" id="styleShareDownloadBtn">Baixar imagem</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    canvas = overlay.querySelector('#styleShareCanvas');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.share-card-close').addEventListener('click', close);
    overlay.querySelector('#styleShareCloseBtn').addEventListener('click', close);
    overlay.querySelector('#styleShareDownloadBtn').addEventListener('click', download);
  }

  function close() {
    if (overlay) overlay.classList.remove('open');
  }

  function download() {
    const link = document.createElement('a');
    link.download = 'meu-perfil-de-estilo-matchia.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || '').split(' ');
    let line = '', lines = [];
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
      else line = test;
    });
    if (line) lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
    return y + lines.length * lineHeight;
  }

  function drawPill(ctx, text, x, y, font, padX = 22, padY = 12) {
    ctx.font = font;
    const w = ctx.measureText(text).width + padX * 2;
    const h = 46;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fillStyle = 'rgba(176,117,90,0.12)';
    ctx.fill();
    ctx.fillStyle = '#B0755A';
    ctx.fillText(text, x + padX, y + h / 2 + 8);
    return w;
  }

  async function draw(user) {
    const ctx = canvas.getContext('2d');
    const p = user.clientProfile || {};
    const styles = (p.preferredStyles && p.preferredStyles.length) ? p.preferredStyles : ['Estilo em definição'];

    // Fundo — segue a mesma paleta off-white + glow do restante do site.
    ctx.fillStyle = '#FAF9F6';
    ctx.fillRect(0, 0, W, H);
    const grad1 = ctx.createRadialGradient(W * 0.9, H * 0.05, 50, W * 0.9, H * 0.05, 700);
    grad1.addColorStop(0, 'rgba(176,117,90,0.16)');
    grad1.addColorStop(1, 'rgba(176,117,90,0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, W, H);
    const grad2 = ctx.createRadialGradient(W * 0.05, H * 0.15, 50, W * 0.05, H * 0.15, 650);
    grad2.addColorStop(0, 'rgba(123,142,126,0.18)');
    grad2.addColorStop(1, 'rgba(123,142,126,0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, W, H);

    try { await document.fonts.load('700 32px Poppins'); await document.fonts.load('italic 700 64px "Playfair Display"'); await document.fonts.load('600 30px Inter'); await document.fonts.ready; } catch { /* segue com a fonte padrão do sistema se o carregamento falhar */ }

    // Wordmark
    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 40px Poppins, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText('match', 90, 130);
    const matchWidth = ctx.measureText('match').width;
    ctx.fillStyle = '#B0755A';
    ctx.fillText('.IA', 90 + matchWidth, 130);

    // Eyebrow
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillStyle = '#B0755A';
    ctx.fillText('MEU PERFIL DE ESTILO', 90, 260);
    ctx.fillRect(90, 280, 60, 5);

    // Estilo principal em destaque (serif itálico, como o .accent do site)
    ctx.font = 'italic 700 76px "Playfair Display", serif';
    ctx.fillStyle = '#333333';
    let y = 400;
    y = wrapText(ctx, styles[0], 90, y, W - 180, 84);

    // Nome do cliente
    ctx.font = '600 32px Inter, sans-serif';
    ctx.fillStyle = 'rgba(51,51,51,0.74)';
    ctx.fillText(user.name || '', 90, y + 40);

    // Pills de estilos adicionais
    let px = 90, py = y + 90;
    styles.slice(0, 4).forEach((s) => {
      ctx.font = '600 30px Inter, sans-serif';
      const w = ctx.measureText(s).width + 44;
      if (px + w > W - 90) { px = 90; py += 66; }
      px += drawPill(ctx, s, px, py, '600 30px Inter, sans-serif') + 16;
    });

    // Orçamento, se informado
    if (p.budget && (p.budget.min || p.budget.max)) {
      ctx.font = '600 28px Inter, sans-serif';
      ctx.fillStyle = 'rgba(51,51,51,0.68)';
      const budgetText = `Orçamento: R$${(p.budget.min || 0).toLocaleString('pt-BR')} – R$${(p.budget.max || '?').toLocaleString?.('pt-BR') || p.budget.max}`;
      ctx.fillText(budgetText, 90, py + 90);
    }

    // Rodapé com a mesma linha-gradiente da .eyebrow do site
    const gradLine = ctx.createLinearGradient(90, 0, 190, 0);
    gradLine.addColorStop(0, '#7B8E7E');
    gradLine.addColorStop(1, '#B0755A');
    ctx.fillStyle = gradLine;
    ctx.fillRect(90, H - 150, 100, 6);
    ctx.font = '600 28px Inter, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.fillText('Encontre seu arquiteto ideal com IA', 90, H - 100);
    ctx.font = '400 24px Inter, sans-serif';
    ctx.fillStyle = 'rgba(51,51,51,0.68)';
    ctx.fillText('match.IA', 90, H - 60);
  }

  async function open(user) {
    build();
    overlay.classList.add('open');
    await draw(user);
  }

  return { open, close };
})();
