import test from "node:test";
import assert from "node:assert/strict";
import { scoreArchitect, rankArchitects } from "../src/services/scoringEngine.js";
import { deletePortfolio } from "../src/controllers/dashboardController.js";
import User from "../src/models/User.js";

function makeClient(overrides = {}) {
  return {
    city: "São Paulo",
    state: "SP",
    clientProfile: { preferredStyles: [], preferredMaterials: [], propertyType: undefined, ...overrides },
  };
}

function makeArchitect(overrides = {}) {
  return {
    architectProfile: {
      styles: [], favoriteMaterials: [], workingAreas: [], specialties: [],
      availability: "available", yearsExperience: 0, ...overrides,
    },
  };
}

test("scores matching architecture traits without exceeding 100", () => {
  const result = scoreArchitect(
    {
      city: "São Paulo",
      clientProfile: {
        preferredStyles: ["Modern"],
        preferredMaterials: ["wood"],
        propertyType: "residential",
      },
    },
    {
      architectProfile: {
        styles: ["Modern"],
        favoriteMaterials: ["wood"],
        workingAreas: ["São Paulo"],
        specialties: ["Residential"],
        availability: "available",
        yearsExperience: 12,
      },
    },
  );
  assert.equal(result.score, 70);
});

test("no overlap at all scores 0 with no reasons", () => {
  const client = makeClient();
  const architect = makeArchitect({ availability: "unavailable" });
  const { score, reasons } = scoreArchitect(client, architect);
  assert.equal(score, 0);
  assert.deepEqual(reasons, []);
});

test("style overlap adds 10 points per shared style", () => {
  const client = makeClient({ preferredStyles: ["Moderno", "Minimalista"] });
  const architect = makeArchitect({ styles: ["Moderno"], availability: "unavailable" });
  const { score, reasons } = scoreArchitect(client, architect);
  assert.equal(score, 10);
  assert.ok(reasons.includes("estilo arquitetônico compatível"));
});

test("style score is capped at 30 even with many overlaps", () => {
  const styles = ["Moderno", "Minimalista", "Industrial", "Clássico"];
  const client = makeClient({ preferredStyles: styles });
  const architect = makeArchitect({ styles, availability: "unavailable" });
  assert.equal(scoreArchitect(client, architect).score, 30);
});

test("material overlap adds 5 points per shared material, capped at 15", () => {
  const materials = ["Concreto aparente", "Madeira", "Vidro", "Aço"];
  const client = makeClient({ preferredMaterials: materials });
  const architect = makeArchitect({ favoriteMaterials: materials, availability: "unavailable" });
  assert.equal(scoreArchitect(client, architect).score, 15);
});

test("location match is case-insensitive and adds a flat 20 points", () => {
  const client = makeClient();
  const architect = makeArchitect({ workingAreas: ["SÃO PAULO", "Grande SP"], availability: "unavailable" });
  const { score, reasons } = scoreArchitect(client, architect);
  assert.equal(score, 20);
  assert.ok(reasons.includes("atendimento na sua região"));
});

test("property type match against specialties adds 15 points", () => {
  const client = makeClient({ propertyType: "Apartamento" });
  const architect = makeArchitect({ specialties: ["Apartamento", "Interiores"], availability: "unavailable" });
  const { score, reasons } = scoreArchitect(client, architect);
  assert.equal(score, 15);
  assert.ok(reasons.includes("especialidade relevante para o projeto"));
});

test("availability scores 10 for available, 5 for limited, 0 for unavailable", () => {
  const client = makeClient();
  assert.equal(scoreArchitect(client, makeArchitect({ availability: "available" })).score, 10);
  assert.equal(scoreArchitect(client, makeArchitect({ availability: "limited" })).score, 5);
  assert.equal(scoreArchitect(client, makeArchitect({ availability: "unavailable" })).score, 0);
});

test("area proximity scores 15 within 20% of the architect's typical project size", () => {
  const client = makeClient({ areaM2: 100 });
  const architect = makeArchitect({
    availability: "unavailable",
    portfolio: [{ title: "A", areaM2: 90 }, { title: "B", areaM2: 110 }],
  });
  const { score, reasons } = scoreArchitect(client, architect);
  assert.equal(score, 15);
  assert.ok(reasons.includes("já atendeu projetos de metragem parecida"));
});

test("area proximity degrades with distance and scores 0 far beyond the typical size", () => {
  const architect = makeArchitect({ availability: "unavailable", portfolio: [{ title: "A", areaM2: 100 }] });
  assert.equal(scoreArchitect(makeClient({ areaM2: 115 }), architect).score, 15);
  assert.equal(scoreArchitect(makeClient({ areaM2: 140 }), architect).score, 10);
  assert.equal(scoreArchitect(makeClient({ areaM2: 180 }), architect).score, 5);
  assert.equal(scoreArchitect(makeClient({ areaM2: 500 }), architect).score, 0);
});

test("area proximity scores 0 when either side has no area data", () => {
  const architect = makeArchitect({ availability: "unavailable" });
  assert.equal(scoreArchitect(makeClient({ areaM2: 100 }), architect).score, 0);
  const architectWithArea = makeArchitect({ availability: "unavailable", portfolio: [{ title: "A", areaM2: 100 }] });
  assert.equal(scoreArchitect(makeClient(), architectWithArea).score, 0);
});

test("experience contributes 1 point per year, capped at 10", () => {
  const client = makeClient();
  const architect = makeArchitect({ availability: "unavailable", yearsExperience: 25 });
  const { score, reasons } = scoreArchitect(client, architect);
  assert.equal(score, 10);
  assert.ok(reasons.includes("25 anos de experiência"));
});

test("rankArchitects filters out zero-score results, sorts descending, and caps at 4", () => {
  const client = makeClient({ preferredStyles: ["Moderno"] });
  const architects = [
    makeArchitect({ styles: ["Moderno"], yearsExperience: 1 }),
    makeArchitect({ availability: "unavailable" }),
    makeArchitect({ styles: ["Moderno"], yearsExperience: 20 }),
    makeArchitect({ styles: ["Moderno"], yearsExperience: 5 }),
    makeArchitect({ styles: ["Moderno"], yearsExperience: 3 }),
    makeArchitect({ styles: ["Moderno"], yearsExperience: 2 }),
  ];
  const ranked = rankArchitects(client, architects);
  assert.equal(ranked.length, 4);
  const scores = ranked.map((r) => r.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  assert.equal(scores[0], 30);
});

test("portfolio subdocuments retain a generated object id that deletePortfolio can target", () => {
  const user = new User({
    name: "Architect",
    email: "architect@example.com",
    phone: "123",
    passwordHash: "hash",
    role: "architect",
    architectProfile: {
      portfolio: [{ title: "First", projectUrl: "https://example.com" }],
    },
  });

  const project = user.architectProfile.portfolio[0];
  assert.ok(project._id);
  assert.equal(String(project._id).length >= 12, true);
});

test("deletePortfolio can remove a legacy project portfolio item that never gained a generated _id", async () => {
  const req = {
    params: { id: "Legacy House" },
    user: {
      role: "architect",
      architectProfile: {
        portfolio: [
          { title: "Legacy House", projectUrl: "https://example.com/legacy" },
          { title: "Second", projectUrl: "https://example.com/second" },
        ],
      },
      save: async function () { return this; },
    },
  };

  const res = {
    statusCode: 0,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  await deletePortfolio(req, res);

  assert.equal(req.user.architectProfile.portfolio.length, 1);
  assert.equal(req.user.architectProfile.portfolio[0].title, "Second");
  assert.equal(res.statusCode, 200);
});

test("deletePortfolio removes the selected project from an architect's portfolio", async () => {
  const req = {
    params: { id: "project-2" },
    user: {
      role: "architect",
      architectProfile: {
        portfolio: [
          { _id: "project-1", title: "First" },
          { _id: "project-2", title: "Second" },
        ],
      },
      save: async function () { return this; },
    },
  };

  const res = {
    statusCode: 0,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  await deletePortfolio(req, res);

  assert.equal(req.user.architectProfile.portfolio.length, 1);
  assert.equal(req.user.architectProfile.portfolio[0]._id, "project-1");
  assert.equal(res.statusCode, 200);
});
