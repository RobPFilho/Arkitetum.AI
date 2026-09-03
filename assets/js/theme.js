(function () {
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
      btn.textContent = t === 'dark' ? '☀️' : t === 'light' ? '🌙' : '🌓';
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
