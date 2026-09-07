document.addEventListener('DOMContentLoaded', async () => {
  // Quem pede menos animação no sistema também não quer rolagem suave.
  const SCROLL_BEHAVIOR = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const STYLES = ['Moderno', 'Contemporâneo', 'Minimalista', 'Industrial', 'Clássico', 'Rústico', 'Escandinavo', 'Biofílico', 'Brutalista', 'Alto padrão'];
  const SPECIALTIES = ['Residencial unifamiliar', 'Apartamento', 'Reforma', 'Interiores', 'Comercial', 'Paisagismo', 'Alto padrão'];
  const MARITAL_STATUS = ['Solteiro(a)', 'Casado(a) / União estável', 'Divorciado(a)', 'Viúvo(a)'];
  const CONTACT_METHOD = ['E-mail', 'WhatsApp', 'Telefone'];
  const CONTACT_TIME = ['Manhã', 'Tarde', 'Noite', 'Qualquer horário'];
  const INTERVENTION_TYPE = ['Construção', 'Reforma'];
  const ENVIRONMENTS = ['Cozinha', 'Copa', 'Sala de estar', 'Sala de jantar', 'Espaço gourmet/churrasqueira', 'Sala de TV', 'Escritório', 'Lavabo', 'Banheiro social', 'Closet', 'Área de serviço', 'Quarto de serviço', 'Biblioteca', 'Adega', 'Garagem', 'Terraço/varanda', 'Piscina', 'Depósito'];
  const COLOR_TONES = ['Claras', 'Escuras', 'Contraste', 'Tons pastéis', 'Coloridas', 'Branco', 'Preto', 'Neutras', 'Cinza', 'Marrom'];
  const PREFERRED_SECTOR = ['Social', 'Íntimo', 'Serviço', 'Todos'];
  const STYLE_MIX = ['Sim', 'Não', 'Tanto faz'];
  const LIGHTING = ['Pouca', 'Razoável', 'Muita'];
  const PLANTS = ['Sim, naturais', 'Sim, artificiais', 'Não', 'Tanto faz'];
  const FUNCTIONAL_VS_AESTHETIC = ['Mais funcional', 'Equilíbrio', 'Mais estético'];
  const HABITS = ['Recebe amigos em casa', 'Cozinha com frequência', 'Gosta de tempo na varanda', 'Ouve música em casa', 'Joga video game', 'Tem animal de estimação', 'Gosta de espaço para adega/bar', 'Aprecia obras de arte/decoração'];
  const PRACTICE_TYPE = ['Autônomo(a)', 'Escritório', 'Estúdio coletivo'];

  const form = document.getElementById('cadastroForm');
  const btnCliente = document.getElementById('btnCliente');
  const btnArquiteto = document.getElementById('btnArquiteto');
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  const apiBanner = document.getElementById('apiBanner');
  const apiBaseLabel = document.getElementById('apiBaseLabel');
  const submitBtn = document.getElementById('submitBtn');
  const wizardBack = document.getElementById('wizardBack');
  const wizardNext = document.getElementById('wizardNext');
  const wizardProgress = document.getElementById('wizardProgress');

  apiBaseLabel.textContent = MatchAPI.base();

  let role = 'client';
  let stepIndex = 0;
  const allStepEls = Array.from(document.querySelectorAll('.wizard-step'));
  const STEP_LABELS = {
    conta: 'Conta', familia: 'Você', projeto: 'Projeto', ambientes: 'Ambientes', cores: 'Cores',
    estilo: 'Estilo', observacoes: 'Notas', 'resumo-cliente': 'Resumo',
    'arch-profissional': 'Perfil', 'arch-estilo': 'Estilo', 'arch-materiais': 'Materiais',
    'arch-bio': 'Bio', 'arch-portfolio': 'Portfólio', 'resumo-arquiteto': 'Resumo',
  };

  function stepsForRole() {
    return allStepEls.filter(el => !el.dataset.role || el.dataset.role === role);
  }

  function renderProgress() {
    const steps = stepsForRole();
    wizardProgress.innerHTML = steps.map((el, i) => {
      const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : '';
      return `<div class="wizard-dot-wrap ${state}"><span class="wizard-line"></span><span class="wizard-dot">${i < stepIndex ? '✓' : i + 1}</span><span class="wizard-label">${STEP_LABELS[el.dataset.step] || ''}</span></div>`;
    }).join('');
  }

  function showStep(index) {
    const steps = stepsForRole();
    stepIndex = Math.max(0, Math.min(index, steps.length - 1));
    allStepEls.forEach(el => el.classList.remove('active'));
    steps[stepIndex].classList.add('active');
    wizardBack.style.display = stepIndex === 0 ? 'none' : '';
    const isLast = stepIndex === steps.length - 1;
    wizardNext.style.display = isLast ? 'none' : '';
    submitBtn.style.display = isLast ? '' : 'none';
    if (isLast) {
      if (role === 'client') renderClientSummary(); else renderArchitectSummary();
    }
    renderProgress();
    formError.classList.remove('show');
    document.querySelector('.auth-card').scrollIntoView({ behavior: SCROLL_BEHAVIOR, block: 'start' });
  }

  function validateStep(stepEl) {
    const required = Array.from(stepEl.querySelectorAll('[required]'));
    for (const field of required) {
      if (!field.checkValidity()) { field.reportValidity(); return false; }
    }
    if (stepEl.dataset.step === 'conta' && document.getElementById('password').value !== document.getElementById('confirmPassword').value) {
      formError.textContent = 'As senhas não coincidem.';
      formError.classList.add('show');
      return false;
    }
    return true;
  }

  wizardNext.addEventListener('click', () => {
    const steps = stepsForRole();
    if (!validateStep(steps[stepIndex])) return;
    showStep(stepIndex + 1);
  });
  wizardBack.addEventListener('click', () => showStep(stepIndex - 1));

  // Enter em qualquer campo avança pra próxima etapa em vez de submeter o
  // formulário inteiro — só o botão "Criar conta" na última etapa envia de
  // verdade. Em textarea, Enter continua quebrando linha normalmente.
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (wizardNext.style.display !== 'none') wizardNext.click();
  });

  function setRole(next) {
    role = next;
    btnCliente.classList.toggle('active', role === 'client');
    btnArquiteto.classList.toggle('active', role === 'architect');
    submitBtn.textContent = role === 'client' ? 'Criar conta de cliente' : 'Criar conta de arquiteto';
    showStep(0);
  }
  btnCliente.addEventListener('click', () => setRole('client'));
  btnArquiteto.addEventListener('click', () => setRole('architect'));

  const params = new URLSearchParams(location.search);
  if (params.get('tipo') === 'arquiteto') setRole('architect'); else setRole('client');

  // ---------------- Chips: multi-seleção ----------------
  function buildChipList(container, items, { max } = {}) {
    container.innerHTML = '';
    items.forEach(item => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = item.thumb ? 'chip has-thumb' : 'chip';
      chip.dataset.value = item.value;
      chip.setAttribute('aria-pressed', 'false');
      if (item.thumb) {
        chip.innerHTML = `<img class="chip-thumb" src="${item.thumb}" alt="" loading="lazy">${item.label}`;
      } else {
        chip.textContent = item.label;
      }
      chip.addEventListener('click', () => {
        const activeCount = container.querySelectorAll('.chip.active').length;
        if (!chip.classList.contains('active') && max && activeCount >= max) return;
        chip.classList.toggle('active');
        chip.setAttribute('aria-pressed', String(chip.classList.contains('active')));
      });
      container.appendChild(chip);
    });
  }
  function chipValues(container) {
    return Array.from(container.querySelectorAll('.chip.active')).map(c => c.dataset.value);
  }

  /** Botão "+ Outros..." — permite digitar um valor fora da lista sugerida. */
  function addChipAdder(container, { max } = {}) {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'chip-add';
    addBtn.textContent = '+ Outros...';

    addBtn.addEventListener('click', () => {
      addBtn.style.display = 'none';
      const group = document.createElement('span');
      group.className = 'chip-input-group';
      group.innerHTML = '<input type="text" placeholder="Digite e confirme" maxlength="40" aria-label="Novo valor"><button type="button" class="confirm" title="Adicionar" aria-label="Adicionar">✓</button><button type="button" class="cancel" title="Cancelar" aria-label="Cancelar">×</button>';
      container.insertBefore(group, addBtn);
      const input = group.querySelector('input');
      input.focus();

      const commit = () => {
        const value = input.value.trim();
        if (value) {
          const activeCount = container.querySelectorAll('.chip.active').length;
          if (!max || activeCount < max) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip custom active';
            chip.textContent = value;
            chip.dataset.value = value;
            chip.addEventListener('click', () => {
              const count = container.querySelectorAll('.chip.active').length;
              if (!chip.classList.contains('active') && max && count >= max) return;
              chip.classList.toggle('active');
            });
            container.insertBefore(chip, addBtn);
          }
        }
        group.remove();
        addBtn.style.display = '';
      };
      const cancel = () => { group.remove(); addBtn.style.display = ''; };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      });
      group.querySelector('.confirm').addEventListener('click', commit);
      group.querySelector('.cancel').addEventListener('click', cancel);
    });

    container.appendChild(addBtn);
  }

  // ---------------- Chips: seleção única (estilo "múltipla escolha") ----------------
  function buildSingleChipList(container, items) {
    container.innerHTML = '';
    items.forEach(item => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = item;
      chip.dataset.value = item;
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        const wasActive = chip.classList.contains('active');
        container.querySelectorAll('.chip').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
        if (!wasActive) { chip.classList.add('active'); chip.setAttribute('aria-pressed', 'true'); }
      });
      container.appendChild(chip);
    });
  }
  function singleChipValue(container) {
    const el = container.querySelector('.chip.active');
    return el ? el.dataset.value : '';
  }

  // ---------------- Monta todos os grupos de chips ----------------
  buildChipList(document.getElementById('clientStyles'), STYLES.map(s => ({ label: s, value: s })));
  buildChipList(document.getElementById('architectStyles'), STYLES.map(s => ({ label: s, value: s })));
  buildChipList(document.getElementById('architectSpecialties'), SPECIALTIES.map(s => ({ label: s, value: s })));
  addChipAdder(document.getElementById('clientStyles'));
  addChipAdder(document.getElementById('architectStyles'));
  addChipAdder(document.getElementById('architectSpecialties'));

  buildChipList(document.getElementById('environmentsChips'), ENVIRONMENTS.map(s => ({ label: s, value: s })));
  addChipAdder(document.getElementById('environmentsChips'));
  buildChipList(document.getElementById('colorTones'), COLOR_TONES.map(s => ({ label: s, value: s })));
  addChipAdder(document.getElementById('colorTones'));
  buildChipList(document.getElementById('contactMethod'), CONTACT_METHOD.map(s => ({ label: s, value: s })));
  buildChipList(document.getElementById('habitsChips'), HABITS.map(s => ({ label: s, value: s })));
  addChipAdder(document.getElementById('habitsChips'));

  buildSingleChipList(document.getElementById('maritalStatus'), MARITAL_STATUS);
  buildSingleChipList(document.getElementById('contactTime'), CONTACT_TIME);
  buildSingleChipList(document.getElementById('interventionType'), INTERVENTION_TYPE);
  buildSingleChipList(document.getElementById('preferredSector'), PREFERRED_SECTOR);
  buildSingleChipList(document.getElementById('styleMix'), STYLE_MIX);
  buildSingleChipList(document.getElementById('lighting'), LIGHTING);
  buildSingleChipList(document.getElementById('plants'), PLANTS);
  buildSingleChipList(document.getElementById('functionalVsAesthetic'), FUNCTIONAL_VS_AESTHETIC);
  buildSingleChipList(document.getElementById('practiceType'), PRACTICE_TYPE);
  buildSingleChipList(document.getElementById('preferredSectorArch'), PREFERRED_SECTOR);
  buildSingleChipList(document.getElementById('designApproach'), FUNCTIONAL_VS_AESTHETIC);

  // Perfil de estilo do arquiteto: paleta de cores (vira instrução fixa para a IA).
  const paletteContainer = document.getElementById('architectPalette');
  MatchExtras.PALETTE.forEach(color => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'swatch';
    swatch.title = color.name;
    swatch.style.background = color.hex;
    swatch.dataset.hex = color.hex;
    swatch.addEventListener('click', () => swatch.classList.toggle('active'));
    paletteContainer.appendChild(swatch);
  });

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
    paletteContainer.insertBefore(swatch, addSwatchBtn);
  }

  const addSwatchBtn = document.createElement('button');
  addSwatchBtn.type = 'button';
  addSwatchBtn.className = 'swatch-add';
  addSwatchBtn.title = 'Escolher outra cor';
  addSwatchBtn.innerHTML = '<span>+</span>';
  addSwatchBtn.addEventListener('click', () => {
    ColorWheelPicker.open(addSwatchBtn, '#B0755A', (hex) => addCustomSwatch(hex));
  });
  paletteContainer.appendChild(addSwatchBtn);

  function selectedPalette() {
    return Array.from(paletteContainer.querySelectorAll('.swatch.active')).map(s => s.dataset.hex);
  }

  // Materiais vêm do back-end (GET /api/materials) só como sugestão — o valor
  // enviado no cadastro é sempre o nome (texto livre), igual estilos/especialidades.
  // Se a API estiver fora do ar, caímos numa lista estática (com as mesmas fotos reais
  // do banco de materiais) para o formulário continuar utilizável e visual.
  const FALLBACK_MATERIALS = [
    ['Carvalho', 'https://images.unsplash.com/photo-1611072337226-1140ab367200?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Nogueira', 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Bambu', 'https://images.unsplash.com/photo-1577199019410-0d4567e04117?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Concreto aparente', 'https://images.unsplash.com/photo-1617713965103-9fda56c89fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Granilite', 'https://images.unsplash.com/photo-1634131330605-e6dfd1a314c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Mármore Carrara', 'https://images.unsplash.com/photo-1523251836828-b75d28b89804?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Granito', 'https://images.unsplash.com/photo-1652305461546-bf0a76934433?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Travertino', 'https://images.unsplash.com/photo-1724219548981-1c2a333144db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Ardósia', 'https://images.unsplash.com/photo-1542732056-648731297c97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Tijolo aparente', 'https://images.unsplash.com/photo-1520758594221-872948699332?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Vidro', 'https://images.unsplash.com/photo-1523477593243-78bbf626fd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Aço', 'https://images.unsplash.com/photo-1579223442946-c1c147e96598?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Alumínio', 'https://images.unsplash.com/photo-1666555038185-8323c553de64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Revestimento cerâmico', 'https://images.unsplash.com/photo-1678742755904-6c3fc8ba6602?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Porcelanato', 'https://images.unsplash.com/photo-1714334200104-004e5d66708a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Cortiça', 'https://images.unsplash.com/photo-1558051815-0f18e64e6280?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Calcário', 'https://images.unsplash.com/photo-1581710515207-e12b6e176779?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
    ['Quartzo', 'https://images.unsplash.com/photo-1623197532650-bacb8a68914e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=80'],
  ].map(([name, thumb]) => ({ label: name, value: name, thumb }));

  try {
    const materials = await MatchAPI.materials();
    const options = materials.map(m => ({ label: m.name, value: m.name, thumb: m.imageUrl }));
    buildChipList(document.getElementById('clientMaterials'), options);
    buildChipList(document.getElementById('architectMaterials'), options, { max: 5 });
  } catch (err) {
    apiBanner.classList.add('show');
    buildChipList(document.getElementById('clientMaterials'), FALLBACK_MATERIALS);
    buildChipList(document.getElementById('architectMaterials'), FALLBACK_MATERIALS, { max: 5 });
  }
  addChipAdder(document.getElementById('clientMaterials'));
  addChipAdder(document.getElementById('architectMaterials'), { max: 5 });

  // ---------------- Portfólio (rascunho até a conta existir) ----------------
  // POST /api/dashboard/portfolio exige token, que só existe depois do cadastro —
  // então guardamos os projetos aqui e enviamos um a um logo após criar a conta.
  const portfolioDrafts = [];
  const portfolioDraftList = document.getElementById('portfolioDraftList');
  const portfolioDraftForm = document.getElementById('portfolioDraftForm');

  let pfImageDataUri = '';
  let pfProjectDataUri = '';
  const pfImageFileCtl = MatchExtras.setupFileInput('pfImageFile', 'pfImagePreview', (uri) => { pfImageDataUri = uri; }, { isImage: true });
  const pfProjectFileCtl = MatchExtras.setupFileInput('pfProjectFile', 'pfProjectFilePreview', (uri) => { pfProjectDataUri = uri; });

  const FREE_PORTFOLIO_LIMIT = 3; // toda conta nova começa no plano Gratuito
  function renderPortfolioDraftList() {
    portfolioDraftList.innerHTML = portfolioDrafts.map((p, i) => `
      <div class="portfolio-draft-item">
        <div class="thumb">${p.imageUrl ? `<img src="${p.imageUrl}" alt="">` : ''}</div>
        <div class="info">
          <h4>${p.title}</h4>
          <span>${p.status === 'ongoing' ? 'Em andamento' : 'Concluído'}${p.projectUrl ? ' · arquivo anexado' : ''}</span>
        </div>
        <button type="button" class="remove-draft" data-index="${i}" title="Remover">×</button>
      </div>`).join('');
    portfolioDraftList.querySelectorAll('.remove-draft').forEach(btn => {
      btn.addEventListener('click', () => {
        portfolioDrafts.splice(Number(btn.dataset.index), 1);
        renderPortfolioDraftList();
        updatePortfolioLimitUI();
      });
    });
    updatePortfolioLimitUI();
  }

  function updatePortfolioLimitUI() {
    const atLimit = portfolioDrafts.length >= FREE_PORTFOLIO_LIMIT;
    const toggleBtn = document.getElementById('togglePortfolioDraftForm');
    let note = document.getElementById('portfolioLimitNote');
    if (atLimit) {
      toggleBtn.style.display = 'none';
      if (!note) {
        note = document.createElement('p');
        note.id = 'portfolioLimitNote';
        note.style.cssText = 'font-size:0.82rem; color:var(--ink-faint); margin-top:12px;';
        note.textContent = `O plano Gratuito permite até ${FREE_PORTFOLIO_LIMIT} projetos — depois de criar a conta, faça upgrade para Pro no seu painel para adicionar mais.`;
        toggleBtn.insertAdjacentElement('afterend', note);
      }
    } else {
      toggleBtn.style.display = '';
      if (note) note.remove();
    }
  }

  function resetPortfolioDraftForm() {
    ['pfTitle', 'pfDescription', 'pfImageUrl', 'pfProjectUrl'].forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('pfStatus').value = 'completed';
    pfImageFileCtl?.clear();
    pfProjectFileCtl?.clear();
  }

  document.getElementById('togglePortfolioDraftForm').addEventListener('click', () => {
    portfolioDraftForm.style.display = 'block';
    document.getElementById('togglePortfolioDraftForm').style.display = 'none';
    document.getElementById('pfTitle').focus();
  });
  document.getElementById('cancelPortfolioDraft').addEventListener('click', () => {
    resetPortfolioDraftForm();
    portfolioDraftForm.style.display = 'none';
    document.getElementById('togglePortfolioDraftForm').style.display = '';
  });
  document.getElementById('confirmPortfolioDraft').addEventListener('click', () => {
    const title = document.getElementById('pfTitle').value.trim();
    if (!title) { document.getElementById('pfTitle').focus(); return; }
    portfolioDrafts.push({
      title,
      description: document.getElementById('pfDescription').value.trim(),
      imageUrl: pfImageDataUri || document.getElementById('pfImageUrl').value.trim(),
      projectUrl: pfProjectDataUri || document.getElementById('pfProjectUrl').value.trim(),
      status: document.getElementById('pfStatus').value,
    });
    renderPortfolioDraftList();
    resetPortfolioDraftForm();
    portfolioDraftForm.style.display = 'none';
    document.getElementById('togglePortfolioDraftForm').style.display = '';
  });

  showStep(0);

  // ---------------- Resumo & montagem do payload ----------------
  function formatBudget(min, max) {
    const fmt = (v) => v ? 'R$ ' + Number(v).toLocaleString('pt-BR') : '';
    const parts = [fmt(min), fmt(max)].filter(Boolean);
    return parts.length ? parts.join(' – ') : 'não informado';
  }
  function val(id) { return document.getElementById(id).value.trim(); }
  function line(label, value) {
    return `<div class="summary-line"><span>${label}</span><strong>${value && String(value).trim() ? value : '—'}</strong></div>`;
  }

  function renderClientSummary() {
    const styles = chipValues(document.getElementById('clientStyles'));
    const materialsLabels = Array.from(document.querySelectorAll('#clientMaterials .chip.active')).map(c => c.textContent);
    const environments = chipValues(document.getElementById('environmentsChips'));
    const habits = chipValues(document.getElementById('habitsChips'));
    const colorTones = chipValues(document.getElementById('colorTones'));

    document.getElementById('clientSummary').innerHTML = `
      <div class="summary-section-title">Conta</div>
      ${line('Nome', val('name'))}
      ${line('Contato', [val('email'), val('phone')].filter(Boolean).join(' · '))}
      ${line('Cidade', [val('city'), val('state')].filter(Boolean).join(' / '))}

      <div class="summary-section-title">Sobre você</div>
      ${line('Estado civil', singleChipValue(document.getElementById('maritalStatus')))}
      ${line('Moradores na casa', val('familySize'))}
      ${line('Filhos', val('childrenCount'))}
      ${line('Melhor contato', chipValues(document.getElementById('contactMethod')).join(', ') || singleChipValue(document.getElementById('contactTime')))}

      <div class="summary-section-title">Projeto</div>
      ${line('Intervenção', singleChipValue(document.getElementById('interventionType')))}
      ${line('Tipo de imóvel', val('propertyType') || document.getElementById('propertyType').value)}
      ${line('Metragem', val('areaSize') ? val('areaSize') + ' m²' : '')}
      ${line('Prazo p/ início', document.getElementById('startTimeline').value)}
      ${line('Orçamento', formatBudget(val('budgetMin'), val('budgetMax')))}

      <div class="summary-section-title">Ambientes</div>
      ${line('Desejados', environments.join(', '))}
      ${line('Suítes / Quartos', `${document.getElementById('suitesCount').value} suíte(s) · ${document.getElementById('bedroomsCount').value} quarto(s)`)}

      <div class="summary-section-title">Cores e materiais</div>
      ${line('Tons preferidos', colorTones.join(', '))}
      ${line('Cor a evitar', val('dislikedColor'))}
      ${line('Materiais', materialsLabels.join(', '))}

      <div class="summary-section-title">Estilo e hábitos</div>
      ${line('Estilos', styles.join(', '))}
      ${line('Setor preferido', singleChipValue(document.getElementById('preferredSector')))}
      ${line('Funcional × estético', singleChipValue(document.getElementById('functionalVsAesthetic')))}
      ${line('Hábitos', habits.join(', '))}

      <div class="summary-section-title">Referência visual</div>
      <div id="clientStylePreview"></div>
    `;
    loadStylePreview(styles, materialsLabels, 'clientStylePreview');
  }

  function renderArchitectSummary() {
    document.getElementById('architectSummary').innerHTML = `
      <div class="summary-section-title">Conta</div>
      ${line('Nome', val('name'))}
      ${line('Contato', [val('email'), val('phone')].filter(Boolean).join(' · '))}
      ${line('Cidade', [val('city'), val('state')].filter(Boolean).join(' / '))}

      <div class="summary-section-title">Perfil profissional</div>
      ${line('Experiência', val('yearsExperience') + ' anos')}
      ${line('CAU/A', val('cauRegistration'))}
      ${line('Atuação', singleChipValue(document.getElementById('practiceType')))}
      ${line('Áreas de atendimento', val('workingAreas'))}
      ${line('Faixa de preço', (val('priceMin') || val('priceMax')) ? `R$ ${val('priceMin') || '?'} – R$ ${val('priceMax') || '?'}` : '')}

      <div class="summary-section-title">Estilo e especialidades</div>
      ${line('Estilos', chipValues(document.getElementById('architectStyles')).join(', '))}
      ${line('Especialidades', chipValues(document.getElementById('architectSpecialties')).join(', '))}
      ${line('Setor favorito', singleChipValue(document.getElementById('preferredSectorArch')))}
      ${line('Abordagem', singleChipValue(document.getElementById('designApproach')))}

      <div class="summary-section-title">Materiais e estilo</div>
      ${line('Materiais favoritos', Array.from(document.querySelectorAll('#architectMaterials .chip.active')).map(c => c.textContent).join(', '))}
      ${line('Palavras-chave', val('keywords'))}

      <div class="summary-section-title">Portfólio</div>
      ${line('Projetos adicionados', portfolioDrafts.length ? portfolioDrafts.map(p => p.title).join(', ') : 'nenhum (opcional)')}

      <div class="summary-section-title">Referência visual</div>
      <div id="architectStylePreview"></div>
    `;
    const archStyles = chipValues(document.getElementById('architectStyles'));
    const archMaterials = Array.from(document.querySelectorAll('#architectMaterials .chip.active')).map(c => c.textContent);
    loadStylePreview(archStyles, archMaterials, 'architectStylePreview');
  }

  let previewSeq = 0;
  async function loadStylePreview(styles, materials, containerId) {
    const container = document.getElementById(containerId);
    if (!styles.length && !materials.length) {
      container.innerHTML = '<p style="font-size:0.86rem; color:var(--ink-faint); margin:0;">Escolha ao menos um estilo ou material nas etapas anteriores pra ver uma referência visual aqui.</p>';
      return;
    }
    const seq = ++previewSeq;
    container.innerHTML = '<p style="font-size:0.86rem; color:var(--ink-faint); margin:0;"><span class="spinner"></span> Buscando uma referência visual parecida com o que você descreveu...</p>';
    try {
      const photo = await MatchAPI.moodboardPreview({ styles, materials });
      if (seq !== previewSeq) return;
      container.innerHTML = `
        <p style="font-size:0.86rem; margin:0 0 10px;">É mais ou menos assim que você imagina?</p>
        <img src="${photo.imageUrl}" alt="${photo.description}" style="width:100%; max-width:420px; border-radius:12px; display:block;">
        <p style="font-size:0.74rem; color:var(--ink-faint); margin-top:6px;">Foto: <a href="${photo.photographerUrl}" target="_blank" rel="noopener" style="color:inherit;">${photo.photographerName}</a> via <a href="${photo.unsplashUrl}" target="_blank" rel="noopener" style="color:inherit;">Unsplash</a></p>`;
    } catch (err) {
      if (seq !== previewSeq) return;
      container.innerHTML = `<p style="font-size:0.86rem; color:var(--ink-faint); margin:0;">${err.message || 'Não foi possível buscar uma referência visual agora — sem problema, isso não afeta seu cadastro.'}</p>`;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formSuccess.classList.remove('show');

    const common = {
      name: val('name'), email: val('email'), phone: val('phone'),
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      city: val('city'), state: val('state').toUpperCase(),
      referredBy: params.get('ref') || undefined,
    };
    if (common.password !== common.confirmPassword) {
      formError.textContent = 'As senhas não coincidem.';
      formError.classList.add('show');
      return;
    }

    let payload = { ...common };
    let projectMeta = null;
    let styleProfile = null;

    if (role === 'client') {
      // Sintetiza as respostas ricas do questionário num texto legível — assim elas
      // chegam de verdade ao arquiteto e à explicação de IA (que lê projectGoals/preferences),
      // sem exigir mudança no schema do back-end.
      const goalsExtra = [
        `Intervenção: ${singleChipValue(document.getElementById('interventionType')) || 'não informado'}`,
        `Metragem: ${val('areaSize') || 'não informada'} m²`,
        `Prazo para início: ${document.getElementById('startTimeline').value}`,
        `Ambientes desejados: ${chipValues(document.getElementById('environmentsChips')).join(', ') || 'não informado'}`,
        `Suítes/Quartos: ${document.getElementById('suitesCount').value} / ${document.getElementById('bedroomsCount').value}`,
      ].join(' · ');

      const preferencesExtra = [
        `Tons de cor: ${chipValues(document.getElementById('colorTones')).join(', ') || 'não informado'}`,
        val('dislikedColor') ? `Cor a evitar: ${val('dislikedColor')}` : '',
        `Setor preferido: ${singleChipValue(document.getElementById('preferredSector')) || 'não informado'}`,
        `Iluminação: ${singleChipValue(document.getElementById('lighting')) || 'não informado'}`,
        `Plantas: ${singleChipValue(document.getElementById('plants')) || 'não informado'}`,
        `Funcional × estético: ${singleChipValue(document.getElementById('functionalVsAesthetic')) || 'não informado'}`,
        `Hábitos: ${chipValues(document.getElementById('habitsChips')).join(', ') || 'não informado'}`,
        chipValues(document.getElementById('styleMix')).length ? `Mistura estilos: ${singleChipValue(document.getElementById('styleMix'))}` : '',
      ].filter(Boolean).join(' · ');

      payload = {
        ...payload,
        preferredStyles: chipValues(document.getElementById('clientStyles')),
        preferredMaterials: chipValues(document.getElementById('clientMaterials')),
        budgetMin: val('budgetMin') || undefined,
        budgetMax: val('budgetMax') || undefined,
        propertyType: document.getElementById('propertyType').value,
        familySize: Number(val('familySize')) || undefined,
        projectGoals: [val('projectGoals'), goalsExtra].filter(Boolean).join('\n\n— Resumo do questionário —\n'),
        preferences: [val('preferences'), preferencesExtra].filter(Boolean).join('\n\n— Preferências detalhadas —\n'),
      };
      projectMeta = {
        restrictions: val('restrictions'),
        priorities: val('priorities'),
        maritalStatus: singleChipValue(document.getElementById('maritalStatus')),
        childrenCount: val('childrenCount'),
        occupation: val('occupation'),
        environments: chipValues(document.getElementById('environmentsChips')),
        suitesCount: document.getElementById('suitesCount').value,
        bedroomsCount: document.getElementById('bedroomsCount').value,
        colorTones: chipValues(document.getElementById('colorTones')),
        dislikedColor: val('dislikedColor'),
        habits: chipValues(document.getElementById('habitsChips')),
        fullAddress: val('fullAddress'),
        areaSize: val('areaSize'),
        startTimeline: document.getElementById('startTimeline').value,
      };
    } else {
      const bioExtra = [
        `Tipo de atuação: ${singleChipValue(document.getElementById('practiceType')) || 'não informado'}`,
        `Setor favorito para projetar: ${singleChipValue(document.getElementById('preferredSectorArch')) || 'não informado'}`,
        `Abordagem: ${singleChipValue(document.getElementById('designApproach')) || 'não informado'}`,
        val('cauRegistration') ? `Registro CAU/A: ${val('cauRegistration')}` : '',
      ].filter(Boolean).join(' · ');

      payload = {
        ...payload,
        styles: chipValues(document.getElementById('architectStyles')),
        specialties: chipValues(document.getElementById('architectSpecialties')),
        favoriteMaterials: chipValues(document.getElementById('architectMaterials')),
        yearsExperience: Number(val('yearsExperience')) || 0,
        workingAreas: val('workingAreas').split(',').map(s => s.trim()).filter(Boolean),
        priceMin: val('priceMin') || undefined,
        priceMax: val('priceMax') || undefined,
        website: val('website'),
        instagram: val('instagram'),
        bio: [val('bio'), bioExtra].filter(Boolean).join('\n\n— Perfil complementar —\n'),
      };
      styleProfile = {
        palette: selectedPalette(),
        keywords: val('keywords').split(',').map(s => s.trim()).filter(Boolean),
        cauRegistration: val('cauRegistration'),
        practiceType: singleChipValue(document.getElementById('practiceType')),
        preferredSector: singleChipValue(document.getElementById('preferredSectorArch')),
        designApproach: singleChipValue(document.getElementById('designApproach')),
      };
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Criando conta...';
    try {
      const res = role === 'client' ? await MatchAPI.registerClient(payload) : await MatchAPI.registerArchitect(payload);
      MatchAPI.setSession(res.token, res.user);
      if (projectMeta) MatchExtras.setProjectMeta(res.user.id, projectMeta);
      if (styleProfile) MatchExtras.setStyleProfile(res.user.id, styleProfile);
      // Portfólio só pode ser enviado depois que a conta (e o token) existe.
      for (const project of portfolioDrafts) {
        try { await MatchAPI.addPortfolio(project); } catch { /* melhor tentar todos do que travar no primeiro erro */ }
      }
      formSuccess.textContent = 'Conta criada com sucesso! Redirecionando para o seu painel...';
      formSuccess.classList.add('show');
      setTimeout(() => { location.href = 'dashboard.html'; }, 900);
    } catch (err) {
      formError.textContent = err.offline
        ? `Não foi possível conectar à API em ${MatchAPI.base()}. Rode o back-end (Arkitetum.AI) localmente com "npm run dev" e tente novamente.`
        : err.message || 'Não foi possível criar a conta.';
      formError.classList.add('show');
      if (err.offline) apiBanner.classList.add('show');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = role === 'client' ? 'Criar conta de cliente' : 'Criar conta de arquiteto';
    }
  });
});
