/**
 * Vitrine "Arquitetos em destaque" no topo de destaques.html — crossfade de
 * foto + seletor de avatares trocando nome/cargo/bio, no mesmo espírito de
 * uma vitrine de estúdio criativo. Dados (nome, cidade, bio, nota, id pro
 * link de perfil) são reais, vindos do mesmo ranking por mérito de sempre
 * (MatchAPI.architects); só as fotos são ilustrativas por enquanto — os
 * arquitetos de demonstração não têm foto própria cadastrada ainda.
 */
document.addEventListener('DOMContentLoaded', async () => {
  const section = document.getElementById('featuredHero');
  if (!section) return;

  const PLACEHOLDER_PHOTOS = [
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_225202_f9e684f3-dc19-469a-8142-eb391bfc601b.png&w=1280&q=85',
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_225149_7937e8ea-3b0a-46ab-919f-775627695a23.png&w=1280&q=85',
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_225153_f2b1fc04-776a-4f2e-879b-b764ea762e77.png&w=1280&q=85',
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_225847_f456fd9c-8938-4103-836d-51b0e88a9510.png&w=1280&q=85',
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_225854_3958a522-6203-4f84-a7fa-3b3f1dcd7256.png&w=1280&q=85',
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_231111_fcefaa07-6851-4fdc-ac7b-98754ac9d5c4.png&w=1280&q=85',
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_231124_9a1505aa-8c44-4046-aff8-1aa0bc7b3ef3.png&w=1280&q=85',
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_230413_62e8b331-89be-4d35-84fe-330ba9b1b64f.png&w=1280&q=85',
  ];
  const ROLE_FALLBACKS = [
    'Arquitetura residencial', 'Interiores', 'Arquitetura de conceito', 'Estilo e materiais',
    'Paisagismo e circulação', 'Uso do espaço', 'Detalhamento técnico', 'Direção de estúdio',
  ];

  let architects = [];
  try {
    const result = await MatchAPI.architects({ pageSize: 8 });
    architects = result.architects || [];
  } catch { /* offline: seção some, o resto da página segue normal */ }

  if (!architects.length) return;
  section.style.display = 'flex';

  const slides = architects.map((a, i) => {
    const location = [a.city, a.state].filter(Boolean).join('/');
    const role = [a.profile?.styles?.[0], location].filter(Boolean).join(' · ') || ROLE_FALLBACKS[i % ROLE_FALLBACKS.length];
    const bio = a.profile?.bio
      || `${a.name} atua${a.city ? ` em ${a.city}` : ''}${a.profile?.yearsExperience ? `, ${a.profile.yearsExperience} anos de experiência` : ''}${a.avgRating ? `, nota ${a.avgRating}` : ''}.`;
    return { id: a.id, name: a.name, role, bio, photo: PLACEHOLDER_PHOTOS[i % PLACEHOLDER_PHOTOS.length] };
  });

  const bgWrap = document.getElementById('fhBgs');
  bgWrap.innerHTML = slides.map((s, i) =>
    `<div class="fh-bg${i === 0 ? ' active' : ''}" style="background-image:url('${s.photo}')"></div>`).join('');

  const avatarsWrap = document.getElementById('fhAvatars');
  avatarsWrap.innerHTML = slides.map((s, i) => `
    <button type="button" class="fh-avatar-btn${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Ver ${s.name}">
      <span class="fh-avatar-dot"></span>
      <span class="fh-avatar-thumb"><img src="${s.photo}" alt="${s.name}" loading="lazy"></span>
    </button>`).join('');

  const descEl = document.getElementById('fhDesc');
  const nameEl = document.getElementById('fhName');
  const roleEl = document.getElementById('fhRole');
  const linkEl = document.getElementById('fhLink');

  function restartFade(el) {
    el.classList.remove('fh-fade');
    void el.offsetWidth;
    el.classList.add('fh-fade');
  }

  function setActive(index) {
    avatarsWrap.querySelectorAll('.fh-avatar-btn').forEach((btn, i) => btn.classList.toggle('active', i === index));
    bgWrap.querySelectorAll('.fh-bg').forEach((bg, i) => bg.classList.toggle('active', i === index));
    const s = slides[index];
    descEl.textContent = s.bio;
    nameEl.textContent = s.name;
    roleEl.textContent = s.role;
    linkEl.href = `arquiteto.html?id=${s.id}`;
    restartFade(descEl);
    restartFade(nameEl);
  }

  avatarsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-index]');
    if (btn) setActive(Number(btn.dataset.index));
  });

  setActive(0);
});
