document.addEventListener('DOMContentLoaded', async () => {
  // Quem pede menos animação no sistema também não quer rolagem suave.
  const SCROLL_BEHAVIOR = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const STYLES = ['Moderno', 'Contemporâneo', 'Minimalista', 'Industrial', 'Clássico', 'Rústico', 'Escandinavo', 'Biofílico', 'Brutalista', 'Alto padrão'];
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

  function ratingHtml(a) {
    if (!a.reviewCount) return '<span style="font-size:0.78rem; color:var(--ink-faint);">Sem avaliações ainda</span>';
    return `<span style="font-size:0.8rem;">★ ${a.avgRating} <span style="color:var(--ink-faint);">(${a.reviewCount})</span></span>`;
  }

  function cardHtml(a) {
    const p = a.profile || {};
    const initials = a.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const verified = p.cauVerification?.status === 'verified' ? '<span class="status-pill badge-validated" style="margin-left:6px;">✓ Verificado</span>' : '';
    const proBadge = a.isPro ? '<span class="badge-pro" style="margin-left:6px;">Pro</span>' : '';
    const checked = compareSelection.has(a.id) ? 'checked' : '';
    return `
      <div class="material-card" style="position:relative;">
        <label style="position:absolute; top:10px; right:10px; z-index:1; background:var(--bg); border-radius:6px; padding:4px 6px; display:flex; align-items:center; gap:5px; font-size:0.72rem; box-shadow:var(--shadow-sm); cursor:pointer;">
          <input type="checkbox" data-compare="${a.id}" ${checked}> Comparar
        </label>
        <a href="arquiteto.html?id=${a.id}" style="text-decoration:none; color:inherit;">
          <div class="thumb" style="display:flex; align-items:center; justify-content:center; background:var(--brand-gradient);">
            <span style="font-family:var(--font-display); font-size:1.6rem; color:var(--white);">${initials}</span>
          </div>
          <div class="info">
            <span class="cat">${[a.city, a.state].filter(Boolean).join(' · ') || 'Localização não informada'}</span>
            <h4>${a.name}${proBadge}${verified}</h4>
            <div class="tag-row" style="margin:6px 0;">${(p.styles || []).slice(0, 3).map(s => `<span class="tag">${s}</span>`).join('') || ''}</div>
            <p style="font-size:0.8rem; color:var(--ink-faint); margin:4px 0;">${p.yearsExperience ? `${p.yearsExperience} anos de experiência` : 'Experiência não informada'}</p>
            ${ratingHtml(a)}
          </div>
        </a>
      </div>`;
  }

  function buildFilters() {
    filters.innerHTML = `<button type="button" class="chip active" data-style="">Todos</button>` +
      STYLES.map(s => `<button type="button" class="chip" data-style="${s}">${s}</button>`).join('');
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
            alert(`Você pode comparar até ${MAX_COMPARE} arquitetos por vez.`);
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
      <div class="skeleton-card">
        <div class="skeleton-block thumb"></div>
        <div class="skeleton-lines">
          <div class="skeleton-block line" style="width:60%;"></div>
          <div class="skeleton-block line" style="width:85%;"></div>
          <div class="skeleton-block line" style="width:40%;"></div>
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
      const { architects, hasMore } = await MatchAPI.architects(currentParams(currentPage));
      if (seq !== requestSeq) return; // uma busca mais recente já foi disparada, descarta esta resposta atrasada
      loadedArchitects = reset ? architects : loadedArchitects.concat(architects);
      if (!loadedArchitects.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        loadMoreBtn.style.display = 'none';
        return;
      }
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
