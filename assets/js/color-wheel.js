/**
 * Roda de cores (círculo cromático) reutilizável — usada no perfil de estilo do
 * arquiteto para permitir escolher uma cor fora da paleta sugerida, com precisão
 * via HEX/RGB. Singleton: um único overlay é criado e reaberto sob demanda.
 */
const ColorWheelPicker = (() => {
  let overlay, panel, canvas, ctx, cursor, hexInput, rInput, gInput, bInput, brightnessInput, addBtn, closeBtn;
  let size = 240;
  let hue = 20, sat = 0.4, val = 1; // estado atual (HSV)
  let onPickCallback = null;
  let built = false;
  let lastFocused = null;

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

  function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : d / max;
    return [h, s, max];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }
  function hexToRgb(hex) {
    const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function build() {
    if (built) return;
    built = true;
    overlay = document.createElement('div');
    overlay.className = 'color-wheel-overlay';
    overlay.innerHTML = `
      <div class="color-wheel-panel" role="dialog" aria-modal="true" aria-labelledby="colorWheelTitle">
        <button type="button" class="color-wheel-close" aria-label="Fechar">×</button>
        <h4 class="color-wheel-title" id="colorWheelTitle">Escolha uma cor personalizada</h4>
        <div class="color-wheel-wrap" aria-hidden="true">
          <canvas width="${size}" height="${size}"></canvas>
          <div class="color-wheel-cursor"></div>
        </div>
        <p class="cw-hint">A roda de cores é visual; use os campos abaixo para digitar a cor exata.</p>
        <div class="color-wheel-controls">
          <div class="cw-preview-row">
            <div class="cw-preview"></div>
            <span>Pré-visualização</span>
          </div>
          <div class="cw-field">
            <label for="cwHexInput">HEX</label>
            <input type="text" id="cwHexInput" class="cw-hex" maxlength="7" placeholder="#B0755A">
          </div>
          <div class="cw-field-row">
            <div class="cw-field"><label for="cwRInput">R</label><input type="number" id="cwRInput" class="cw-r" min="0" max="255"></div>
            <div class="cw-field"><label for="cwGInput">G</label><input type="number" id="cwGInput" class="cw-g" min="0" max="255"></div>
            <div class="cw-field"><label for="cwBInput">B</label><input type="number" id="cwBInput" class="cw-b" min="0" max="255"></div>
          </div>
          <div>
            <div class="cw-brightness-label"><span id="cwBrightnessLabel">Brilho</span><span class="cw-brightness-value">100%</span></div>
            <input type="range" class="cw-brightness" min="0" max="100" value="100" aria-labelledby="cwBrightnessLabel">
          </div>
          <button type="button" class="btn btn-primary cw-add">+ Adicionar cor à paleta</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    panel = overlay.querySelector('.color-wheel-panel');
    canvas = overlay.querySelector('canvas');
    ctx = canvas.getContext('2d');
    cursor = overlay.querySelector('.color-wheel-cursor');
    hexInput = overlay.querySelector('.cw-hex');
    rInput = overlay.querySelector('.cw-r');
    gInput = overlay.querySelector('.cw-g');
    bInput = overlay.querySelector('.cw-b');
    brightnessInput = overlay.querySelector('.cw-brightness');
    addBtn = overlay.querySelector('.cw-add');
    closeBtn = overlay.querySelector('.color-wheel-close');

    drawWheel();
    setFromHsv(hue, sat, val);

    let dragging = false;
    const pick = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scale = size / rect.width;
      const x = (clientX - rect.left) * scale - size / 2;
      const y = (clientY - rect.top) * scale - size / 2;
      const dist = Math.min(Math.hypot(x, y), size / 2);
      const angle = Math.atan2(y, x);
      hue = (angle * 180 / Math.PI + 360) % 360;
      sat = dist / (size / 2);
      setFromHsv(hue, sat, val, { skipWheelRedraw: true });
    };
    canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); pick(e.clientX, e.clientY); });
    canvas.addEventListener('pointermove', (e) => { if (dragging) pick(e.clientX, e.clientY); });
    canvas.addEventListener('pointerup', () => { dragging = false; });

    brightnessInput.addEventListener('input', () => {
      val = Number(brightnessInput.value) / 100;
      drawWheel();
      setFromHsv(hue, sat, val, { skipBrightness: true });
    });

    hexInput.addEventListener('change', () => {
      const rgb = hexToRgb(hexInput.value.trim());
      if (rgb) setFromRgb(...rgb);
    });
    [rInput, gInput, bInput].forEach(inp => {
      inp.addEventListener('change', () => {
        setFromRgb(Number(rInput.value) || 0, Number(gInput.value) || 0, Number(bInput.value) || 0);
      });
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.addEventListener('keydown', handleKeydown);
    addBtn.addEventListener('click', () => {
      const hex = hexInput.value;
      if (onPickCallback) onPickCallback(hex);
      close();
    });
  }

  function drawWheel() {
    const img = ctx.createImageData(size, size);
    const cx = size / 2, cy = size / 2, radius = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.hypot(dx, dy);
        const idx = (y * size + x) * 4;
        if (dist <= radius) {
          const angle = Math.atan2(dy, dx);
          const h = (angle * 180 / Math.PI + 360) % 360;
          const s = dist / radius;
          const [r, g, b] = hsvToRgb(h, s, val);
          img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255;
        } else {
          img.data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function setFromHsv(h, s, v, opts = {}) {
    hue = h; sat = s; val = v;
    const [r, g, b] = hsvToRgb(h, s, v);
    updateFields(r, g, b);
    // skipBrightness só evita reescrever o valor do próprio slider enquanto o
    // usuário o arrasta (senão o arrasto trava) — o número "%" ao lado sempre
    // tem que refletir o brilho atual, senão fica preso no valor inicial.
    if (!opts.skipBrightness) brightnessInput.value = Math.round(v * 100);
    overlay.querySelector('.cw-brightness-value').textContent = Math.round(v * 100) + '%';
    if (!opts.skipWheelRedraw) drawWheel();
    positionCursor();
  }

  function setFromRgb(r, g, b) {
    const [h, s, v] = rgbToHsv(r, g, b);
    hue = h; sat = s; val = v;
    updateFields(r, g, b);
    brightnessInput.value = Math.round(v * 100);
    overlay.querySelector('.cw-brightness-value').textContent = Math.round(v * 100) + '%';
    drawWheel();
    positionCursor();
  }

  function updateFields(r, g, b) {
    const hex = rgbToHex(r, g, b);
    hexInput.value = hex;
    rInput.value = r; gInput.value = g; bInput.value = b;
    overlay.querySelector('.cw-preview').style.background = hex;
  }

  function positionCursor() {
    const radius = size / 2;
    const rad = hue * Math.PI / 180;
    const x = radius + Math.cos(rad) * sat * radius;
    const y = radius + Math.sin(rad) * sat * radius;
    cursor.style.left = (x / size * 100) + '%';
    cursor.style.top = (y / size * 100) + '%';
  }

  function close() {
    overlay.classList.remove('open');
    if (lastFocused) lastFocused.focus();
  }

  /** Abre o seletor, animando o crescimento a partir do botão que disparou a ação. */
  function open(triggerEl, initialHex, onPick) {
    build();
    onPickCallback = onPick;
    lastFocused = triggerEl || document.activeElement;

    const startRgb = hexToRgb(initialHex) || [176, 117, 90];
    setFromRgb(...startRgb);

    overlay.classList.add('open');
    hexInput.focus();

    const wrap = overlay.querySelector('.color-wheel-wrap');
    const btnRect = triggerEl.getBoundingClientRect();
    // Espera o layout assentar para medir a posição final do círculo grande.
    requestAnimationFrame(() => {
      const finalRect = wrap.getBoundingClientRect();
      const btnCx = btnRect.left + btnRect.width / 2;
      const btnCy = btnRect.top + btnRect.height / 2;
      const finalCx = finalRect.left + finalRect.width / 2;
      const finalCy = finalRect.top + finalRect.height / 2;
      const dx = btnCx - finalCx;
      const dy = btnCy - finalCy;
      const scaleStart = Math.max(btnRect.width / finalRect.width, 0.06);

      wrap.style.transition = 'none';
      wrap.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleStart})`;
      wrap.style.opacity = '0.4';
      // Força o reflow antes de religar a transição.
      void wrap.offsetWidth;
      requestAnimationFrame(() => {
        wrap.style.transition = 'transform .45s var(--ease-out), opacity .3s ease';
        wrap.style.transform = 'translate(0, 0) scale(1)';
        wrap.style.opacity = '1';
      });
    });
  }

  return { open, close };
})();
