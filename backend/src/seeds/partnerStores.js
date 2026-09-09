import dotenv from "dotenv";
dotenv.config({ path: "KEYS.env" });
import { connectDatabase } from "../config/database.js";
import Material from "../models/Material.js";
import mongoose from "mongoose";

/**
 * Parcerias de loja de demonstração — segunda linha de monetização sugerida
 * na mentoria final (Teresa/Adriano): quando a IA sugere uma combinação de
 * materiais, mostra também onde comprar, e a plataforma simula uma comissão
 * sobre a venda indicada. São lojas fictícias pro protótipo — não há
 * integração de checkout real com nenhuma delas.
 */
const STORES = [
  ["Carvalho", "Madeira & Cia", "https://exemplo-madeiraecia.com.br"],
  ["Nogueira", "Madeira & Cia", "https://exemplo-madeiraecia.com.br"],
  ["Bambu", "Madeira & Cia", "https://exemplo-madeiraecia.com.br"],
  ["Concreto aparente", "Casa Obra Direta", "https://exemplo-obradireta.com.br"],
  ["Tijolo aparente", "Casa Obra Direta", "https://exemplo-obradireta.com.br"],
  ["Mármore Carrara", "Pedras Nobres", "https://exemplo-pedrasnobres.com.br"],
  ["Granito", "Pedras Nobres", "https://exemplo-pedrasnobres.com.br"],
  ["Travertino", "Pedras Nobres", "https://exemplo-pedrasnobres.com.br"],
  ["Porcelanato", "Revesti Show", "https://exemplo-revestishow.com.br"],
  ["Revestimento cerâmico", "Revesti Show", "https://exemplo-revestishow.com.br"],
];

await connectDatabase();

let updated = 0;
for (const [name, storeName, storeUrl] of STORES) {
  const res = await Material.updateOne({ name }, { $set: { storeName, storeUrl } });
  if (res.matchedCount) updated++;
}

console.log(`${updated} de ${STORES.length} materiais vinculados a uma loja parceira de demonstração.`);
await mongoose.disconnect();
