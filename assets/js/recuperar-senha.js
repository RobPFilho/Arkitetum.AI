document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotForm');
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  const apiBanner = document.getElementById('apiBanner');
  const apiBaseLabel = document.getElementById('apiBaseLabel');
  const submitBtn = document.getElementById('submitBtn');
  apiBaseLabel.textContent = MatchAPI.base();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    try {
      const { message } = await MatchAPI.forgotPassword(document.getElementById('email').value.trim());
      // Sempre mostra a mesma mensagem de sucesso, exista ou não a conta —
      // o back-end já responde assim de propósito, pra não dar pra descobrir
      // e-mails cadastrados só tentando "esqueci minha senha".
      form.style.display = 'none';
      formSuccess.textContent = message || 'Se esse e-mail estiver cadastrado, enviamos um link de redefinição.';
      formSuccess.style.display = 'block';
    } catch (err) {
      formError.textContent = err.offline
        ? `Não foi possível conectar à API em ${MatchAPI.base()}. Rode o back-end (Arkitetum.AI) localmente com "npm run dev".`
        : err.message || 'Não foi possível enviar o link agora. Tente de novo.';
      formError.classList.add('show');
      if (err.offline) apiBanner.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar link de redefinição';
    }
  });
});
