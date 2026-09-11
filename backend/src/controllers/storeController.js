import StoreProduct from "../models/StoreProduct.js";
import StoreReferral from "../models/StoreReferral.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import { notify } from "../services/notificationService.js";

export async function listMyProducts(req, res) {
  const products = await StoreProduct.find({ store: req.user.id }).sort("-createdAt");
  res.json(products);
}

export async function createProduct(req, res) {
  if (!req.body.name?.trim()) return res.status(400).json({ error: "Nome do produto é obrigatório." });
  const product = await StoreProduct.create({
    store: req.user.id,
    name: req.body.name.trim(),
    photo: req.body.photo,
    category: req.body.category,
    styles: Array.isArray(req.body.styles) ? req.body.styles : [],
    price: req.body.price ? Number(req.body.price) : undefined,
    purchaseUrl: req.body.purchaseUrl,
  });
  res.status(201).json(product);
}

export async function updateProduct(req, res) {
  const product = await StoreProduct.findOne({ _id: req.params.id, store: req.user.id });
  if (!product) return res.status(404).json({ error: "Produto não encontrado." });
  const allowed = ["name", "photo", "category", "purchaseUrl"];
  for (const key of allowed) if (req.body[key] !== undefined) product[key] = req.body[key];
  if (req.body.styles !== undefined) product.styles = Array.isArray(req.body.styles) ? req.body.styles : [];
  if (req.body.price !== undefined) product.price = req.body.price ? Number(req.body.price) : undefined;
  await product.save();
  res.json(product);
}

export async function deleteProduct(req, res) {
  const product = await StoreProduct.findOneAndDelete({ _id: req.params.id, store: req.user.id });
  if (!product) return res.status(404).json({ error: "Produto não encontrado." });
  res.json({ ok: true });
}

export async function getStoreProfile(req, res) {
  const store = await User.findOne({ _id: req.params.id, role: "store" });
  if (!store) return res.status(404).json({ error: "Loja não encontrada." });
  res.json({ id: store.id, name: store.name, profile: store.storeProfile });
}

/**
 * Confirmação explícita do cliente ("Simular compra") a partir da sugestão
 * de produto dentro do projeto -- nunca criada por rastreamento passivo.
 */
export async function createReferral(req, res) {
  const { productId, projectId } = req.body || {};
  const product = await StoreProduct.findById(productId);
  if (!product) return res.status(404).json({ error: "Produto não encontrado." });

  if (projectId) {
    const project = await Project.findOne({ _id: projectId, client: req.user.id });
    if (!project) return res.status(404).json({ error: "Projeto não encontrado." });
  }

  const commissionRate = 0.1;
  const simulatedAmount = Math.round((product.price || 0) * commissionRate);
  const referral = await StoreReferral.create({
    store: product.store,
    product: product.id,
    client: req.user.id,
    project: projectId || undefined,
    commissionRate,
    simulatedAmount,
  });

  notify(product.store, "store", `${req.user.name} simulou a compra de "${product.name}" indicado pela plataforma`, "dashboard.html");
  res.status(201).json({ id: referral.id, purchaseUrl: product.purchaseUrl, simulatedAmount });
}

export async function listMyReferrals(req, res) {
  const referrals = await StoreReferral.find({ store: req.user.id })
    .populate("client", "name")
    .populate("product", "name")
    .sort("-createdAt");
  res.json({
    total: referrals.reduce((sum, r) => sum + (r.simulatedAmount || 0), 0),
    count: referrals.length,
    referrals: referrals.map((r) => ({
      id: r.id,
      clientName: r.client?.name,
      productName: r.product?.name,
      simulatedAmount: r.simulatedAmount,
      createdAt: r.createdAt,
    })),
  });
}
