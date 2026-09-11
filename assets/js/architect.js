document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('apiBaseLabel').textContent = MatchAPI.base();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.getElementById('noId').style.display = 'block'; return; }

  try {
    const arch = await MatchAPI.architect(id);
    const p = arch.profile || {};

    // Conta uma visualização pras métricas do arquiteto — no máximo uma vez
    // por sessão do navegador, e nunca quando o próprio arquiteto abre o
    // perfil dele (senão ele inflava a própria métrica só de conferir o perfil).
    const viewerIsSelf = MatchAPI.currentUser()?.id === id;
    const viewedKey = `matchia_viewed_${id}`;
    if (!viewerIsSelf && !sessionStorage.getItem(viewedKey)) {
      MatchAPI.recordProfileView(id).catch(() => {});
      sessionStorage.setItem(viewedKey, '1');
    }
    document.getElementById('profileState').style.display = 'block';
    document.getElementById('avatar').textContent = arch.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('archName').textContent = arch.name;
    document.getElementById('archLocation').textContent = [arch.city, arch.state].filter(Boolean).join(' · ') || 'Localização não informada';
    document.getElementById('archAvailability').textContent = { available: 'Disponível', limited: 'Disponibilidade limitada', unavailable: 'Indisponível' }[p.availability] || '—';
    document.getElementById('archEmail').textContent = arch.email || '—';
    document.getElementById('archPhone').textContent = arch.phone || '—';
    document.getElementById('archYears').textContent = p.yearsExperience ? `${p.yearsExperience} anos` : '—';
    document.getElementById('archWebsite').innerHTML = p.website ? `<a href="${p.website}" target="_blank" rel="noopener" style="color:var(--terracotta);">${p.website}</a>` : '—';
    document.getElementById('archInstagram').textContent = p.instagram || '—';
    document.getElementById('archBio').textContent = p.bio || 'Este arquiteto ainda não adicionou uma bio.';

    const cauStatus = p.cauVerification?.status;
    document.getElementById('archVerifiedBadge').innerHTML = cauStatus === 'verified'
      ? '<span class="status-pill badge-validated">✓ Verificado</span>' : '';

    const tagRow = (elId, items) => {
      document.getElementById(elId).innerHTML = items && items.length
        ? items.map(i => `<span class="tag">${typeof i === 'string' ? i : i.name}</span>`).join('')
        : '<span style="font-size:0.85rem; color:var(--ink-faint);">Nenhum registrado</span>';
    };
    tagRow('archStyles', p.styles);
    tagRow('archSpecialties', p.specialties);
    tagRow('archMaterials', p.favoriteMaterials);

    const styleProfile = MatchExtras.getStyleProfile(id);
    if (styleProfile.palette.length || styleProfile.keywords.length) {
      document.getElementById('stylePaletteCard').style.display = 'block';
      document.getElementById('archPalette').innerHTML = styleProfile.palette.map(hex => `<span class="dot" style="background:${hex}"></span>`).join('');
      document.getElementById('archKeywords').innerHTML = styleProfile.keywords.map(k => `<span class="tag">${k}</span>`).join('') || '<span style="font-size:0.82rem; color:var(--ink-faint);">Nenhuma cadastrada</span>';
    }

    MatchAPI.architectReferenceImage(id).then(photo => {
      document.getElementById('archReferenceImageCard').style.display = 'block';
      document.getElementById('archReferenceImageContent').innerHTML = `
        <img src="${photo.imageUrl}" alt="${photo.description}" style="width:100%; border-radius:12px; display:block;">
        <p style="font-size:0.76rem; color:var(--ink-faint); margin-top:8px;">Foto: <a href="${photo.photographerUrl}" target="_blank" rel="noopener" style="color:inherit;">${photo.photographerName}</a> via <a href="https://unsplash.com/?utm_source=matchia&utm_medium=referral" target="_blank" rel="noopener" style="color:inherit;">Unsplash</a></p>`;
    }).catch(() => { /* sem estilo/materiais suficientes, ou API fora do ar — card fica oculto */ });

    const combos = MatchExtras.generateMaterialCombos(p.favoriteMaterials);
    document.getElementById('archCombos').innerHTML = combos.length
      ? `<div class="constraint-note">Só usa materiais que ${arch.name} cadastrou como favoritos — nada inexequível.</div>` +
        combos.map(c => `<div class="combo-card"><div class="combo-name">${c.name}</div></div>`).join('')
      : '<p style="font-size:0.86rem; color:var(--ink-faint);">Cadastre ao menos 2 materiais favoritos para gerar sugestões.</p>';

    const portfolio = p.portfolio || [];
    document.getElementById('archPortfolio').innerHTML = portfolio.length
      ? `<div class="material-grid">${portfolio.map(proj => `
          <div class="material-card spotlight">
            <div class="thumb">${proj.imageUrl ? `<img src="${proj.imageUrl}" alt="${proj.title}">` : ''}</div>
            <div class="info">
              <span class="cat">${proj.status === 'ongoing' ? 'Em andamento' : 'Concluído'}</span>
              <h4>${proj.title}</h4>
              ${proj.projectUrl ? `<a href="${proj.projectUrl}" target="_blank" rel="noopener" style="font-size:0.78rem; color:var(--terracotta); font-weight:600;">Ver projeto →</a>` : ''}
            </div>
          </div>`).join('')}</div>`
      : '<p style="font-size:0.86rem; color:var(--ink-faint);">Nenhum projeto no portfólio ainda.</p>';

    MatchAPI.publishedCaseStudies(id).then(cases => {
      if (!cases.length) return;
      const card = document.getElementById('archCaseStudiesCard');
      card.style.display = 'block';
      document.getElementById('archCaseStudiesContent').innerHTML = cases.map(c => `
        <div class="case-study-card">
          ${c.images?.length ? `<div class="case-study-images">${c.images.map(url => `<img src="${url}" alt="${c.title}">`).join('')}</div>` : ''}
          <h4>${c.title}</h4>
          ${c.description ? `<p>${c.description}</p>` : ''}
          ${c.testimonial ? `<blockquote>"${c.testimonial}"<cite>— ${c.clientName || 'Cliente'}</cite></blockquote>` : ''}
        </div>`).join('');
    }).catch(() => {});

    // Avaliações (reais, vêm do back-end)
    try {
      const { reviews, average, count } = await MatchAPI.reviews(id);
      document.getElementById('archReviews').innerHTML = count
        ? `<div class="review-summary">
             <span class="review-avg">${average}</span>
             <div><span class="star-display">${'★'.repeat(Math.round(average))}${'☆'.repeat(5 - Math.round(average))}</span><div style="font-size:0.8rem; color:var(--ink-faint);">${count} avaliaç${count > 1 ? 'ões' : 'ão'}</div></div>
           </div>
           ${reviews.map(r => `
             <div class="review-item">
               <div class="review-head">
                 <span class="review-name">${r.client?.name || 'Cliente'}</span>
                 <span class="star-display">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
               </div>
               ${r.comment ? `<p>${r.comment}</p>` : ''}
             </div>`).join('')}`
        : '<p style="font-size:0.86rem; color:var(--ink-faint);">Este arquiteto ainda não recebeu avaliações.</p>';
    } catch {
      document.getElementById('archReviews').innerHTML = '<p style="font-size:0.86rem; color:var(--ink-faint);">Não foi possível carregar as avaliações.</p>';
    }

    // Enviar mensagem (só clientes logados)
    const me = MatchAPI.currentUser();
    if (me && me.role === 'client' && MatchAPI.token()) {
      MatchAPI.getValidation(id).then(v => {
        if (v.clientConfirmed && v.architectConfirmed) {
          document.getElementById('archValidatedBadge').innerHTML = '<span class="status-pill badge-validated">✓ Resumo validado com você</span>';
        }
      }).catch(() => {});
      document.getElementById('messageForm').style.display = 'block';
      document.getElementById('sendMessageBtn').addEventListener('click', async () => {
        const text = document.getElementById('messageText').value.trim();
        if (!text) return;
        const btn = document.getElementById('sendMessageBtn');
        btn.disabled = true;
        try {
          await MatchAPI.sendMessage(id, text);
          document.getElementById('messageText').value = '';
          document.getElementById('messageSentNote').style.display = 'block';
        } catch (err) {
          alert(err.message || 'Não foi possível enviar a mensagem.');
        } finally {
          btn.disabled = false;
        }
      });
    } else if (!me) {
      document.getElementById('messageLoggedOut').style.display = 'block';
    } else {
      document.getElementById('messageCard').style.display = 'none';
    }
  } catch (err) {
    if (err.offline) document.getElementById('apiBanner').classList.add('show');
    document.getElementById('noId').style.display = 'block';
    document.getElementById('noId').innerHTML = `<h2>Não foi possível carregar este perfil</h2><p>${err.message || ''}</p><a href="index.html" class="btn btn-secondary">Voltar ao início</a>`;
  }
});
