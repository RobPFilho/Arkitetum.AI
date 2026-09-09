/**
 * Vitrine pública de projetos que já viraram match na plataforma — substitui
 * o showcase 3D. Cada card só existe depois que cliente e arquiteto
 * confirmam o case de sucesso dos dois lados (CaseStudy.published no back-end),
 * então isso é prova real, não ilustração.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('showcaseGallery');
  const empty = document.getElementById('showcaseEmpty');
  if (!grid) return;

  function cardHtml(c) {
    const meta = [
      c.style ? `<span><strong>${c.style}</strong></span>` : '',
      c.areaM2 ? `<span>${c.areaM2} m²</span>` : '',
      c.compatibilityScore ? `<span>${c.compatibilityScore}% de compatibilidade</span>` : '',
    ].filter(Boolean).join('');
    return `
      <div class="showcase-card">
        <span class="verified-badge">✓ Match verificado</span>
        <div class="thumb">${c.image ? `<img src="${c.image}" alt="${c.title}" loading="lazy">` : ''}</div>
        <div class="info">
          <h3>${c.title}</h3>
          <p style="margin:0; font-size:0.84rem; color:var(--ink-faint);">${c.architectName}${c.architectCity ? ` · ${c.architectCity}` : ''}</p>
          <div class="showcase-meta">${meta}</div>
        </div>
      </div>`;
  }

  try {
    const items = await MatchAPI.allPublishedCaseStudies(9);
    if (!items.length) { grid.style.display = 'none'; empty.style.display = 'block'; return; }
    grid.innerHTML = items.map(cardHtml).join('');
  } catch {
    grid.style.display = 'none';
    empty.style.display = 'block';
  }
});
