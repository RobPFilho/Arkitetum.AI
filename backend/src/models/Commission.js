import mongoose from "mongoose";

/**
 * Registro real de comissão de sucesso — criado automaticamente quando
 * cliente e arquiteto confirmam, os dois lados, que o projeto do match
 * aconteceu de verdade (ver validationController.confirmValidation). É o
 * "sistema comissionado" em si: sem isso, a comissão era só uma notificação
 * avulsa, sem histórico nem soma nenhuma em lugar nenhum.
 */
const commissionSchema = new mongoose.Schema(
  {
    architect: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rate: { type: Number, required: true },
    estimatedProjectValue: Number,
    amount: Number,
    // Sem orçamento informado pelo cliente não dá pra estimar valor —
    // ainda assim o fechamento conta pro histórico e pro cálculo de
    // prioridade por mérito (ver architectController.listArchitects).
    estimated: { type: Boolean, default: true },
  },
  { timestamps: true },
);
commissionSchema.index({ architect: 1, client: 1 }, { unique: true });

export default mongoose.model("Commission", commissionSchema);
