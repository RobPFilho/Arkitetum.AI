import User from "../models/User.js";
import { buildSearchQuery, searchReferenceImage } from "../services/imageSearchService.js";

export async function listArchitects(req, res) {
  const query = { role: "architect" };
  if (req.query.style) query["architectProfile.styles"] = req.query.style;
  if (req.query.city) query.city = { $regex: req.query.city, $options: "i" };
  if (req.query.minExperience)
    query["architectProfile.yearsExperience"] = { $gte: Number(req.query.minExperience) };

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 9));
  const minRating = req.query.minRating ? Number(req.query.minRating) : null;

  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "architect",
        as: "reviews",
      },
    },
    {
      $addFields: {
        avgRating: { $cond: [{ $gt: [{ $size: "$reviews" }, 0] }, { $round: [{ $avg: "$reviews.rating" }, 1] }, 0] },
        reviewCount: { $size: "$reviews" },
      },
    },
  ];
  if (minRating) pipeline.push({ $match: { avgRating: { $gte: minRating } } });
  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        totalCount: [{ $count: "count" }],
      },
    },
  );

  const [result] = await User.aggregate(pipeline);
  const architects = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  res.json({
    architects: architects.map((architect) => ({
      id: architect._id,
      name: architect.name,
      city: architect.city,
      state: architect.state,
      profile: architect.architectProfile,
      avgRating: architect.avgRating,
      reviewCount: architect.reviewCount,
    })),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  });
}

/**
 * Referência visual do arquiteto, calculada uma vez a partir do estilo/materiais
 * dele e guardada em `architectProfile.referenceImage` — evita bater no Unsplash
 * de novo toda vez que alguém vê o perfil ou o resultado de um match (limite
 * gratuito da API é 50 buscas/hora, compartilhado entre todo mundo no site).
 */
export async function getArchitectReferenceImage(req, res) {
  const architect = await User.findOne({ _id: req.params.id, role: "architect" });
  if (!architect) return res.status(404).json({ error: "Arquiteto não encontrado" });

  if (architect.architectProfile.referenceImage?.imageUrl) {
    return res.json(architect.architectProfile.referenceImage);
  }

  const { styles = [], favoriteMaterials = [] } = architect.architectProfile;
  if (!styles.length && !favoriteMaterials.length) {
    return res.status(404).json({ error: "Este arquiteto ainda não tem estilo/materiais suficientes para gerar uma referência." });
  }

  const query = await buildSearchQuery(styles, favoriteMaterials, []);
  const photo = await searchReferenceImage(query);
  if (!photo) return res.status(404).json({ error: "Não encontramos uma referência visual agora." });

  architect.architectProfile.referenceImage = {
    imageUrl: photo.imageUrl,
    description: photo.description,
    photographerName: photo.photographerName,
    photographerUrl: photo.photographerUrl,
  };
  await architect.save();
  res.json(architect.architectProfile.referenceImage);
}

export async function getArchitectProfile(req, res) {
  const architect = await User.findOne({
    _id: req.params.id,
    role: "architect",
  }).populate("architectProfile.favoriteMaterials");
  if (!architect)
    return res.status(404).json({ error: "Arquiteto não encontrado" });
  res.json({
    id: architect.id,
    name: architect.name,
    email: architect.email,
    phone: architect.phone,
    city: architect.city,
    state: architect.state,
    profile: architect.architectProfile,
  });
}
