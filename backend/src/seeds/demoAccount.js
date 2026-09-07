/**
 * Cria (ou reseta) uma conta de cliente e um conjunto de dados prontos para
 * a apresentação da pré-banca: perfil completo, um projeto extra, um match
 * já rodado de verdade (via scoringEngine real), uma conversa com mensagens,
 * uma avaliação e o resumo do projeto já validado pelos dois lados.
 *
 * Uso: npm run seed:demo (dentro de backend/)
 * Login de demonstração: demo@matchia.com / MatchIA@Demo2026
 */
import dotenv from "dotenv";
dotenv.config({ path: "KEYS.env" });
import { connectDatabase } from "../config/database.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Message from "../models/Message.js";
import Review from "../models/Review.js";
import Validation from "../models/Validation.js";
import MatchHistory from "../models/MatchHistory.js";
import Favorite from "../models/Favorite.js";
import { rankArchitects } from "../services/scoringEngine.js";
import mongoose from "mongoose";

const DEMO_EMAIL = "demo@matchia.com";
const ARCHITECT_EMAIL = "fernanda.albuquerque@match.arquitetos.demo";

await connectDatabase();

// Recomeça do zero para a demo ficar sempre no mesmo estado, previsível.
const existing = await User.findOne({ email: DEMO_EMAIL });
if (existing) {
  await Promise.all([
    Project.deleteMany({ client: existing._id }),
    Message.deleteMany({ $or: [{ from: existing._id }, { to: existing._id }] }),
    Review.deleteMany({ client: existing._id }),
    Validation.deleteMany({ client: existing._id }),
    MatchHistory.deleteMany({ client: existing._id }),
    Favorite.deleteMany({ client: existing._id }),
  ]);
  await existing.deleteOne();
}

const architect = await User.findOne({ email: ARCHITECT_EMAIL, role: "architect" });
if (!architect) {
  console.error(`Arquiteto ${ARCHITECT_EMAIL} não encontrado — rode "npm run seed:architects" primeiro.`);
  process.exit(1);
}

const client = new User({
  name: "Cliente Demo",
  email: DEMO_EMAIL,
  phone: "11991234567",
  city: "São Paulo",
  state: "SP",
  role: "client",
  passwordHash: "MatchIA@Demo2026",
  clientProfile: {
    preferredStyles: ["Moderno", "Minimalista"],
    preferredMaterials: ["Concreto aparente", "Madeira de demolição", "Vidro"],
    budget: { min: 300000, max: 450000 },
    propertyType: "Residencial unifamiliar",
    familySize: 3,
    projectGoals: "Reforma completa da casa, com integração entre sala, cozinha e jardim.",
    preferences: "Ambientes com muita luz natural e poucos elementos decorativos.",
  },
});
await client.save();

const project = await Project.create({
  client: client._id,
  name: "Casa de campo da família",
  preferredStyles: ["Rústico", "Biofílico"],
  preferredMaterials: ["Madeira de demolição", "Tijolo aparente"],
  budget: { min: 180000, max: 260000 },
  propertyType: "Residencial unifamiliar",
  familySize: 3,
  projectGoals: "Casa de fim de semana, simples e integrada à natureza.",
});

const architects = await User.find({
  role: "architect",
  "architectProfile.availability": { $ne: "unavailable" },
}).populate("architectProfile.favoriteMaterials");
const ranked = rankArchitects(client, architects);
const results = ranked.map(({ architect: a, score, breakdown }) => ({
  architect: a._id,
  score,
  explanation: `${a.name} é uma ótima opção por ${score >= 60 ? "alta compatibilidade de estilo, materiais e experiência" : "compatibilidade parcial com seu perfil"}.`,
}));
await MatchHistory.create({ client: client._id, results });

await Message.create([
  { from: client._id, to: architect._id, text: "Olá! Vi seu perfil no match.IA e adorei o seu portfólio. Podemos conversar sobre a reforma da minha casa?" },
  { from: architect._id, to: client._id, text: "Olá! Que bom que gostou. Vi seu resumo de projeto e faz muito sentido com o meu jeito de trabalhar. Vamos marcar uma conversa?", read: true },
  { from: client._id, to: architect._id, text: "Perfeito, pode ser sim! Vou validar o resumo do projeto por aqui antes.", read: true },
]);

await Review.create({
  client: client._id,
  architect: architect._id,
  rating: 5,
  comment: "Processo super transparente, a IA explicou direitinho por que o match fazia sentido.",
});

await Validation.create({
  client: client._id,
  architect: architect._id,
  clientConfirmed: true,
  architectConfirmed: true,
});

await Favorite.create({ client: client._id, architect: architect._id });

console.log("Conta de demonstração pronta:");
console.log(`  Login: ${DEMO_EMAIL} / MatchIA@Demo2026`);
console.log(`  Projeto extra: "${project.name}"`);
console.log(`  Match rodado com ${results.length} resultado(s), melhor pontuação: ${results[0]?.score ?? "—"}`);
console.log(`  Conversa e avaliação com ${architect.name}, resumo já validado dos dois lados.`);
await mongoose.disconnect();
