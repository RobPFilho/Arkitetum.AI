/**
 * Perfis detalhados do time, abertos ao clicar em cada card na página Sobre.
 * Só o perfil do Natanael está preenchido por enquanto — os demais mostram um
 * estado "em breve" até que cada integrante mande o que quer publicar no seu.
 * Pra ativar a foto de alguém, basta colocar o arquivo em assets/img/team/<id>.png
 * — sem a foto, o círculo cai de volta pras iniciais automaticamente.
 */
const FOUNDERS = {
  natanael: {
    name: 'Natanael Martins Gomes Santos',
    role: 'Produto & Tecnologia',
    initials: 'NM',
    photo: 'assets/img/team/natanael.png',
    eyebrow: 'Fundador · Produto & Tecnologia',
    tagline: 'Arquitetou o match.IA de ponta a ponta — do banco de dados à última curva de borda da interface.',
    bio: [
      'Responsável pela concepção técnica e de produto do match.IA: back-end em Node.js e MongoDB, o motor de compatibilidade entre clientes e arquitetos, e a integração com IA generativa (Gemini) que explica cada match em linguagem natural.',
      'Também desenhou o design system da plataforma — tipografia, cores, componentes e o modo escuro — com atenção a acessibilidade (contraste WCAG, navegação por teclado) e conformidade com a LGPD.',
      'Gosta de levar um projeto até o detalhe que ninguém pediu: o foco de teclado certo, a transição que não atrasa, o estado vazio que não parece um erro.'
    ],
    factsLeft: [
      { label: 'Stack', value: 'Node.js · MongoDB · Express' },
      { label: 'IA aplicada', value: 'Gemini · motor de compatibilidade' },
      { label: 'Formação', value: 'Técnico em Informática, FIAP School' }
    ],
    factsRight: [
      { label: 'No projeto', value: 'Produto, back-end & design system' },
      { label: 'Também cuida de', value: 'Acessibilidade & LGPD' },
      { label: 'Turma', value: '3EMIB — FIAP School' }
    ],
    links: [
      { label: 'GitHub', url: 'https://github.com/natanaelmgs04' },
      { label: 'E-mail', url: 'mailto:natanaelmgs04@gmail.com' }
    ]
  },
  alex: { name: 'Alex Chen Marubayashi', role: 'Equipe match.IA', initials: 'AC', photo: 'assets/img/team/alex.png' },
  cinthia: { name: 'Cinthia Yamamoto Gushiken', role: 'Identidade & produto', initials: 'CY', photo: 'assets/img/team/cinthia.png' },
  italo: { name: 'Ítalo Santos de Morais', role: 'Equipe match.IA', initials: 'IS', photo: 'assets/img/team/italo.png' },
  julya: { name: 'Julya Vitoria Souza Vieira', role: 'Equipe match.IA', initials: 'JV', photo: 'assets/img/team/julya.png' },
  roberto: { name: 'Roberto de Andrade Paiva Filho', role: 'Identidade visual & back-end', initials: 'RP', photo: 'assets/img/team/roberto.png' }
};

const FounderModal = (() => {
  let overlay, panel, lastFocused;

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'founder-modal-overlay';
    overlay.innerHTML = `
      <div class="founder-modal" role="dialog" aria-modal="true" aria-labelledby="founderName">
        <button type="button" class="founder-close" aria-label="Fechar perfil">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>
        </button>
        <div id="founderInner"></div>
      </div>`;
    document.body.appendChild(overlay);
    panel = overlay.querySelector('.founder-modal');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.founder-close').addEventListener('click', close);
    overlay.addEventListener('keydown', handleKeydown);
  }

  function focusableEls() {
    return Array.from(panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const items = focusableEls();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
    if (lastFocused) lastFocused.focus();
  }

  function factsHtml(facts) {
    return (facts || []).map(f => `<div class="founder-fact"><span class="founder-fact-label">${f.label}</span><span class="founder-fact-value">${f.value}</span></div>`).join('');
  }

  function photoHtml(founder) {
    return `
      <div class="founder-photo-ring">
        <img class="founder-photo" src="${founder.photo || ''}" alt="${founder.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="founder-avatar-fallback" style="display:none;">${founder.initials}</div>
      </div>`;
  }

  function renderDetailed(founder) {
    return `
      <div class="founder-layout">
        <div class="founder-facts founder-facts-left">${factsHtml(founder.factsLeft)}</div>
        <div class="founder-portrait">
          ${photoHtml(founder)}
          <span class="founder-role-tag">${founder.role}</span>
        </div>
        <div class="founder-facts founder-facts-right">${factsHtml(founder.factsRight)}</div>
      </div>
      <div class="founder-body">
        <span class="eyebrow">${founder.eyebrow || founder.role}</span>
        <h2 id="founderName">${founder.name}</h2>
        ${founder.tagline ? `<p class="founder-tagline">${founder.tagline}</p>` : ''}
        <div class="founder-bio">${(founder.bio || []).map(p => `<p>${p}</p>`).join('')}</div>
        ${founder.links && founder.links.length ? `<div class="founder-links">${founder.links.map(l => `<a href="${l.url}" class="btn btn-secondary btn-sm" target="_blank" rel="noopener">${l.label}</a>`).join('')}</div>` : ''}
      </div>`;
  }

  function renderPlaceholder(founder) {
    const firstName = founder.name.split(' ')[0];
    return `
      <div class="founder-layout founder-layout--solo">
        <div class="founder-portrait">
          ${photoHtml(founder)}
          <span class="founder-role-tag">${founder.role}</span>
        </div>
      </div>
      <div class="founder-body founder-body--center">
        <span class="eyebrow">Fundador</span>
        <h2 id="founderName">${founder.name}</h2>
        <p class="founder-tagline">Perfil completo em breve</p>
        <p style="color:var(--ink-soft); max-width:420px; margin:0 auto;">${firstName} ainda vai preencher este espaço com sua trajetória, principais contribuições no match.IA e um pouco mais sobre quem é fora do projeto.</p>
      </div>`;
  }

  function open(id) {
    const founder = FOUNDERS[id];
    if (!founder) return;
    build();
    lastFocused = document.activeElement;
    overlay.querySelector('#founderInner').innerHTML = founder.bio ? renderDetailed(founder) : renderPlaceholder(founder);
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
    overlay.querySelector('.founder-close').focus();
  }

  return { open, close };
})();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-founder]').forEach(btn => {
    btn.addEventListener('click', () => FounderModal.open(btn.dataset.founder));
  });
});
