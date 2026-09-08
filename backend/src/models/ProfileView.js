import mongoose from "mongoose";

// Só a contagem/data importa pras métricas do arquiteto — sem guardar quem
// visitou (evita rastrear comportamento de navegação de clientes à toa).
export default mongoose.model(
  "ProfileView",
  new mongoose.Schema(
    {
      architect: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    },
    { timestamps: true },
  ),
);
