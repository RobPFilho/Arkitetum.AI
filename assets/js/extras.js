/**
 * Camada de dados complementar às 3 novidades pedidas pela equipe (a partir do
 * briefing da Teresa): perfil de estilo do arquiteto, banco de materiais restrito
 * e resumo do projeto validável.
 *
 * IMPORTANTE: o back-end Arkitetum.AI hoje não tem campos para paleta de cores,
 * palavras-chave nem restrições/prioridades do projeto. Para não travar a demo na
 * mentoria, essas partes ficam salvas no localStorage do navegador (por usuário).
 * Materiais recorrentes, portfólio e a validação mútua do resumo do projeto
 * (cliente confirma + arquiteto confirma) já são 100% reais — vêm da API
 * (`/api/validations`, modelo `Validation`). Quando o time decidir levar o resto
 * pra produção, dá pra migrar essas chaves para novos campos no schema do User
 * (architectProfile.colorPalette, architectProfile.keywords,
 * clientProfile.restrictions/priorities).
 */
const MatchExtras = (() => {
  const PALETTE = [
    { hex: '#B0755A', name: 'Terracota' },
    { hex: '#7B8E7E', name: 'Verde sálvia' },
    { hex: '#D8CBBB', name: 'Bege areia' },
    { hex: '#333333', name: 'Grafite' },
    { hex: '#6B4A30', name: 'Madeira' },
    { hex: '#A6A6A6', name: 'Cinza pedra' },
    { hex: '#2F3E52', name: 'Azul marinho' },
    { hex: '#A9748A', name: 'Rosa antigo' },
  ];

  const styleKey = (userId) => `matchia_style_profile_${userId}`;
  const metaKey = (userId) => `matchia_project_meta_${userId}`;

  function getStyleProfile(userId) {
    try { return JSON.parse(localStorage.getItem(styleKey(userId))) || { palette: [], keywords: [] }; }
    catch { return { palette: [], keywords: [] }; }
  }
  function setStyleProfile(userId, profile) {
    localStorage.setItem(styleKey(userId), JSON.stringify(profile));
  }

  function getProjectMeta(userId) {
    try { return JSON.parse(localStorage.getItem(metaKey(userId))) || { restrictions: '', priorities: '' }; }
    catch { return { restrictions: '', priorities: '' }; }
  }
  function setProjectMeta(userId, meta) {
    localStorage.setItem(metaKey(userId), JSON.stringify(meta));
  }

  /**
   * Gera combinações de materiais SOMENTE a partir da lista que o próprio arquiteto
   * cadastrou como favorita — resolve o medo de "sugestão bonita mas inexequível".
   */
  function generateMaterialCombos(materials) {
    if (!materials || materials.length < 2) return [];
    const names = materials.map(m => typeof m === 'string' ? m : m.name);
    const combos = [];
    for (let i = 0; i < names.length && combos.length < 3; i += 2) {
      const pair = names.slice(i, i + 2);
      if (pair.length < 2) pair.push(names[0]);
      combos.push({
        name: `Combinação ${combos.length + 1} — ${pair.join(' + ')}`,
        materials: pair,
      });
    }
    return combos;
  }

  /**
   * Anexo de arquivo (imagem/PDF do portfólio) sem back-end de upload dedicado:
   * o arquivo vira um data URI (base64) que é salvo direto no campo imageUrl/projectUrl
   * (ambos são só String no schema do User) — funciona sem mudar o back-end, mas
   * não escala para arquivos grandes ou portfólios extensos (cada um infla o
   * documento do usuário no Mongo). Para produção, o ideal é um serviço de
   * armazenamento de objetos (S3, Cloudinary etc.) retornando só a URL.
   */
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  function setupFileInput(fileInputId, previewId, onChange, { isImage = false } = {}) {
    const input = document.getElementById(fileInputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    function clear() {
      input.value = '';
      preview.style.display = 'none';
      preview.innerHTML = '';
      onChange('');
    }

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) {
        alert(`Arquivo muito grande (máx. ${MAX_FILE_SIZE / (1024 * 1024)}MB). Escolha um arquivo menor ou use o campo de link.`);
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result);
        preview.style.display = 'flex';
        preview.innerHTML = `
          ${isImage ? `<img src="${reader.result}" alt="">` : `<span class="doc-ic">${(file.name.split('.').pop() || 'arq').slice(0, 4)}</span>`}
          <span>${file.name} (${Math.round(file.size / 1024)} KB)</span>
          <button type="button" class="remove-file">×</button>
        `;
        preview.querySelector('.remove-file').addEventListener('click', clear);
      };
      reader.readAsDataURL(file);
    });

    return { clear };
  }

  // ---------------- Chips: multi-seleção (reusado no cadastro, no drawer de
  // projetos do cliente e no drawer de portfólio do arquiteto) ----------------
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

  /**
   * Foco preso dentro de um painel (modal/drawer) — o mesmo padrão que já
   * existia copiado 3x (founders.js, checkout.js, color-wheel.js), extraído
   * uma vez só pra ser reusado pelo drawer de projetos/portfólio também.
   */
  function trapFocus(panel, { onEscape } = {}) {
    function focusableEls() {
      return Array.from(panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.disabled && el.offsetParent !== null);
    }
    function handleKeydown(e) {
      if (e.key === 'Escape') { onEscape?.(); return; }
      if (e.key !== 'Tab') return;
      const els = focusableEls();
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    panel.addEventListener('keydown', handleKeydown);
    return { focusFirst() { focusableEls()[0]?.focus(); } };
  }

  return {
    PALETTE, getStyleProfile, setStyleProfile, getProjectMeta, setProjectMeta,
    generateMaterialCombos, setupFileInput,
    buildChipList, chipValues, addChipAdder, buildSingleChipList, singleChipValue, trapFocus,
  };
})();
