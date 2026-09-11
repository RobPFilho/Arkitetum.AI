import mongoose from "mongoose";

/**
 * Produto cadastrado pela própria loja parceira (nunca por scraping do site
 * dela) — é isso que a IA casa contra o estilo/materiais de um projeto em
 * storeMatchService.suggestProductsForProject.
 */
const storeProductSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    photo: String,
    category: String,
    styles: [String],
    price: Number,
    purchaseUrl: String,
  },
  { timestamps: true },
);

export default mongoose.model("StoreProduct", storeProductSchema);
