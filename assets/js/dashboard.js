document.addEventListener('DOMContentLoaded', async () => {
  const apiBanner = document.getElementById('apiBanner');
  document.getElementById('apiBaseLabel').textContent = MatchAPI.base();
  const uid = (u) => u.id || u._id;

  if (!MatchAPI.token()) {
    document.getElementById('guestState').style.display = 'block';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    MatchAPI.clearSession();
    location.href = 'index.html';
  });

  let me;
  try {
    me = await MatchAPI.me();
  } catch (err) {
    if (err.status === 401) { MatchAPI.clearSession(); location.href = 'login.html'; return; }
    apiBanner.classList.add('show');
    document.getElementById('guestState').style.display = 'block';
    document.getElementById('guestState').innerHTML = `
      <h2>Não foi possível carregar seu painel</h2>
      <p>${err.message || 'Verifique se o back-end está no ar.'}</p>
      <a href="index.html" class="btn btn-secondary">Voltar ao início</a>`;
    return;
  }

  document.getElementById('dashState').style.display = 'block';
  renderProfile(me);

  if (me.role === 'client') {
    document.getElementById('clientPanel').style.display = 'block';
    document.getElementById('clientActions').style.display = 'block';
    document.getElementById('roleLabel').textContent = 'Painel do cliente';
    document.getElementById('runMatchBtn').addEventListener('click', () => runMatch(me));
    document.getElementById('matchResults').addEventListener('click', (e) => handleResultClick(e, me));
    renderProjectSummary(me);
    setupProjectSummary(me);
  } else {
    document.getElementById('architectPanel').style.display = 'block';
    document.getElementById('clientActions').style.display = 'none';
    document.getElementById('roleLabel').textContent = 'Painel do arquiteto';
    renderPortfolio(me);
    setupPortfolioForm(me);
    await renderStyleProfile(me);
    setupStyleProfile(me);
  }

  setupProfileEdit(me);

  function renderProfile(user) {
    document.getElementById('userName').textContent = user.name.split(' ')[0];
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileCity').textContent = user.city || '—';
    document.getElementById('profileState').textContent = user.state || '—';
    document.getElementById('avatarInitials').textContent = user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

    const row1 = document.getElementById('profileExtraRow1');
    const row2 = document.getElementById('profileExtraRow2');
    if (user.role === 'client' && user.clientProfile) {
      row1.style.display = 'flex';
      row1.innerHTML = `<span>Estilos</span><span>${(user.clientProfile.preferredStyles || []).join(', ') || '—'}</span>`;
      row2.style.display = 'flex';
      row2.innerHTML = `<span>Orçamento</span><span>${formatBudget(user.clientProfile.budget)}</span>`;
    } else if (user.role === 'architect' && user.architectProfile) {
      row1.style.display = 'flex';
      row1.innerHTML = `<span>Experiência</span><span>${user.architectProfile.yearsExperience || 0} anos</span>`;
      row2.style.display = 'flex';
      row2.innerHTML = `<span>Disponibilidade</span><span>${translateAvailability(user.architectProfile.availability)}</span>`;
    }
  }

  function formatBudget(budget) {
    if (!budget || (!budget.min && !budget.max)) return '—';
    const fmt = (v) => v ? 'R$ ' + Number(v).toLocaleString('pt-BR') : '';
    return [fmt(budget.min), fmt(budget.max)].filter(Boolean).join(' – ');
  }
  function translateAvailability(a) {
    return { available: 'Disponível', limited: 'Limitada', unavailable: 'Indisponível' }[a] || '—';
  }

  function setupProfileEdit(user) {
    const editBtn = document.getElementById('editProfileBtn');
    const editCard = document.getElementById('editCard');
    editBtn.addEventListener('click', () => {
      editCard.style.display = editCard.style.display === 'none' ? 'block' : 'none';
      document.getElementById('editName').value = user.name;
      document.getElementById('editCity').value = user.city || '';
      document.getElementById('editState').value = user.state || '';
    });
    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
      try {
        const updated = await MatchAPI.updateMe({
          name: document.getElementById('editName').value.trim(),
          city: document.getElementById('editCity').value.trim(),
          state: document.getElementById('editState').value.trim().toUpperCase(),
        });
        MatchAPI.setSession(MatchAPI.token(), { id: updated.id || updated._id, name: updated.name, role: updated.role });
        renderProfile(updated);
        editCard.style.display = 'none';
      } catch (err) {
        alert(err.message || 'Não foi possível salvar as alterações.');
      }
    });
  }

  // ---------------- Resumo do projeto (cliente) ----------------
  function renderProjectSummary(user) {
    const p = user.clientProfile || {};
    const meta = MatchExtras.getProjectMeta(uid(user));
    document.getElementById('ppStyle').textContent = [(p.preferredStyles || []).join(', '), p.preferences].filter(Boolean).join(' — ') || 'não informado';
    document.getElementById('ppBudget').textContent = formatBudget(p.budget);
    document.getElementById('ppRestrictions').textContent = meta.restrictions || 'nenhuma informada';
    document.getElementById('ppPriorities').textContent = meta.priorities || 'nenhuma informada';
    updateValidateButton(user);
  }
  function updateValidateButton(user) {
    const btn = document.getElementById('validateSummaryBtn');
    const validated = localStorage.getItem(`matchia_summary_ok_${uid(user)}`) === '1';
    btn.textContent = validated ? '✓ Resumo validado' : 'Validar resumo do projeto';
    btn.classList.toggle('btn-sage', true);
    btn.disabled = validated;
  }
  function setupProjectSummary(user) {
    document.getElementById('validateSummaryBtn').addEventListener('click', () => {
      localStorage.setItem(`matchia_summary_ok_${uid(user)}`, '1');
      updateValidateButton(user);
    });
  }

  // ---------------- Perfil de estilo (arquiteto) ----------------
  async function renderStyleProfile(user) {
    const saved = MatchExtras.getStyleProfile(uid(user));
    const container = document.getElementById('dashPalette');
    container.innerHTML = '';
    const presetHexes = MatchExtras.PALETTE.map(c => c.hex);
    MatchExtras.PALETTE.forEach(color => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch' + (saved.palette.includes(color.hex) ? ' active' : '');
      swatch.title = color.name;
      swatch.style.background = color.hex;
      swatch.dataset.hex = color.hex;
      swatch.addEventListener('click', () => swatch.classList.toggle('active'));
      container.appendChild(swatch);
    });

    let addBtn;
    function addCustomSwatch(hex) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch custom active';
      swatch.title = hex;
      swatch.style.background = hex;
      swatch.dataset.hex = hex;
      swatch.addEventListener('click', () => swatch.classList.toggle('active'));
      const remove = document.createElement('span');
      remove.className = 'swatch-remove';
      remove.textContent = '×';
      remove.addEventListener('click', (e) => { e.stopPropagation(); swatch.remove(); });
      swatch.appendChild(remove);
      container.insertBefore(swatch, addBtn);
    }
    // Cores personalizadas salvas anteriormente (fora da paleta sugerida).
    saved.palette.filter(hex => !presetHexes.includes(hex)).forEach(hex => addCustomSwatch(hex));

    addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'swatch-add';
    addBtn.title = 'Escolher outra cor';
    addBtn.innerHTML = '<span>+</span>';
    addBtn.addEventListener('click', () => {
      ColorWheelPicker.open(addBtn, '#B0755A', (hex) => addCustomSwatch(hex));
    });
    container.appendChild(addBtn);

    document.getElementById('dashKeywords').value = (saved.keywords || []).join(', ');

    // Materiais recorrentes: favoriteMaterials já vem como texto livre do back-end.
    const tagRow = document.getElementById('dashRecurringMaterials');
    const favorites = user.architectProfile?.favoriteMaterials || [];
    tagRow.innerHTML = favorites.length
      ? favorites.map(name => `<span class="tag">${name}</span>`).join('')
      : '<span style="font-size:0.85rem; color:var(--ink-faint);">Nenhum material favorito cadastrado ainda.</span>';
  }
  function setupStyleProfile(user) {
    document.getElementById('saveStyleProfileBtn').addEventListener('click', () => {
      const palette = Array.from(document.querySelectorAll('#dashPalette .swatch.active')).map(s => s.dataset.hex);
      const keywords = document.getElementById('dashKeywords').value.split(',').map(s => s.trim()).filter(Boolean);
      MatchExtras.setStyleProfile(uid(user), { palette, keywords });
      const btn = document.getElementById('saveStyleProfileBtn');
      const original = btn.textContent;
      btn.textContent = '✓ Perfil salvo';
      setTimeout(() => { btn.textContent = original; }, 1600);
    });
  }

  let lastResults = [];

  function validationRow(user, architectId) {
    const v = MatchExtras.getValidation(uid(user), architectId);
    return `
      <div style="margin-top:14px; padding-top:14px; border-top:1px dashed var(--line);">
        <span class="mock-label">Resumo do projeto</span>
        <div class="validate-row" style="margin-top:8px;">
          <button type="button" class="btn btn-sm ${v.client ? 'btn-sage' : 'btn-secondary'}" data-validate="client" data-arch="${architectId}">${v.client ? '✓ Você validou' : 'Validar resumo'}</button>
          <button type="button" class="btn btn-sm ${v.architect ? 'btn-sage' : 'btn-secondary'}" data-validate="architect" data-arch="${architectId}">${v.architect ? '✓ Arquiteto validou' : 'Simular validação do arquiteto'}</button>
        </div>
      </div>`;
  }

  function combosBlock(architectId) {
    return `<div id="combos-${architectId}" style="display:none; margin-top:14px; padding-top:14px; border-top:1px dashed var(--line);"></div>`;
  }

  function handleResultClick(e, user) {
    const comboBtn = e.target.closest('[data-toggle-combos]');
    if (comboBtn) {
      const archId = comboBtn.dataset.toggleCombos;
      const box = document.getElementById(`combos-${archId}`);
      const isOpen = box.style.display !== 'none';
      if (isOpen) { box.style.display = 'none'; comboBtn.textContent = 'Ver sugestões de materiais'; return; }
      const result = lastResults.find(r => r.architect.id === archId);
      const combos = MatchExtras.generateMaterialCombos(result?.architect.profile?.favoriteMaterials);
      box.innerHTML = combos.length
        ? `<div class="constraint-note"><span class="dot-ic">🔒</span><span>Combinações geradas só com os materiais que ${result.architect.name} cadastrou como favoritos.</span></div>` +
          combos.map(c => `<div class="combo-card"><div class="combo-name">${c.name}</div></div>`).join('')
        : `<p style="font-size:0.84rem; color:var(--ink-faint); margin:0;">Este arquiteto ainda não cadastrou materiais favoritos suficientes para gerar combinações.</p>`;
      box.style.display = 'block';
      comboBtn.textContent = 'Ocultar sugestões de materiais';
      return;
    }

    const validateBtn = e.target.closest('[data-validate]');
    if (validateBtn) {
      const archId = validateBtn.dataset.arch;
      const who = validateBtn.dataset.validate;
      const current = MatchExtras.getValidation(uid(user), archId);
      current[who] = true;
      MatchExtras.setValidation(uid(user), archId, current);
      validateBtn.classList.remove('btn-secondary');
      validateBtn.classList.add('btn-sage');
      validateBtn.textContent = who === 'client' ? '✓ Você validou' : '✓ Arquiteto validou';
    }
  }

  async function runMatch(user) {
    const btn = document.getElementById('runMatchBtn');
    const list = document.getElementById('matchResults');
    const empty = document.getElementById('matchEmpty');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Analisando compatibilidade...';
    try {
      const { results } = await MatchAPI.runMatch();
      lastResults = results;
      empty.style.display = results.length ? 'none' : 'block';
      if (!results.length) {
        empty.innerHTML = '<p>Nenhum arquiteto compatível encontrado ainda. Complete seu perfil com mais estilos e materiais preferidos.</p>';
      }
      list.innerHTML = results.map((r, i) => `
        <div class="result-card" style="grid-template-columns:auto 1fr auto; align-items:start;">
          <div class="result-rank">${i + 1}</div>
          <div class="result-body">
            <h4><a href="arquiteto.html?id=${r.architect.id}" style="color:inherit;">${r.architect.name}</a></h4>
            <div class="muted">${[r.architect.city, r.architect.state].filter(Boolean).join(' · ') || 'Localização não informada'}</div>
            <p class="explanation">${r.explanation}</p>
            <div class="tag-row">
              ${(r.architect.profile?.styles || []).slice(0, 4).map(s => `<span class="tag">${s}</span>`).join('')}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="margin-top:12px;" data-toggle-combos="${r.architect.id}">Ver sugestões de materiais</button>
            ${combosBlock(r.architect.id)}
            ${validationRow(user, r.architect.id)}
          </div>
          <div class="result-score"><strong>${r.score}</strong><span>pontos</span></div>
        </div>
      `).join('');
    } catch (err) {
      list.innerHTML = '';
      empty.style.display = 'block';
      empty.innerHTML = `<p>${err.message || 'Não foi possível rodar o match agora.'}</p>`;
      if (err.offline) apiBanner.classList.add('show');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Rodar match com IA';
    }
  }

  function renderPortfolio(user) {
    const list = document.getElementById('portfolioList');
    const items = (user.architectProfile && user.architectProfile.portfolio) || [];
    if (!items.length) {
      list.innerHTML = '<p style="font-size:0.86rem; color:var(--ink-faint);">Você ainda não adicionou projetos ao portfólio.</p>';
      return;
    }
    list.innerHTML = `<div class="material-grid">${items.map(p => `
      <div class="material-card" style="position:relative;">
        <button type="button" class="remove-draft" data-portfolio-id="${p._id || p.title}" title="Remover projeto" style="position:absolute; top:8px; right:8px; z-index:1;">×</button>
        <div class="thumb">${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : ''}</div>
        <div class="info">
          <span class="cat">${p.status === 'ongoing' ? 'Em andamento' : 'Concluído'}</span>
          <h4>${p.title}</h4>
          ${p.projectUrl ? `<a href="${p.projectUrl}" target="_blank" rel="noopener" style="font-size:0.78rem; color:var(--terracotta); font-weight:600;">Ver projeto →</a>` : ''}
        </div>
      </div>`).join('')}</div>`;

    list.querySelectorAll('[data-portfolio-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remover este projeto do portfólio?')) return;
        try {
          await MatchAPI.deletePortfolio(btn.dataset.portfolioId);
          const refreshed = await MatchAPI.me();
          renderPortfolio(refreshed);
        } catch (err) {
          alert(err.message || 'Não foi possível remover o projeto.');
        }
      });
    });
  }

  function setupPortfolioForm(user) {
    const toggle = document.getElementById('togglePortfolioForm');
    const form = document.getElementById('portfolioForm');
    toggle.addEventListener('click', () => { form.style.display = form.style.display === 'none' ? 'block' : 'none'; });

    let pImageDataUri = '';
    let pProjectDataUri = '';
    const pImageFileCtl = MatchExtras.setupFileInput('pImageFile', 'pImagePreview', (uri) => { pImageDataUri = uri; }, { isImage: true });
    const pProjectFileCtl = MatchExtras.setupFileInput('pProjectFile', 'pProjectFilePreview', (uri) => { pProjectDataUri = uri; });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await MatchAPI.addPortfolio({
          title: document.getElementById('pTitle').value.trim(),
          description: document.getElementById('pDescription').value.trim(),
          imageUrl: pImageDataUri || document.getElementById('pImageUrl').value.trim(),
          projectUrl: pProjectDataUri || document.getElementById('pProjectUrl').value.trim(),
          status: document.getElementById('pStatus').value,
        });
        const refreshed = await MatchAPI.me();
        renderPortfolio(refreshed);
        form.reset();
        form.style.display = 'none';
        pImageDataUri = ''; pProjectDataUri = '';
        pImageFileCtl?.clear(); pProjectFileCtl?.clear();
      } catch (err) {
        alert(err.message || 'Não foi possível adicionar o projeto.');
      }
    });
  }
});
