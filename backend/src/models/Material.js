import mongoose from "mongoose";
export default mongoose.model(
  "Material",
  new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true },
      category: String,
      description: String,
      imageUrl: String,
      photographerName: String,
      photographerUrl: String,
      // Loja parceira que vende este material — opcional. Quando presente, a
      // sugestão de combinação de materiais mostra "disponível na loja X"
      // (ver MatchExtras.generateMaterialCombos em extras.js). Comissão
      // simulada, sem integração de checkout real com o parceiro.
      storeName: String,
      storeUrl: String,
    },
    { timestamps: true },
  ),
);
