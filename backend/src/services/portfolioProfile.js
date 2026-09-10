/**
 * O perfil agregado do arquiteto (architectProfile.styles/favoriteMaterials)
 * deixou de ser algo que a pessoa escolhe uma vez no cadastro — agora é
 * sempre a união do que está tageado em cada peça de portfólio. Chamar isso
 * depois de qualquer alteração no portfólio mantém os dois sempre em sincronia.
 */
export function recomputeProfileFromPortfolio(user) {
  const items = user.architectProfile?.portfolio || [];
  user.architectProfile.styles = [...new Set(items.flatMap((item) => item.styles || []))];
  user.architectProfile.favoriteMaterials = [...new Set(items.flatMap((item) => item.materials || []))];
}
