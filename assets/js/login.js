document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const formError = document.getElementById('formError');
  const apiBanner = document.getElementById('apiBanner');
  const apiBaseLabel = document.getElementById('apiBaseLabel');
  const submitBtn = document.getElementById('submitBtn');
  apiBaseLabel.textContent = MatchAPI.base();

  if (MatchAPI.currentUser()) location.href = 'dashboard.html';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    document.getElementById('email').closest('.form-field').classList.remove('has-error');
    document.getElementById('password').closest('.form-field').classList.remove('has-error');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';
    try {
      const res = await MatchAPI.login({
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      });
      MatchAPI.setSession(res.token, res.user);
      location.href = 'dashboard.html';
    } catch (err) {
      formError.textContent = err.offline
        ? `Não foi possível conectar à API em ${MatchAPI.base()}. Rode o back-end (Arkitetum.AI) localmente com "npm run dev".`
        : err.message || 'E-mail ou senha inválidos.';
      formError.classList.add('show');
      if (err.offline) apiBanner.classList.add('show');
      else {
        document.getElementById('email').closest('.form-field').classList.add('has-error');
        document.getElementById('password').closest('.form-field').classList.add('has-error');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
    }
  });
});
