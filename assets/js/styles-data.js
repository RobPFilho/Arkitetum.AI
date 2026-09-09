/**
 * Lista canônica dos 10 estilos + uma foto real e uma descrição de uma frase
 * pra cada um (assets/data/style-images.json, gerado por
 * backend/src/seeds/styleImages.js via Unsplash). Centraliza o que antes
 * era um array repetido em destaques.js/dashboard.js/cadastro.js, e resolve
 * o feedback de que quem não é arquiteto não sabe o que "minimalista" ou
 * "biofílico" significam de fato — cada estilo agora mostra do que se trata.
 */
const StyleData = (() => {
  const NAMES = ['Moderno', 'Contemporâneo', 'Minimalista', 'Industrial', 'Clássico', 'Rústico', 'Escandinavo', 'Biofílico', 'Brutalista', 'Alto padrão'];
  let cache = null;
  let loading = null;

  function load() {
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = fetch('assets/data/style-images.json')
      .then(res => res.json())
      .then(data => { cache = data; return data; })
      .catch(() => ({}));
    return loading;
  }

  return { names: () => NAMES, load };
})();
