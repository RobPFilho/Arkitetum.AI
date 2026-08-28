/**
 * Camada de dados complementar às 3 novidades pedidas pela equipe (a partir do
 * briefing da Teresa): perfil de estilo do arquiteto, banco de materiais restrito
 * e resumo do projeto validável.
 *
 * IMPORTANTE: o back-end Arkitetum.AI hoje não tem campos para paleta de cores,
 * palavras-chave, restrições/prioridades do projeto nem validação de resumo.
 * Para não travar a demo na mentoria, essas partes ficam salvas no localStorage
 * do navegador (por usuário). Materiais recorrentes e portfólio já são 100% reais
 * (vêm da API). Quando o time decidir levar isso pra produção, dá pra migrar essas
 * chaves para novos campos no schema do User (architectProfile.colorPalette,
 * architectProfile.keywords, clientProfile.restrictions/priorities) + um endpoint
 * de validação de match.
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
  const validationKey = (clientId, architectId) => `matchia_validation_${clientId}_${architectId}`;

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

  function getValidation(clientId, architectId) {
    try { return JSON.parse(localStorage.getItem(validationKey(clientId, architectId))) || { client: false, architect: false }; }
    catch { return { client: false, architect: false }; }
  }
  function setValidation(clientId, architectId, state) {
    localStorage.setItem(validationKey(clientId, architectId), JSON.stringify(state));
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
          ${isImage ? `<img src="${reader.result}" alt="">` : '<span class="doc-ic">📄</span>'}
          <span>${file.name} (${Math.round(file.size / 1024)} KB)</span>
          <button type="button" class="remove-file">×</button>
        `;
        preview.querySelector('.remove-file').addEventListener('click', clear);
      };
      reader.readAsDataURL(file);
    });

    return { clear };
  }

  return { PALETTE, getStyleProfile, setStyleProfile, getProjectMeta, setProjectMeta, getValidation, setValidation, generateMaterialCombos, setupFileInput };
})();
