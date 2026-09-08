document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resetForm');
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  const invalidLinkState = document.getElementById('invalidLinkState');
  const apiBanner = document.getElementById('apiBanner');
  const apiBaseLabel = document.getElementById('apiBaseLabel');
  const submitBtn = document.getElementById('submitBtn');
  apiBaseLabel.textContent = MatchAPI.base();

  const token = new URLSearchParams(location.search).get('token');
  if (!token) {
    form.style.display = 'none';
    invalidLinkState.style.display = 'block';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (password !== confirmPassword) {
      formError.textContent = 'As senhas não coincidem.';
      formError.classList.add('show');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Redefinindo...';
    try {
      await MatchAPI.resetPassword(token, password, confirmPassword);
      form.style.display = 'none';
      formSuccess.innerHTML = 'Senha redefinida com sucesso! <a href="login.html">Entrar agora</a>.';
      formSuccess.style.display = 'block';
    } catch (err) {
      if (err.offline) {
        formError.textContent = `Não foi possível conectar à API em ${MatchAPI.base()}. Rode o back-end (Arkitetum.AI) localmente com "npm run dev".`;
        formError.classList.add('show');
        apiBanner.classList.add('show');
      } else if (err.status === 400) {
        form.style.display = 'none';
        invalidLinkState.style.display = 'block';
      } else {
        formError.textContent = err.message || 'Não foi possível redefinir a senha agora. Tente de novo.';
        formError.classList.add('show');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Redefinir senha';
    }
  });
});
