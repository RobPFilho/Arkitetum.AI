(function () {
  // Ícones de linha simples (sol/lua/monitor) em vez de emoji — o emoji do
  // sistema operacional varia de estilo a cada plataforma e nunca combina de
  // verdade com o resto da interface.
  const ICONS = {
    dark: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5"/></svg>',
    light: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"/></svg>',
    system: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16.5V20"/></svg>',
  };
  function apply(theme) {
    if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }
  function current() {
    return localStorage.getItem('matchia_theme') || 'system';
  }
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    function updateIcon() {
      const t = current();
      btn.innerHTML = ICONS[t];
      btn.title = t === 'dark' ? 'Modo escuro — clique para claro' : t === 'light' ? 'Modo claro — clique para escuro' : 'Seguindo o sistema — clique para escuro';
    }
    updateIcon();
    btn.addEventListener('click', () => {
      const order = ['system', 'light', 'dark'];
      const next = order[(order.indexOf(current()) + 1) % order.length];
      localStorage.setItem('matchia_theme', next);
      apply(next === 'system' ? null : next);
      updateIcon();
    });
  });
})();
