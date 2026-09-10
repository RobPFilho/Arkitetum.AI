document.addEventListener('DOMContentLoaded', () => {
  const btnCliente = document.getElementById('btnPlanCliente');
  const btnArquiteto = document.getElementById('btnPlanArquiteto');
  const clientPlans = document.getElementById('clientPlans');
  const architectPlans = document.getElementById('architectPlans');
  const user = MatchAPI.currentUser();

  function setView(role) {
    btnCliente.classList.toggle('active', role === 'client');
    btnArquiteto.classList.toggle('active', role === 'architect');
    clientPlans.style.display = role === 'client' ? 'grid' : 'none';
    architectPlans.style.display = role === 'architect' ? 'grid' : 'none';
  }
  btnCliente.addEventListener('click', () => setView('client'));
  btnArquiteto.addEventListener('click', () => setView('architect'));
  if (user && user.role === 'architect') setView('architect');

  function refreshButtons() {
    document.querySelectorAll('[data-plan]').forEach(btn => {
      const [role, planId] = btn.dataset.plan.split(':');
      if (!user) {
        btn.textContent = planId === 'free' ? 'Criar conta gratuita' : `Assinar ${MatchExtras.PLANS[role][planId].label}`;
        return;
      }
      if (user.role !== role) {
        btn.textContent = `Plano para conta de ${role === 'client' ? 'cliente' : 'arquiteto'}`;
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-primary');
        return;
      }
      const current = MatchExtras.getPlan(user.id, role).id;
      if (current === planId) {
        btn.textContent = '✓ Plano atual';
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-primary');
      } else if (planId === 'free') {
        btn.textContent = 'Voltar para o Gratuito';
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-primary');
      } else {
        btn.textContent = `Assinar ${MatchExtras.PLANS[role][planId].label}`;
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
      }
    });
  }
  refreshButtons();

  document.querySelectorAll('[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [role, planId] = btn.dataset.plan.split(':');

      if (!user) {
        location.href = `cadastro.html?tipo=${role === 'client' ? 'cliente' : 'arquiteto'}`;
        return;
      }
      if (user.role !== role) return;

      const plan = MatchExtras.PLANS[role][planId];
      const current = MatchExtras.getPlan(user.id, role).id;
      if (current === planId) return;

      if (planId === 'free') {
        MatchExtras.setPlan(user.id, 'free');
        refreshButtons();
        return;
      }

      CheckoutModal.open({
        name: `Plano ${plan.label}`,
        desc: role === 'client' ? 'Buscas de match ilimitadas e todos os arquitetos do resultado.' : 'Portfólio ilimitado e selo Pro no seu painel.',
        price: plan.price,
      }, () => {
        MatchExtras.setPlan(user.id, planId);
        refreshButtons();
        alert(`Plano ${plan.label} ativado! Veja no seu painel.`);
      });
    });
  });
});
