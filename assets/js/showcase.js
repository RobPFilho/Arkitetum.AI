/**
 * Vitrine "projetos que já viraram match" — substitui o showcase 3D em
 * index.html/projetos.html. Duas colunas: carrossel de projetos reais com
 * match verificado (aprovação mútua) à esquerda, ranking dos arquitetos com
 * melhor mérito (nota + histórico de projetos fechados + bônus Pro, mesma
 * ordenação de destaques.html) à direita — um top-5 compacto, não um
 * substituto do diretório completo.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const track = document.getElementById('showcaseTrack');
  const ranking = document.getElementById('showcaseRanking');
  if (!track || !ranking) return;

  function projectCardHtml(c) {
    return `
      <div class="showcase-card">
        <div class="showcase-card-media">
          ${c.image ? `<img src="${c.image}" alt="${c.title}" loading="lazy">` : '<div class="showcase-card-noimg"></div>'}
          ${typeof c.compatibilityScore === 'number' ? `<span class="showcase-compat">${c.compatibilityScore}% match</span>` : ''}
        </div>
        <div class="showcase-card-info">
          <h4>${c.title}</h4>
          <p>${c.architectName || 'Arquiteto'}${c.style ? ` · ${c.style}` : ''}${c.areaM2 ? ` · ${c.areaM2} m²` : ''}</p>
        </div>
      </div>`;
  }

  function rankingItemHtml(a, i) {
    const badges = [
      a.isPro ? '<span class="badge-pro">★ Pro</span>' : '',
      a.isVerifiedTrackRecord ? '<span class="status-pill badge-validated">Trajetória verificada</span>' : '',
    ].filter(Boolean).join(' ');
    return `
      <a href="arquiteto.html?id=${a.id}" class="showcase-rank-item">
        <span class="showcase-rank-num">${i + 1}</span>
        <span class="showcase-rank-info">
          <strong>${a.name}</strong>
          <span>${[a.city, a.state].filter(Boolean).join(' · ') || 'Localização não informada'}${a.avgRating ? ` · ★ ${a.avgRating}` : ''}</span>
        </span>
        ${badges}
      </a>`;
  }

  try {
    const [caseStudies, archResult] = await Promise.all([
      MatchAPI.featuredCaseStudies(12),
      MatchAPI.architects({ pageSize: 5 }),
    ]);

    track.innerHTML = caseStudies.length
      ? caseStudies.map(projectCardHtml).join('')
      : '<p class="showcase-empty">Ainda não temos projetos publicados o suficiente — os primeiros matches confirmados aparecerão aqui.</p>';

    ranking.innerHTML = archResult.architects.length
      ? archResult.architects.map(rankingItemHtml).join('')
      : '<p class="showcase-empty">Nenhum arquiteto cadastrado ainda.</p>';
  } catch {
    track.innerHTML = '<p class="showcase-empty">Não foi possível carregar a vitrine agora.</p>';
    ranking.innerHTML = '';
  }

  document.getElementById('showcasePrev')?.addEventListener('click', () => track.scrollBy({ left: -320, behavior: 'smooth' }));
  document.getElementById('showcaseNext')?.addEventListener('click', () => track.scrollBy({ left: 320, behavior: 'smooth' }));
});
