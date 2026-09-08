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
  const user = typeof MatchAPI !== 'undefined' ? MatchAPI.currentUser() : null;
  const authSlot = document.querySelector('[data-auth-slot]');
  if (authSlot) {
    if (user) {
      authSlot.innerHTML = `
        <div class="notif-bell-wrap">
          <button type="button" class="notif-bell" id="notifBellBtn" aria-label="Notificações"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 3.4 1 5.2 1.8 6.2a.9.9 0 0 1-.7 1.5H4.9a.9.9 0 0 1-.7-1.5C5 14.2 6 12.4 6 9Z"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0"/></svg><span class="unread-badge" id="notifBellBadge" style="display:none;"></span></button>
          <div class="notif-dropdown" id="notifDropdown" style="display:none;"></div>
        </div>
        <a href="dashboard.html" class="login-link">${user.name.split(' ')[0]}</a>
        <a href="dashboard.html" class="btn btn-primary btn-sm">Painel <span class="unread-badge" id="navUnreadBadge" style="display:none; margin-left:6px;"></span></a>
      `;
      if (typeof MatchAPI !== 'undefined' && MatchAPI.token()) {
        MatchAPI.unreadCount().then(({ count }) => {
          if (!count) return;
          const badge = document.getElementById('navUnreadBadge');
          if (badge) { badge.textContent = count > 9 ? '9+' : count; badge.style.display = 'inline-flex'; }
        }).catch(() => { /* API fora do ar — não afeta a navegação */ });

        const bellBtn = document.getElementById('notifBellBtn');
        const bellBadge = document.getElementById('notifBellBadge');
        const dropdown = document.getElementById('notifDropdown');
        MatchAPI.notificationsUnreadCount().then(({ count }) => {
          if (!count) return;
          bellBadge.textContent = count > 9 ? '9+' : count;
          bellBadge.style.display = 'inline-flex';
        }).catch(() => {});

        bellBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const isOpen = dropdown.style.display !== 'none';
          if (isOpen) { dropdown.style.display = 'none'; return; }
          dropdown.style.display = 'block';
          dropdown.innerHTML = '<p style="padding:14px; font-size:0.84rem; color:var(--ink-faint); margin:0;">Carregando...</p>';
          try {
            const notifications = await MatchAPI.notifications();
            dropdown.innerHTML = notifications.length
              ? notifications.map(n => `
                  <a href="${n.link || 'dashboard.html'}" class="notif-item ${n.read ? '' : 'unread'}">
                    <span>${n.text}</span>
                    <span class="notif-time">${new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </a>`).join('')
              : '<p style="padding:14px; font-size:0.84rem; color:var(--ink-faint); margin:0;">Nenhuma notificação ainda.</p>';
            bellBadge.style.display = 'none';
            MatchAPI.markNotificationsRead().catch(() => {});
          } catch {
            dropdown.innerHTML = '<p style="padding:14px; font-size:0.84rem; color:var(--ink-faint); margin:0;">Não foi possível carregar as notificações.</p>';
          }
        });
        document.addEventListener('click', (e) => {
          if (!dropdown.contains(e.target) && e.target !== bellBtn) dropdown.style.display = 'none';
        });
      }
    } else {
      authSlot.innerHTML = `
        <a href="login.html" class="login-link">Entrar</a>
        <a href="cadastro.html" class="btn btn-primary btn-sm">Cadastrar</a>
      `;
    }
  }

  // Estatística real da home (média de compatibilidade calculada pelo motor
  // de match sobre todas as buscas já feitas) — só existe nesta página.
  const heroStat = document.getElementById('heroAvgCompat');
  if (heroStat && typeof MatchAPI !== 'undefined') {
    MatchAPI.stats()
      .then(({ avgCompatibility }) => { heroStat.textContent = avgCompatibility !== null ? `${avgCompatibility}%` : '95%'; })
      .catch(() => { heroStat.textContent = '95%'; });
  }

  // PWA: registra o service worker (só em http/https — 'file://' não suporta).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* offline não é crítico */ });
  }
});
