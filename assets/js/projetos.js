document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('apiBaseLabel').textContent = MatchAPI.base();
  const grid = document.getElementById('materialGrid');

  // Fotos reais do Unsplash por material (mesmas do banco — capturadas na última
  // vez que "npm run seed:materials" rodou), pra funcionar até offline.
  const FALLBACK = [
    ['Carvalho', 'Madeira', 'https://images.unsplash.com/photo-1611072337226-1140ab367200?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Nogueira', 'Madeira', 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Bambu', 'Madeira', 'https://images.unsplash.com/photo-1577199019410-0d4567e04117?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Concreto aparente', 'Concreto', 'https://images.unsplash.com/photo-1617713965103-9fda56c89fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Granilite', 'Concreto', 'https://images.unsplash.com/photo-1634131330605-e6dfd1a314c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Mármore Carrara', 'Pedra', 'https://images.unsplash.com/photo-1523251836828-b75d28b89804?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Granito', 'Pedra', 'https://images.unsplash.com/photo-1652305461546-bf0a76934433?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Travertino', 'Pedra', 'https://images.unsplash.com/photo-1724219548981-1c2a333144db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Ardósia', 'Pedra', 'https://images.unsplash.com/photo-1542732056-648731297c97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Calcário', 'Pedra', 'https://images.unsplash.com/photo-1581710515207-e12b6e176779?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Quartzo', 'Pedra', 'https://images.unsplash.com/photo-1623197532650-bacb8a68914e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Tijolo aparente', 'Alvenaria', 'https://images.unsplash.com/photo-1520758594221-872948699332?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Vidro', 'Vidro', 'https://images.unsplash.com/photo-1523477593243-78bbf626fd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Aço', 'Metal', 'https://images.unsplash.com/photo-1579223442946-c1c147e96598?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Alumínio', 'Metal', 'https://images.unsplash.com/photo-1666555038185-8323c553de64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Revestimento cerâmico', 'Cerâmica', 'https://images.unsplash.com/photo-1678742755904-6c3fc8ba6602?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Porcelanato', 'Cerâmica', 'https://images.unsplash.com/photo-1714334200104-004e5d66708a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
    ['Cortiça', 'Natural', 'https://images.unsplash.com/photo-1558051815-0f18e64e6280?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400'],
  ].map(([name, category, imageUrl]) => ({ name, category, imageUrl }));

  function render(materials) {
    grid.innerHTML = materials.map(m => `
      <div class="material-card">
        <div class="thumb"><img src="${m.imageUrl}" alt="${m.name}" loading="lazy"></div>
        <div class="info">
          <span class="cat">${m.category || 'Material'}</span>
          <h4>${m.name}</h4>
        </div>
      </div>
    `).join('');
  }

  grid.innerHTML = `
    <div class="skeleton-card">
      <div class="skeleton-block thumb"></div>
      <div class="skeleton-lines">
        <div class="skeleton-block line" style="width:40%;"></div>
        <div class="skeleton-block line" style="width:70%;"></div>
      </div>
    </div>`.repeat(9);

  try {
    const materials = await MatchAPI.materials();
    render(materials.length ? materials : FALLBACK);
  } catch (err) {
    document.getElementById('apiBanner').classList.add('show');
    render(FALLBACK);
  }
});
