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

  // Mesmas fotos de perfil já usadas no diretório de arquitetos
  // (destaques.js) — reaproveitadas aqui pro card compacto do ranking.
  const PROFILE_PHOTOS = [
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&h=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&h=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
  ];

  function projectCardHtml(c) {
    return `
      <div class="showcase-card spotlight tilt">
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
    ].filter(Boolean).join('');
    const location = [a.city, a.state].filter(Boolean).join(' · ') || 'Localização não informada';
    const photo = PROFILE_PHOTOS[i % PROFILE_PHOTOS.length];
    return `
      <div class="arch-card arch-card-compact">
        <a href="arquiteto.html?id=${a.id}" class="arch-card-link">
          <div class="arch-card-photo">
            <img src="${photo}" alt="" loading="lazy">
            <span class="arch-card-rank">${i + 1}</span>
          </div>
          <div class="arch-card-body">
            <h4>${a.name}</h4>
            <span class="arch-card-meta">${location}${a.avgRating ? ` · ★ ${a.avgRating}` : ''}</span>
            ${badges ? `<div class="arch-card-badges">${badges}</div>` : ''}
          </div>
        </a>
      </div>`;
  }

  const prevBtn = document.getElementById('showcasePrev');
  const nextBtn = document.getElementById('showcaseNext');
  let carousel3d = null;

  try {
    const [caseStudies, archResult] = await Promise.all([
      MatchAPI.featuredCaseStudies(12),
      MatchAPI.architects({ pageSize: 5 }),
    ]);

    // Carrossel 3D exige espaço e alguns cards pra fazer sentido girar;
    // window.ProjectCarousel3D.create já recusa sozinho (retorna null) em
    // prefers-reduced-motion, telas pequenas ou poucos itens — nesses casos
    // caímos na lista simples com scroll que já existia.
    carousel3d = window.ProjectCarousel3D?.create(track, caseStudies) || null;

    if (!carousel3d) {
      track.innerHTML = caseStudies.length
        ? caseStudies.map(projectCardHtml).join('')
        : '<p class="showcase-empty">Ainda não temos projetos publicados o suficiente — os primeiros matches confirmados aparecerão aqui.</p>';
    }

    ranking.innerHTML = archResult.architects.length
      ? archResult.architects.map(rankingItemHtml).join('')
      : '<p class="showcase-empty">Nenhum arquiteto cadastrado ainda.</p>';
  } catch {
    track.innerHTML = '<p class="showcase-empty">Não foi possível carregar a vitrine agora.</p>';
    ranking.innerHTML = '';
  }

  prevBtn?.addEventListener('click', () => {
    if (carousel3d) carousel3d.prev();
    else track.scrollBy({ left: -320, behavior: 'smooth' });
  });
  nextBtn?.addEventListener('click', () => {
    if (carousel3d) carousel3d.next();
    else track.scrollBy({ left: 320, behavior: 'smooth' });
  });
});
