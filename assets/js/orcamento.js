/**
 * Estimador de orçamento — calculadora 100% client-side, sem dependência do
 * back-end. Os valores de R$/m² são faixas aproximadas ilustrativas (não uma
 * fonte de dados de mercado em tempo real), por isso o resultado sempre
 * aparece como faixa + aviso, nunca como um número único e definitivo.
 */
document.addEventListener('DOMContentLoaded', () => {
  const REGION_BASE = { capital: 2200, media: 1700, pequena: 1300 };
  const REGION_LABEL = { capital: 'Capital / região metropolitana', media: 'Cidade média', pequena: 'Interior / cidade pequena' };
  const TYPE_MULT = { unifamiliar: 1.1, apartamento: 0.9, reforma: 0.85, interiores: 0.6, comercial: 1.0, paisagismo: 0.5 };
  const TYPE_LABEL = { unifamiliar: 'Residencial unifamiliar', apartamento: 'Apartamento (reforma)', reforma: 'Reforma geral', interiores: 'Interiores / marcenaria', comercial: 'Comercial', paisagismo: 'Paisagismo' };
  const FINISH_MULT = { economico: 0.75, medio: 1.0, alto: 1.6 };
  const FINISH_LABEL = { economico: 'Econômico', medio: 'Médio', alto: 'Alto padrão' };
  const STYLE_MULT = {
    'Moderno': 1.0, 'Contemporâneo': 1.05, 'Minimalista': 0.95, 'Industrial': 1.05,
    'Clássico': 1.15, 'Rústico': 1.0, 'Escandinavo': 1.0, 'Biofílico': 1.1,
    'Brutalista': 1.1, 'Alto padrão': 1.3,
  };

  const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  document.getElementById('budgetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const area = Number(document.getElementById('bArea').value);
    if (!area || area <= 0) return;
    const tipo = document.getElementById('bTipo').value;
    const regiao = document.getElementById('bRegiao').value;
    const acabamento = document.getElementById('bAcabamento').value;
    const estilo = document.getElementById('bEstilo').value;

    const perM2 = REGION_BASE[regiao] * TYPE_MULT[tipo] * FINISH_MULT[acabamento] * (STYLE_MULT[estilo] || 1);
    const low = perM2 * area * 0.85;
    const high = perM2 * area * 1.15;

    const result = document.getElementById('budgetResult');
    document.getElementById('budgetRangeValue').textContent = `${money(low)} – ${money(high)}`;
    document.getElementById('budgetPerM2').textContent = `≈ ${money(perM2)} por m² · ${area} m²`;
    document.getElementById('budgetBreakdown').innerHTML = `
      <div class="dash-meta-row"><span>Tipo de projeto</span><span>${TYPE_LABEL[tipo]}</span></div>
      <div class="dash-meta-row"><span>Região</span><span>${REGION_LABEL[regiao]}</span></div>
      <div class="dash-meta-row"><span>Padrão de acabamento</span><span>${FINISH_LABEL[acabamento]}</span></div>
      <div class="dash-meta-row"><span>Estilo</span><span>${estilo}</span></div>
    `;
    result.style.display = 'block';
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });
});
