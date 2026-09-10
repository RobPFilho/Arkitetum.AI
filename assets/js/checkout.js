/**
 * Modal de "checkout" simulado para a assinatura freemium. Não existe gateway de
 * pagamento no back-end — isso só demonstra a régua de planos do modelo de negócio.
 * Nenhum dado de pagamento é pedido e nenhuma cobrança real acontece em nenhum momento.
 */
const CheckoutModal = (() => {
  let overlay, panel, lastFocused;

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'checkout-modal-overlay';
    overlay.innerHTML = `
      <div class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkoutPlanName">
        <span class="sim-badge">Simulação — projeto acadêmico, sem cobrança real</span>
        <h3 id="checkoutPlanName">Plano Premium</h3>
        <p id="checkoutPlanDesc" style="color:var(--ink-soft); font-size:0.9rem; margin:0;"></p>
        <div class="checkout-price"><span id="checkoutPrice">R$29</span><span id="checkoutPeriod"> /mês</span></div>
        <div class="checkout-actions">
          <button type="button" class="btn btn-secondary" id="checkoutCancel">Cancelar</button>
          <button type="button" class="btn btn-primary" id="checkoutConfirm">Confirmar assinatura</button>
        </div>
        <p class="fine-print">Este é o TCC match.IA. Nenhum dado de pagamento é coletado — "confirmar" apenas ativa o plano de demonstração na sua conta, salvo neste navegador.</p>
      </div>`;
    document.body.appendChild(overlay);
    panel = overlay.querySelector('.checkout-modal');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('#checkoutCancel').addEventListener('click', close);
    overlay.addEventListener('keydown', handleKeydown);
  }

  function focusableEls() {
    return Array.from(panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const items = focusableEls();
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    if (lastFocused) lastFocused.focus();
  }

  /** open({name, desc, price}, onConfirm) */
  function open({ name, desc, price }, onConfirm) {
    build();
    lastFocused = document.activeElement;
    overlay.querySelector('#checkoutPlanName').textContent = name;
    overlay.querySelector('#checkoutPlanDesc').textContent = desc || '';
    overlay.querySelector('#checkoutPrice').textContent = price === 0 ? 'Grátis' : `R$${price}`;
    overlay.querySelector('#checkoutPeriod').style.display = price === 0 ? 'none' : 'inline';

    const oldBtn = overlay.querySelector('#checkoutConfirm');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.addEventListener('click', () => { onConfirm(); close(); });

    overlay.classList.add('open');
    overlay.querySelector('#checkoutCancel').focus();
  }

  return { open, close };
})();
