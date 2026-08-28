import dotenv from "dotenv";
dotenv.config({ path: "KEYS.env" });
import { connectDatabase } from "../config/database.js";
import Material from "../models/Material.js";
import mongoose from "mongoose";
const materials = [
  ["Oak", "Carvalho", "Madeira"],
  ["Walnut", "Nogueira", "Madeira"],
  ["Bamboo", "Bambu", "Madeira"],
  ["Exposed Concrete", "Concreto aparente", "Concreto"],
  ["Terrazzo", "Granilite", "Concreto"],
  ["Carrara Marble", "Mármore Carrara", "Pedra"],
  ["Granite", "Granito", "Pedra"],
  ["Travertine", "Travertino", "Pedra"],
  ["Slate", "Ardósia", "Pedra"],
  ["Red Brick", "Tijolo aparente", "Alvenaria"],
  ["Glass", "Vidro", "Vidro"],
  ["Steel", "Aço", "Metal"],
  ["Aluminum", "Alumínio", "Metal"],
  ["Ceramic Tile", "Revestimento cerâmico", "Cerâmica"],
  ["Porcelain Tile", "Porcelanato", "Cerâmica"],
  ["Cork", "Cortiça", "Natural"],
  ["Limestone", "Calcário", "Pedra"],
  ["Quartz", "Quartzo", "Pedra"],
];
await connectDatabase();
await Material.bulkWrite(
  materials.map(([oldName, name, category]) => ({
    updateOne: {
      filter: { $or: [{ name: oldName }, { name }] },
      update: {
        $set: {
          name,
          category,
          description: `Material arquitetônico: ${name}`,
          imageUrl:
            "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=600&q=80",
        },
      },
      upsert: true,
    },
  })),
);
console.log(`${materials.length} materiais criados ou atualizados`);
await mongoose.disconnect();
