import mongoose from "mongoose";

/**
 * Comissão simulada (sem gateway de pagamento, mesma fidelidade do resto do
 * projeto) criada quando os dois lados confirmam que um projeto fechou pela
 * plataforma (ver validationController.confirmValidation). `project` é
 * best-effort — vem do histórico de match mais recente entre o par, quando
 * existe; nunca bloqueia a criação da comissão se não for encontrado.
 */
const commissionSchema = new mongoose.Schema(
  {
    architect: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    validation: { type: mongoose.Schema.Types.ObjectId, ref: "Validation", required: true, unique: true },
    rate: { type: Number, default: 0.08 },
    estimatedValue: Number,
    amount: Number,
  },
  { timestamps: true },
);

export default mongoose.model("Commission", commissionSchema);
