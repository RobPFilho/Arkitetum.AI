const overlap = (left = [], right = []) =>
  left.filter((value) => right.map(String).includes(String(value))).length;
const capped = (value, cap) => Math.min(value, cap);

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
  const score =
    styles + materials + location + property + availability + experience;
  const reasons = [
    styles && "estilo arquitetônico compatível",
    materials && "preferências de materiais em comum",
    location && "atendimento na sua região",
    property && "especialidade relevante para o projeto",
    experience && `${a.yearsExperience} anos de experiência`,
  ].filter(Boolean);
  return { score, reasons };
}

export function rankArchitects(client, architects) {
  return architects
    .map((architect) => ({ architect, ...scoreArchitect(client, architect) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}
