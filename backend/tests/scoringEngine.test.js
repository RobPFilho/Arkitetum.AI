import test from "node:test";
import assert from "node:assert/strict";
import { scoreArchitect } from "../src/services/scoringEngine.js";
import { deletePortfolio } from "../src/controllers/dashboardController.js";
import User from "../src/models/User.js";

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
