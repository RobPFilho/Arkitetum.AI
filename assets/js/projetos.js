document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('apiBaseLabel').textContent = MatchAPI.base();
  const grid = document.getElementById('materialGrid');

  const FALLBACK = [
    ['Carvalho', 'Madeira'], ['Nogueira', 'Madeira'], ['Bambu', 'Madeira'],
    ['Concreto aparente', 'Concreto'], ['Granilite', 'Concreto'],
    ['Mármore Carrara', 'Pedra'], ['Granito', 'Pedra'], ['Travertino', 'Pedra'], ['Ardósia', 'Pedra'], ['Calcário', 'Pedra'], ['Quartzo', 'Pedra'],
    ['Tijolo aparente', 'Alvenaria'], ['Vidro', 'Vidro'], ['Aço', 'Metal'], ['Alumínio', 'Metal'],
    ['Revestimento cerâmico', 'Cerâmica'], ['Porcelanato', 'Cerâmica'], ['Cortiça', 'Natural'],
  ].map(([name, category]) => ({ name, category, imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80' }));

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

  try {
    const materials = await MatchAPI.materials();
    render(materials.length ? materials : FALLBACK);
  } catch (err) {
    document.getElementById('apiBanner').classList.add('show');
    render(FALLBACK);
  }
});
