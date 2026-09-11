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

  const roleLabels = { client: 'cliente', architect: 'arquiteto', store: 'loja' };
  let role = 'client';
  function setRole(next) {
    role = next;
    btnCliente.classList.toggle('active', role === 'client');
    btnArquiteto.classList.toggle('active', role === 'architect');
    submitBtn.textContent = `Criar conta de ${roleLabels[role]}`;
    document.getElementById('storeNameField').style.display = role === 'store' ? '' : 'none';
  }
  btnCliente.addEventListener('click', () => setRole('client'));
  btnArquiteto.addEventListener('click', () => setRole('architect'));

  const params = new URLSearchParams(location.search);
  const tipo = params.get('tipo');
  if (tipo === 'loja') {
    // Loja parceira não escolhe papel pelo toggle -- chega direto pelo link
    // discreto "Sou uma loja parceira".
    document.getElementById('roleToggle').style.display = 'none';
    document.getElementById('storeLinkNote').style.display = 'none';
    setRole('store');
  } else {
    setRole(tipo === 'arquiteto' ? 'architect' : 'client');
  }

  function val(id) { return document.getElementById(id).value.trim(); }

  // Foto de perfil — vira data URI (mesmo mecanismo já usado nas fotos de
  // portfólio), sem exigir um serviço de upload dedicado. Opcional.
  let avatarDataUri = '';
  MatchExtras.setupFileInput('avatarFile', 'avatarPreview', (uri) => { avatarDataUri = uri; }, { isImage: true });

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
      avatarUrl: avatarDataUri || undefined,
      bio: val('bio') || undefined,
      referredBy: params.get('ref') || undefined,
    };
    if (role === 'store') payload.storeName = val('storeName');

    const registerFn = { client: MatchAPI.registerClient, architect: MatchAPI.registerArchitect, store: MatchAPI.registerStore }[role];

    submitBtn.disabled = true;
    submitBtn.textContent = 'Criando conta...';
    try {
      const res = await registerFn(payload);
      MatchAPI.setSession(res.token, res.user);
      formSuccess.textContent = 'Conta criada com sucesso! Redirecionando para o seu painel...';
      formSuccess.classList.add('show');
      // Sinaliza pro painel abrir direto o menu de "primeiro projeto"
      // (cliente), "primeira peça de portfólio" (arquiteto) ou "primeiro
      // produto" (loja).
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
      submitBtn.textContent = `Criar conta de ${roleLabels[role]}`;
    }
  });
});
