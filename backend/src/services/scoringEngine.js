const overlap = (left = [], right = []) =>
  left.filter((value) => right.map(String).includes(String(value))).length;
const capped = (value, cap) => Math.min(value, cap);

/** Metragem "típica" do arquiteto: média das áreas dos projetos que ele
 * cadastrou no portfólio (cada item leva sua própria areaM2 — ver User.js).
 * Sem projeto com área informada, não dá pra comparar (retorna null em vez
 * de penalizar por falta de dado). */
function typicalAreaM2(architect) {
  const areas = (architect.architectProfile?.portfolio || [])
    .map((p) => p.areaM2)
    .filter((v) => typeof v === "number" && v > 0);
  if (!areas.length) return null;
  return areas.reduce((sum, v) => sum + v, 0) / areas.length;
}

/** Pontuação por proximidade de metragem — substitui orçamento como o
 * critério de tamanho de obra (pedido explícito da cliente do TCC: perguntar
 * "quantos m²" em vez de "quanto você quer gastar"). Quanto mais perto da
 * metragem que o arquiteto costuma atender, mais pontos; sem dado de um dos
 * lados, não pontua nem penaliza. */
function scoreArea(clientAreaM2, architect) {
  const typical = typicalAreaM2(architect);
  if (!clientAreaM2 || !typical) return 0;
  const diff = Math.abs(clientAreaM2 - typical) / typical;
  if (diff <= 0.2) return 15;
  if (diff <= 0.5) return 10;
  if (diff <= 1) return 5;
  return 0;
}

export function scoreArchitect(client, architect) {
  const c = client.clientProfile || {},
    a = architect.architectProfile || {};
  const styles = capped(overlap(c.preferredStyles, a.styles) * 10, 30);
  const materials = capped(
    overlap(c.preferredMaterials, a.favoriteMaterials) * 5,
    15,
  );
  const location = a.workingAreas?.some((area) =>
    [client.city, client.state]
      .filter(Boolean)
      .some((place) => area.toLowerCase().includes(place.toLowerCase())),
  )
    ? 20
    : 0;
  const property = a.specialties?.some(
    (s) =>
      c.propertyType && s.toLowerCase().includes(c.propertyType.toLowerCase()),
  )
    ? 15
    : 0;
  const availability =
    a.availability === "available" ? 10 : a.availability === "limited" ? 5 : 0;
  const experience = capped(a.yearsExperience || 0, 10);
  const area = scoreArea(c.areaM2, architect);
  const score =
    styles + materials + location + property + availability + experience + area;
  const reasons = [
    styles && "estilo arquitetônico compatível",
    materials && "preferências de materiais em comum",
    location && "atendimento na sua região",
    property && "especialidade relevante para o projeto",
    area && "já atendeu projetos de metragem parecida",
    experience && `${a.yearsExperience} anos de experiência`,
  ].filter(Boolean);
  const breakdown = [
    { label: "Estilo", value: styles, max: 30 },
    { label: "Materiais", value: materials, max: 15 },
    { label: "Localização", value: location, max: 20 },
    { label: "Especialidade", value: property, max: 15 },
    { label: "Metragem", value: area, max: 15 },
    { label: "Disponibilidade", value: availability, max: 10 },
    { label: "Experiência", value: experience, max: 10 },
  ];
  return { score, reasons, breakdown };
}

export function rankArchitects(client, architects) {
  return architects
    .map((architect) => ({ architect, ...scoreArchitect(client, architect) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

/** true se as faixas se sobrepõem, ou se falta informação de um dos lados
 * (nesse caso não penaliza — só classifica "fora do orçamento" quando dá
 * pra provar que as faixas realmente não se cruzam). */
function budgetsOverlap(clientBudget, architectPriceRange) {
  const cMin = clientBudget?.min, cMax = clientBudget?.max;
  const aMin = architectPriceRange?.min, aMax = architectPriceRange?.max;
  if (cMin == null && cMax == null) return true;
  if (aMin == null && aMax == null) return true;
  const lo1 = cMin ?? -Infinity, hi1 = cMax ?? Infinity;
  const lo2 = aMin ?? -Infinity, hi2 = aMax ?? Infinity;
  return lo2 <= hi1 && hi2 >= lo1;
}

/**
 * Em vez de só descartar quem não é "o melhor match", separa por que motivo
 * cada arquiteto compatível não entrou no grupo principal — indisponível,
 * fora da região ou fora do orçamento — pra mostrar isso pro cliente em vez
 * de simplesmente escondê-lo. Quem não tem nenhuma afinidade real de
 * estilo/material/especialidade fica em `uncategorized`, pro chamador decidir
 * se entra no bônus de "bem avaliado mesmo fora do estilo".
 */
export function categorizeMatches(client, architects) {
  const clientBudget = client.clientProfile?.budget;

  const evaluated = architects.map((architect) => {
    const { score, reasons, breakdown } = scoreArchitect(client, architect);
    const a = architect.architectProfile || {};
    const locationValue = breakdown.find((b) => b.label === "Localização")?.value || 0;
    const availabilityValue = breakdown.find((b) => b.label === "Disponibilidade")?.value || 0;
    const coreScore = score - locationValue - availabilityValue;
    const sameCity = !!(
      client.city &&
      architect.city &&
      client.city.trim().toLowerCase() === architect.city.trim().toLowerCase()
    );
    return {
      architect,
      score,
      reasons,
      breakdown,
      coreScore,
      sameCity,
      available: a.availability !== "unavailable",
      inRegion: locationValue > 0,
      inBudget: budgetsOverlap(clientBudget, a.priceRange),
    };
  });

  const main = [], unavailable = [], outOfRegion = [], outOfBudget = [], uncategorized = [];
  for (const e of evaluated) {
    if (e.coreScore <= 0) { uncategorized.push(e); continue; }
    if (!e.available) unavailable.push(e);
    else if (!e.inRegion) outOfRegion.push(e);
    else if (!e.inBudget) outOfBudget.push(e);
    else main.push(e);
  }

  const byBestScore = (a, b) => b.score - a.score;
  const byCoreScore = (a, b) => b.coreScore - a.coreScore;
  return {
    main: main.sort(byBestScore).slice(0, 4),
    unavailable: unavailable.sort(byCoreScore).slice(0, 3),
    outOfRegion: outOfRegion.sort(byCoreScore).slice(0, 3),
    outOfBudget: outOfBudget.sort(byCoreScore).slice(0, 3),
    uncategorized,
  };
}
