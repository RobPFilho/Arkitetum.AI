document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('apiBaseLabel').textContent = MatchAPI.base();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.getElementById('noId').style.display = 'block'; return; }

  try {
    const arch = await MatchAPI.architect(id);
    const p = arch.profile || {};
    document.getElementById('profileState').style.display = 'block';
    document.getElementById('avatar').textContent = arch.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('archName').textContent = arch.name;
    document.getElementById('archLocation').textContent = [arch.city, arch.state].filter(Boolean).join(' · ') || 'Localização não informada';
    document.getElementById('archAvailability').textContent = { available: 'Disponível', limited: 'Disponibilidade limitada', unavailable: 'Indisponível' }[p.availability] || '—';
    document.getElementById('archEmail').textContent = arch.email || '—';
    document.getElementById('archPhone').textContent = arch.phone || '—';
    document.getElementById('archYears').textContent = p.yearsExperience ? `${p.yearsExperience} anos` : '—';
    document.getElementById('archWebsite').innerHTML = p.website ? `<a href="${p.website}" target="_blank" rel="noopener" style="color:var(--terracotta);">${p.website}</a>` : '—';
    document.getElementById('archInstagram').textContent = p.instagram || '—';
    document.getElementById('archBio').textContent = p.bio || 'Este arquiteto ainda não adicionou uma bio.';

    const tagRow = (elId, items) => {
      document.getElementById(elId).innerHTML = items && items.length
        ? items.map(i => `<span class="tag">${typeof i === 'string' ? i : i.name}</span>`).join('')
        : '<span style="font-size:0.85rem; color:var(--ink-faint);">Nenhum registrado</span>';
    };
    tagRow('archStyles', p.styles);
    tagRow('archSpecialties', p.specialties);
    tagRow('archMaterials', p.favoriteMaterials);

    const styleProfile = MatchExtras.getStyleProfile(id);
    if (styleProfile.palette.length || styleProfile.keywords.length) {
      document.getElementById('stylePaletteCard').style.display = 'block';
      document.getElementById('archPalette').innerHTML = styleProfile.palette.map(hex => `<span class="dot" style="background:${hex}"></span>`).join('');
      document.getElementById('archKeywords').innerHTML = styleProfile.keywords.map(k => `<span class="tag">${k}</span>`).join('') || '<span style="font-size:0.82rem; color:var(--ink-faint);">Nenhuma cadastrada</span>';
    }

    const combos = MatchExtras.generateMaterialCombos(p.favoriteMaterials);
    document.getElementById('archCombos').innerHTML = combos.length
      ? `<div class="constraint-note"><span class="dot-ic">🔒</span><span>Só usa materiais que ${arch.name} cadastrou como favoritos — nada inexequível.</span></div>` +
        combos.map(c => `<div class="combo-card"><div class="combo-name">${c.name}</div></div>`).join('')
      : '<p style="font-size:0.86rem; color:var(--ink-faint);">Cadastre ao menos 2 materiais favoritos para gerar sugestões.</p>';

    const portfolio = p.portfolio || [];
    document.getElementById('archPortfolio').innerHTML = portfolio.length
      ? `<div class="material-grid">${portfolio.map(proj => `
          <div class="material-card">
            <div class="thumb">${proj.imageUrl ? `<img src="${proj.imageUrl}" alt="${proj.title}">` : ''}</div>
            <div class="info">
              <span class="cat">${proj.status === 'ongoing' ? 'Em andamento' : 'Concluído'}</span>
              <h4>${proj.title}</h4>
              ${proj.projectUrl ? `<a href="${proj.projectUrl}" target="_blank" rel="noopener" style="font-size:0.78rem; color:var(--terracotta); font-weight:600;">Ver projeto →</a>` : ''}
            </div>
          </div>`).join('')}</div>`
      : '<p style="font-size:0.86rem; color:var(--ink-faint);">Nenhum projeto no portfólio ainda.</p>';
  } catch (err) {
    if (err.offline) document.getElementById('apiBanner').classList.add('show');
    document.getElementById('noId').style.display = 'block';
    document.getElementById('noId').innerHTML = `<h2>Não foi possível carregar este perfil</h2><p>${err.message || ''}</p><a href="index.html" class="btn btn-secondary">Voltar ao início</a>`;
  }
});
