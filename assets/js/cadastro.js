document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cadastroForm');
  const btnCliente = document.getElementById('btnCliente');
  const btnArquiteto = document.getElementById('btnArquiteto');
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  const apiBanner = document.getElementById('apiBanner');
  const apiBaseLabel = document.getElementById('apiBaseLabel');
  const submitBtn = document.getElementById('submitBtn');

  apiBaseLabel.textContent = MatchAPI.base();

  let role = 'client';
  function setRole(next) {
    role = next;
    btnCliente.classList.toggle('active', role === 'client');
    btnArquiteto.classList.toggle('active', role === 'architect');
    submitBtn.textContent = role === 'client' ? 'Criar conta de cliente' : 'Criar conta de arquiteto';
  }
  btnCliente.addEventListener('click', () => setRole('client'));
  btnArquiteto.addEventListener('click', () => setRole('architect'));

  const params = new URLSearchParams(location.search);
  setRole(params.get('tipo') === 'arquiteto' ? 'architect' : 'client');

  function val(id) { return document.getElementById(id).value.trim(); }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formSuccess.classList.remove('show');

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (password !== confirmPassword) {
      formError.textContent = 'As senhas não coincidem.';
      formError.classList.add('show');
      return;
    }

    const payload = {
      name: val('name'),
      email: val('email'),
      password,
      confirmPassword,
      referredBy: params.get('ref') || undefined,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Criando conta...';
    try {
      const res = role === 'client' ? await MatchAPI.registerClient(payload) : await MatchAPI.registerArchitect(payload);
      MatchAPI.setSession(res.token, res.user);
      formSuccess.textContent = 'Conta criada com sucesso! Redirecionando para o seu painel...';
      formSuccess.classList.add('show');
      // Sinaliza pro painel abrir direto o fluxo de "primeiro projeto"
      // (cliente) ou o checklist de portfólio (arquiteto) em vez do painel vazio.
      sessionStorage.setItem('matchia_just_registered', '1');
      setTimeout(() => { location.href = 'dashboard.html'; }, 900);
    } catch (err) {
      formError.textContent = err.offline
        ? `Não foi possível conectar à API em ${MatchAPI.base()}. Rode o back-end (Arkitetum.AI) localmente com "npm run dev" e tente novamente.`
        : err.message || 'Não foi possível criar a conta.';
      formError.classList.add('show');
      if (err.offline) apiBanner.classList.add('show');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = role === 'client' ? 'Criar conta de cliente' : 'Criar conta de arquiteto';
    }
  });
});
