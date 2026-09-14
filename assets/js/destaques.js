document.addEventListener('DOMContentLoaded', async () => {
  // Quem pede menos animação no sistema também não quer rolagem suave.
  const SCROLL_BEHAVIOR = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const STYLES = ['Moderno', 'Contemporâneo', 'Minimalista', 'Industrial', 'Clássico', 'Rústico', 'Escandinavo', 'Biofílico', 'Brutalista', 'Alto padrão'];
  // Mesmas fotos da vitrine "Estilos arquitetônicos" da home -- o filtro
  // vira uma miniatura do estilo em vez de só um nome, mais fácil de
  // reconhecer rápido numa lista de 10 opções.
  const STYLE_THUMBS = {
    'Moderno': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=80&q=70',
    'Contemporâneo': 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=80&q=70',
    'Minimalista': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=80&q=70',
    'Industrial': 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=80&q=70',
    'Clássico': 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=80&q=70',
    'Rústico': 'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5?auto=format&fit=crop&w=80&q=70',
    'Escandinavo': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=80&q=70',
    'Biofílico': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=80&q=70',
    'Brutalista': 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=80&q=70',
    'Alto padrão': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=80&q=70',
  };
  const grid = document.getElementById('archGrid');
  const empty = document.getElementById('archEmpty');
  const filters = document.getElementById('styleFilters');
  const cityFilter = document.getElementById('cityFilter');
  const experienceFilter = document.getElementById('experienceFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const PAGE_SIZE = 9;
  const MAX_COMPARE = 4;

  let activeStyle = '';
  let currentPage = 1;
  let loadedArchitects = [];
  let requestSeq = 0;
  const compareSelection = new Map();

  function ratingText(a) {
    return a.reviewCount ? `★ ${a.avgRating} (${a.reviewCount})` : 'Sem avaliações ainda';
  }

  function cardHtml(a) {
    const p = a.profile || {};
    const initials = a.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const verified = p.cauVerification?.status === 'verified' ? '<span class="status-pill badge-validated" style="margin-left:6px;">✓ Verificado</span>' : '';
    const proBadge = a.isPro ? '<span class="badge-pro" style="margin-left:6px;">★ Pro</span>' : '';
    const trackRecordBadge = a.isVerifiedTrackRecord ? '<span class="status-pill badge-validated" style="margin-left:6px;">Trajetória verificada</span>' : '';
    const checked = compareSelection.has(a.id) ? 'checked' : '';
    const location = [a.city, a.state].filter(Boolean).join(' · ') || 'Localização não informada';
    const experience = p.yearsExperience ? `${p.yearsExperience} anos de experiência` : 'Experiência não informada';
    return `
      <div class="architect-row">
        <a href="arquiteto.html?id=${a.id}" class="architect-row-link">
          <div class="architect-row-avatar">${initials}</div>
          <div class="architect-row-body">
            <h4>${a.name}${verified}${proBadge}${trackRecordBadge}</h4>
            <p class="muted">${location} · ${experience} · ${ratingText(a)}</p>
            <div class="tag-row">${(p.styles || []).slice(0, 3).map(s => `<span class="tag">${s}</span>`).join('') || ''}</div>
          </div>
        </a>
        <label class="architect-row-compare">
          <input type="checkbox" data-compare="${a.id}" ${checked}> Comparar
        </label>
      </div>`;
  }

  function buildFilters() {
    filters.innerHTML = `<button type="button" class="chip active" data-style="">Todos</button>` +
      STYLES.map(s => `<button type="button" class="chip has-thumb" data-style="${s}"><img class="chip-thumb" src="${STYLE_THUMBS[s]}" alt="" loading="lazy">${s}</button>`).join('');
    filters.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        filters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeStyle = chip.dataset.style;
        loadArchitects({ reset: true });
      });
    });
  }

  function currentParams(page) {
    return {
      style: activeStyle,
      city: cityFilter.value.trim(),
      minExperience: experienceFilter.value,
      minRating: ratingFilter.value,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  function bindCompareCheckboxes() {
    grid.querySelectorAll('[data-compare]').forEach(box => {
      box.addEventListener('click', (e) => e.stopPropagation());
      box.addEventListener('change', () => {
        const id = box.dataset.compare;
        if (box.checked) {
          if (compareSelection.size >= MAX_COMPARE) {
            box.checked = false;
            const note = document.getElementById('compareLimitNote');
            note.style.display = 'block';
            clearTimeout(note._hideTimer);
            note._hideTimer = setTimeout(() => { note.style.display = 'none'; }, 3000);
            return;
          }
          const arch = loadedArchitects.find(a => a.id === id);
          if (arch) compareSelection.set(id, arch);
        } else {
          compareSelection.delete(id);
        }
        updateCompareBar();
      });
    });
  }

  function skeletonCardHtml() {
    return `
      <div class="skeleton-result">
        <div class="skeleton-block avatar"></div>
        <div class="skeleton-lines">
          <div class="skeleton-block line" style="width:40%;"></div>
          <div class="skeleton-block line" style="width:70%;"></div>
          <div class="skeleton-block line" style="width:30%;"></div>
        </div>
      </div>`;
  }

  async function loadArchitects({ reset = false } = {}) {
    const seq = ++requestSeq;
    if (reset) {
      currentPage = 1;
      loadedArchitects = [];
      grid.innerHTML = skeletonCardHtml().repeat(PAGE_SIZE);
    }
    empty.style.display = 'none';
    loadMoreBtn.disabled = true;
    try {
      const { architects, hasMore, total } = await MatchAPI.architects(currentParams(currentPage));
      if (seq !== requestSeq) return; // uma busca mais recente já foi disparada, descarta esta resposta atrasada
      loadedArchitects = reset ? architects : loadedArchitects.concat(architects);
      const countLabel = document.getElementById('archResultCount');
      if (!loadedArchitects.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        loadMoreBtn.style.display = 'none';
        if (countLabel) countLabel.textContent = '';
        return;
      }
      if (countLabel) countLabel.textContent = `${total} arquiteto${total === 1 ? '' : 's'} encontrado${total === 1 ? '' : 's'}`;
      grid.innerHTML = loadedArchitects.map(cardHtml).join('');
      bindCompareCheckboxes();
      loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
      loadMoreBtn.disabled = false;
    } catch (err) {
      if (seq !== requestSeq) return;
      if (reset) grid.innerHTML = '';
      if (err.offline) document.getElementById('apiBanner').classList.add('show');
      if (!loadedArchitects.length) {
        empty.style.display = 'block';
        empty.querySelector('p').textContent = err.message || 'Não foi possível carregar os arquitetos agora.';
      }
      loadMoreBtn.disabled = false;
    }
  }

  // ---------------- Comparador (sem precisar entrar) ----------------
  function updateCompareBar() {
    const bar = document.getElementById('compareBar');
    const count = compareSelection.size;
    document.getElementById('compareCount').textContent = `${count} selecionado${count === 1 ? '' : 's'}`;
    document.getElementById('runCompareBtn').disabled = count < 2;
    bar.style.display = count > 0 ? 'block' : 'none';
    if (!count) document.getElementById('compareSection').style.display = 'none';
  }

  document.getElementById('clearCompareBtn').addEventListener('click', () => {
    compareSelection.clear();
    grid.querySelectorAll('[data-compare]').forEach(b => { b.checked = false; });
    updateCompareBar();
  });

  document.getElementById('runCompareBtn').addEventListener('click', () => {
    const items = Array.from(compareSelection.values());
    const section = document.getElementById('compareSection');
    document.getElementById('compareContent').innerHTML = `
      <table class="compare-table">
        <thead><tr><th>Arquiteto</th>${items.map(a => `<th>${a.name}</th>`).join('')}</tr></thead>
        <tbody>
          <tr><th>Localização</th>${items.map(a => `<td>${[a.city, a.state].filter(Boolean).join(' · ') || '—'}</td>`).join('')}</tr>
          <tr><th>Experiência</th>${items.map(a => `<td>${a.profile?.yearsExperience || 0} anos</td>`).join('')}</tr>
          <tr><th>Estilos</th>${items.map(a => `<td>${(a.profile?.styles || []).join(', ') || '—'}</td>`).join('')}</tr>
          <tr><th>Especialidades</th>${items.map(a => `<td>${(a.profile?.specialties || []).join(', ') || '—'}</td>`).join('')}</tr>
          <tr><th>Disponibilidade</th>${items.map(a => `<td>${{ available: 'Disponível', limited: 'Limitada', unavailable: 'Indisponível' }[a.profile?.availability] || '—'}</td>`).join('')}</tr>
          <tr><th>Avaliação</th>${items.map(a => `<td>${a.reviewCount ? `★ ${a.avgRating} (${a.reviewCount})` : 'Sem avaliações'}</td>`).join('')}</tr>
          <tr><th>Perfil</th>${items.map(a => `<td><a href="arquiteto.html?id=${a.id}" class="btn btn-secondary btn-sm">Ver perfil</a></td>`).join('')}</tr>
        </tbody>
      </table>`;
    section.style.display = 'block';
    section.scrollIntoView({ behavior: SCROLL_BEHAVIOR, block: 'start' });
  });

  let debounceTimer;
  const debouncedReset = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadArchitects({ reset: true }), 350);
  };
  cityFilter.addEventListener('input', debouncedReset);
  experienceFilter.addEventListener('change', () => loadArchitects({ reset: true }));
  ratingFilter.addEventListener('change', () => loadArchitects({ reset: true }));
  loadMoreBtn.addEventListener('click', () => {
    currentPage += 1;
    loadArchitects();
  });

  buildFilters();
  loadArchitects({ reset: true });
});
