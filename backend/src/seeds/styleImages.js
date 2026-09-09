import dotenv from "dotenv";
dotenv.config({ path: "KEYS.env" });
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchReferenceImage } from "../services/imageSearchService.js";

// Uma foto real por estilo — usada nos chips de estilo (cadastro/painel/portfólio)
// e na seção "Conheça os estilos" de projetos.html, pra quem não sabe o que
// "minimalista" ou "biofílico" significam de fato ver do que se trata.
const STYLES = [
  ["Moderno", "modern architecture house clean lines", "Linhas retas, grandes vãos de vidro e ausência de ornamentos."],
  ["Contemporâneo", "contemporary house interior design", "Mistura tendências atuais com conforto e materiais naturais."],
  ["Minimalista", "minimalist interior white space", "O essencial só — poucos móveis, poucas cores, muito espaço vazio."],
  ["Industrial", "industrial loft exposed brick pipes", "Tijolo aparente, metal e concreto à mostra, estética de galpão."],
  ["Clássico", "classic architecture columns ornate", "Simetria, molduras e detalhes ornamentados de inspiração tradicional."],
  ["Rústico", "rustic wood cabin interior", "Madeira bruta, pedra natural e um ar de casa de campo."],
  ["Escandinavo", "scandinavian interior design light wood", "Tons claros, madeira clara e funcionalidade sem excesso."],
  ["Biofílico", "biophilic design plants interior", "Plantas e luz natural integradas à arquitetura do espaço."],
  ["Brutalista", "brutalist concrete architecture", "Concreto aparente em formas monumentais e geométricas."],
  ["Alto padrão", "luxury modern mansion interior", "Acabamentos nobres, metragem generosa e detalhes sob medida."],
];

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "assets", "data", "style-images.json");

const result = {};
let updated = 0, skipped = 0;
for (const [style, searchTerm, description] of STYLES) {
  const photo = await searchReferenceImage(searchTerm).catch(() => null);
  if (photo) {
    result[style] = {
      description,
      imageUrl: photo.thumbUrl,
      photographerName: photo.photographerName,
      photographerUrl: photo.photographerUrl,
    };
    updated++;
  } else {
    result[style] = { description, imageUrl: null, photographerName: null, photographerUrl: null };
    skipped++;
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
console.log(`${STYLES.length} estilos processados — ${updated} com foto real do Unsplash, ${skipped} sem (chave ausente ou busca sem resultado). Gravado em ${outPath}`);
