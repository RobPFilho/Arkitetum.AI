/**
 * Carrossel 3D de projetos (vitrine da home/projetos) — cilindro horizontal
 * com profundidade volumétrica, parallax de mouse com damping e frente/verso
 * reais por rotação. Adaptado de um conceito de carrossel de cartão
 * bancário: mesma física (smoothstep + fórmulas de perspectiva pra
 * esconder cards fora da tela), eixo trocado de vertical pra horizontal
 * (cabe melhor numa faixa de "carrossel" no meio da página) e conteúdo
 * trocado de cartão (número/CVV) pra ficha de projeto (foto, título,
 * arquiteto, compatibilidade). Zero dependência — DOM + rAF puro, como o
 * resto do site.
 *
 * Uso: window.ProjectCarousel3D.create(containerEl, items) — items:
 * { image, title, style, areaM2, compatibilityScore, architectId,
 *   architectName, architectCity }[]. Retorna null se a página estiver em
 * prefers-reduced-motion, a tela for pequena demais pra valer a pena, ou
 * não houver itens suficientes pra fazer um cilindro (o chamador deve usar
 * o fallback de lista simples nesses casos).
 */
(function () {
  const D = 1350; // distância de perspectiva, igual ao perspective:1350px do CSS

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function buildFront(item) {
    const wrap = document.createElement('div');
    wrap.className = 'pc3d-front-content';
    const badge = typeof item.compatibilityScore === 'number'
      ? `<span class="pc3d-badge">${Math.round(item.compatibilityScore)}% match</span>`
      : '';
    wrap.innerHTML = `
      <div class="pc3d-media">
        ${item.image ? `<img src="${item.image}" alt="" loading="lazy">` : '<div class="pc3d-media-fallback"></div>'}
        <div class="pc3d-media-scrim"></div>
      </div>
      ${badge}
      <div class="pc3d-title">${escapeHtml(item.title || 'Projeto')}</div>
    `;
    return wrap;
  }

  function buildBack(item) {
    const wrap = document.createElement('div');
    wrap.className = 'pc3d-back-content';
    const details = [item.style, item.areaM2 ? `${item.areaM2} m²` : null].filter(Boolean).join(' · ');
    wrap.innerHTML = `
      <div class="pc3d-media">
        ${item.image ? `<img src="${item.image}" alt="" loading="lazy">` : '<div class="pc3d-media-fallback"></div>'}
        <div class="pc3d-media-scrim"></div>
      </div>
      <div class="pc3d-spec">
        <div class="pc3d-spec-name">${escapeHtml(item.architectName || 'Arquiteto')}</div>
        <div class="pc3d-spec-line">${escapeHtml([item.architectCity, details].filter(Boolean).join(' · '))}</div>
      </div>
    `;
    return wrap;
  }

  function create(container, items) {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // window.innerWidth pode vir 0 num frame de layout ainda não assentado
    // (raro, mas visto em alguns contextos de preview) — nesse caso confia
    // na largura real do container em vez de barrar o carrossel à toa.
    const effectiveWidth = window.innerWidth || container.clientWidth || 1000;
    if (reduceMotion || effectiveWidth < 640 || !items || items.length < 3) return null;

    const cardCount = items.length;

    container.innerHTML = '';
    container.classList.add('pc3d-viewport');

    const stage = document.createElement('div');
    stage.className = 'pc3d-stage';
    container.appendChild(stage);

    const cardEls = items.map((item, i) => {
      const a = document.createElement('a');
      a.className = 'pc3d-card';
      if (item.architectId) a.href = `arquiteto.html?id=${encodeURIComponent(item.architectId)}`;

      const thicknessLayers = [-1.47, -0.73, 0, 0.73, 1.47];
      thicknessLayers.forEach((zOffset, layerIdx) => {
        const isFront = layerIdx === thicknessLayers.length - 1;
        const isBack = layerIdx === 0;
        const layer = document.createElement('div');
        layer.className = 'pc3d-layer ' + (isFront ? 'pc3d-front' : isBack ? 'pc3d-back' : 'pc3d-edge');
        layer.style.transform = isBack ? `translateZ(${zOffset}px) rotateY(180deg)` : `translateZ(${zOffset}px)`;
        if (isFront) layer.appendChild(buildFront(item));
        if (isBack) layer.appendChild(buildBack(item));
        a.appendChild(layer);
      });

      a.addEventListener('click', (e) => {
        let offset = i - Math.round(progress);
        const half = cardCount / 2;
        while (offset > half) offset -= cardCount;
        while (offset < -half) offset += cardCount;
        if (Math.abs(offset) > 0.5) {
          e.preventDefault();
          progress += offset;
        }
      });

      stage.appendChild(a);
      return a;
    });

    let metrics = computeMetrics();
    applyMetrics();

    let progress = 0;
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let hovering = false;
    let frameId = null;

    function computeMetrics() {
      const w = container.clientWidth || 600;
      const cardW = Math.min(280, Math.max(170, Math.round(w * 0.4)));
      const cardH = Math.round(cardW / 1.3); // proporção de foto, não de cartão de crédito
      return { cardW, cardH, viewportW: w };
    }

    function applyMetrics() {
      stage.style.width = metrics.cardW + 'px';
      stage.style.height = metrics.cardH + 'px';
      container.style.height = Math.round(metrics.cardH * 1.7) + 'px';
    }

    function onMouseMove(e) {
      const rect = container.getBoundingClientRect();
      const rx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ry = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      mouse.targetX = Math.max(-1, Math.min(1, rx));
      mouse.targetY = Math.max(-1, Math.min(1, ry));
    }
    function onMouseEnter() { hovering = true; }
    function onMouseLeave() {
      hovering = false;
      mouse.targetX = 0;
      mouse.targetY = 0;
    }

    document.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

    function renderLoop() {
      if (!hovering) progress += 0.0016;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      const roundedIndex = Math.round(progress);
      const diff = progress - roundedIndex;
      const easedDiff = Math.sign(diff) * Math.pow(Math.abs(diff) * 2, 4.2) / 2;
      const virtualActiveIndex = roundedIndex + easedDiff;

      const { cardW, viewportW } = metrics;
      const gap = 28;
      const peek = -24;

      for (let i = 0; i < cardCount; i++) {
        const card = cardEls[i];
        let offset = i - virtualActiveIndex;
        const half = cardCount / 2;
        while (offset > half) offset -= cardCount;
        while (offset < -half) offset += cardCount;

        const absOffset = Math.abs(offset);
        const sign = Math.sign(offset);

        if (absOffset > 3) { card.style.visibility = 'hidden'; continue; }
        card.style.visibility = 'visible';

        let x = 0, z = 0, rot = 0;

        if (absOffset <= 1) {
          const t = absOffset;
          const e = t * t * (3 - 2 * t);
          x = -sign * (e * (cardW + gap));
          z = 400 + e * (220 - 400);
          rot = e * 132;
        } else if (absOffset <= 2) {
          const t = absOffset - 1;
          const e = t * t * (3 - 2 * t);
          const xStart = cardW + gap, zStart = 220, rotStart = 132;
          const zEnd = -60, rotEnd = 175;
          const sEnd = D / (D - zEnd);
          const xEnd = (viewportW / 2 - peek) / sEnd - cardW / 2;
          x = -sign * (xStart + e * (xEnd - xStart));
          z = zStart + e * (zEnd - zStart);
          rot = rotStart + e * (rotEnd - rotStart);
        } else {
          const t = Math.min(absOffset - 2, 1);
          const e = t * t * (3 - 2 * t);
          const zStart = -60, rotStart = 175;
          const zEnd3 = -250, rotEnd3 = 195;
          const sEnd2 = D / (D - zStart);
          const xEnd2 = (viewportW / 2 - peek) / sEnd2 - cardW / 2;
          const sEnd3 = D / (D - zEnd3);
          const xEnd3 = (viewportW / 2 + 60) / sEnd3 + cardW / 2;
          x = -sign * (xEnd2 + e * (xEnd3 - xEnd2));
          z = zStart + e * (zEnd3 - zStart);
          rot = rotStart + e * (rotEnd3 - rotStart);
        }

        const localRotY = -sign * rot;
        const centerFactor = Math.max(0, 1 - absOffset);
        const tiltX = -mouse.y * 10 * centerFactor;
        const tiltY = mouse.x * 12 * centerFactor;

        card.style.zIndex = Math.round(z).toString();
        card.style.transform = `translateX(${x.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateY(${(localRotY + tiltY).toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg) rotateZ(-2deg)`;
      }

      frameId = requestAnimationFrame(renderLoop);
    }

    frameId = requestAnimationFrame(renderLoop);

    document.addEventListener('visibilitychange', onVisibilityChange);
    function onVisibilityChange() {
      if (document.hidden) cancelAnimationFrame(frameId);
      else frameId = requestAnimationFrame(renderLoop);
    }

    const ro = new ResizeObserver(() => {
      metrics = computeMetrics();
      applyMetrics();
    });
    ro.observe(container);

    return {
      next: () => { progress = Math.round(progress) + 1; },
      prev: () => { progress = Math.round(progress) - 1; },
      destroy() {
        cancelAnimationFrame(frameId);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        ro.disconnect();
      },
    };
  }

  window.ProjectCarousel3D = { create };
})();
