// Comportamento compartilhado do site: navegação mobile, ano do rodapé,
// destaque do link ativo, animações de entrada e estado de sessão no header.
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    if (a.dataset.page === path) a.classList.add('active');
  });

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.14 });
    revealEls.forEach(el => io.observe(el));
  }

  // Estado de sessão no cabeçalho (login/cadastro <-> painel/sair)
  const user = window.MatchAPI ? MatchAPI.currentUser() : null;
  const authSlot = document.querySelector('[data-auth-slot]');
  if (authSlot) {
    if (user) {
      authSlot.innerHTML = `
        <a href="dashboard.html" class="login-link">${user.name.split(' ')[0]}</a>
        <a href="dashboard.html" class="btn btn-primary btn-sm">Painel</a>
      `;
    } else {
      authSlot.innerHTML = `
        <a href="login.html" class="login-link">Entrar</a>
        <a href="cadastro.html" class="btn btn-primary btn-sm">Cadastrar</a>
      `;
    }
  }
});
