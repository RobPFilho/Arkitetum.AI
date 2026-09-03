const $ = (selector) => document.querySelector(selector);
const token = () => localStorage.getItem("arkitetum_token");
const notice = (message) => {
  const el = $("#notice");
  if (el) el.textContent = message;
};

function initialsFromName(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AR";
}

function pastelColorFromName(name = "") {
  const palette = [
    "#f8d5d5",
    "#d8f1d7",
    "#d9eaf8",
    "#fceccf",
    "#e9dffd",
    "#fbdcef",
    "#cdf4ea",
    "#fde6be",
  ];
  const hash = Array.from(name || "user")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function renderProfileIcon(user = null) {
  const link = $("#profile-icon-link");
  const badge = $("#profile-icon-avatar");
  if (!link || !badge) return;

  const name = user?.name || "Arkitetum User";
  const initials = initialsFromName(name);
  const fill = pastelColorFromName(name);

  badge.textContent = initials;
  badge.style.backgroundColor = fill;
  badge.style.color = "#304326";
  badge.style.borderColor = fill;
}

async function loadProfileIconFromToken() {
  if (!token()) return;

  try {
    const user = await api("/dashboard/me");
    renderProfileIcon(user);
  } catch {
    renderProfileIcon({ name: "Arkitetum User" });
  }
}

function syncRegisterPreview(role = "client") {
  const previewStyle = $("#preview-style");
  const previewBudget = $("#preview-budget");
  const previewProject = $("#preview-project");
  const project = $("[name='projectGoals']")?.value?.trim() || "-";
  const budgetMin = $("[name='budgetMin']")?.value?.trim();
  const budgetMax = $("[name='budgetMax']")?.value?.trim();

  if (previewStyle)
    previewStyle.textContent = role === "architect" ? "Arquiteto" : "Cliente";

  if (previewBudget)
    previewBudget.textContent = budgetMin || budgetMax
      ? `${budgetMin || "0"} — ${budgetMax || "0"}`
      : "Não definido";

  if (previewProject)
    previewProject.textContent = project.length > 38
      ? `${project.slice(0, 38)}...`
      : project;
}
async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
}
function requireLogin() {
  if (!token()) location.href = "login.html";
}
function logout() {
  localStorage.removeItem("arkitetum_token");
  location.href = "/";
}
function projectCards(projects = []) {
  return projects.length
    ? projects
      .map((project) => {
        const safeUrl = project.projectUrl || "";
        const hasPreview = Boolean(safeUrl);
        const projectId = project._id || project.id || project.title;
        return `<article class="card project project-card" data-project-url="${safeUrl}" tabindex="0">
          <button class="delete-project" data-project-id="${projectId}" title="Delete project" aria-label="Delete project">
            <span aria-hidden="true">×</span>
          </button>
          <div class="project-card-media">
            ${project.imageUrl ? `<img class="project-card-image" src="${project.imageUrl}" alt="${project.title}">` : ""}
            ${hasPreview ? `<iframe class="project-card-preview-frame" src="${safeUrl}" title="Pré-visualização de ${project.title}" loading="lazy" referrerpolicy="no-referrer"></iframe>` : ""}
          </div>
          <p class="eyebrow">${project.status === "ongoing" ? "EM ANDAMENTO" : "CONCLUÍDO"}</p>
          <h3>${project.title}</h3>
          <p>${project.description || ""}</p>
          ${hasPreview ? `<span class="project-card-link-label">Abrir projeto</span>` : ""}
        </article>`;
      })
      .join("")
    : "<p>Nenhum projeto publicado ainda.</p>";
}

function materialSelector(name, materials, selected, label, limit) {
  const selectedIds = selected.map((item) => String(item?._id || item));
  return `<label class="material-label">${label}${limit ? ` (máximo de ${limit})` : ""}<select name="${name}" multiple size="7">${materials.map((material) => `<option value="${material._id}" ${selectedIds.includes(String(material._id)) ? "selected" : ""}>${material.name} — ${material.category}</option>`).join("")}</select><small>Use Ctrl (Windows) ou Cmd (Mac) para selecionar mais de um material.</small></label>`;
}

function positionProjectPreviews() {
  document.querySelectorAll("article.project-card[data-project-url]").forEach((card) => {
    const preview = card.querySelector(".project-card-preview");
    if (!preview) return;

    const cardRect = card.getBoundingClientRect();
    const previewWidth = Math.min(320, Math.max(260, window.innerWidth * 0.3));
    const hasRoomOnRight = cardRect.right + previewWidth + 16 < window.innerWidth;

    preview.classList.toggle("project-card-preview-left", !hasRoomOnRight);
    preview.classList.toggle("project-card-preview-right", hasRoomOnRight);
  });
}

window.addEventListener("resize", positionProjectPreviews);

async function loadDashboard() {
  requireLogin();
  const user = await api("/dashboard/me");
  $("#welcome").textContent = `Olá, ${user.name}`;
  if (user.role === "client") {
    $("#client-dashboard").hidden = false;
    $("#match").onclick = async () => {
      try {
        const { results } = await api("/matches/run", { method: "POST" });
        $("#results").innerHTML = results.length
          ? results
            .map(
              (result) =>
                `<article class="card"><p class="eyebrow">${result.score}% DE COMPATIBILIDADE</p><h2>${result.architect.name}</h2><p>${result.explanation}</p><a class="button small" href="arquiteto.html?id=${result.architect.id}">Ver perfil e portfólio</a></article>`,
            )
            .join("")
          : "<p>Ainda não há arquitetos compatíveis disponíveis.</p>";
      } catch (error) {
        notice(error.message);
      }
    };
  } else {
    $("#architect-dashboard").hidden = false;
    $("#portfolio-list").innerHTML = projectCards(
      user.architectProfile.portfolio,
    );
    positionProjectPreviews();
    $("#portfolio").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await api("/dashboard/portfolio", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(new FormData(event.target))),
        });
        location.reload();
      } catch (error) {
        notice(error.message);
      }
    });
  }
}
async function loadProfile() {
  requireLogin();
  const [user, materials] = await Promise.all([
    api("/dashboard/me"),
    api("/materials"),
  ]);
  for (const field of ["name", "phone", "city", "state"])
    $(`[name="${field}"]`).value = user[field] || "";
  const profile =
    user.role === "client" ? user.clientProfile : user.architectProfile;
  $("#profile-fields").innerHTML =
    user.role === "client"
      ? `<input name="preferredStyles" value="${(profile.preferredStyles || []).join(", ")}" placeholder="Estilos preferidos"><input name="propertyType" value="${profile.propertyType || ""}" placeholder="Tipo de imóvel"><textarea name="projectGoals" placeholder="Objetivos do projeto">${profile.projectGoals || ""}</textarea><textarea name="preferences" placeholder="Preferências adicionais">${profile.preferences || ""}</textarea>${materialSelector("preferredMaterials", materials, profile.preferredMaterials || [], "Materiais que você gostaria de ter em casa")}`
      : `<input name="styles" value="${(profile.styles || []).join(", ")}" placeholder="Estilos arquitetônicos"><input name="specialties" value="${(profile.specialties || []).join(", ")}" placeholder="Especialidades"><input name="workingAreas" value="${(profile.workingAreas || []).join(", ")}" placeholder="Regiões em que atende"><input name="yearsExperience" type="number" value="${profile.yearsExperience || ""}" placeholder="Anos de experiência"><input name="website" value="${profile.website || ""}" placeholder="Site"><input name="instagram" value="${profile.instagram || ""}" placeholder="Instagram"><textarea name="bio" placeholder="Apresentação profissional">${profile.bio || ""}</textarea>${materialSelector("favoriteMaterials", materials, profile.favoriteMaterials || [], "Materiais que você gosta de utilizar nos projetos", 5)}`;
  $("#profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target),
      data = Object.fromEntries(form);
    for (const key of [
      "preferredStyles",
      "styles",
      "specialties",
      "workingAreas",
    ])
      if (data[key] !== undefined)
        data[key] = data[key]
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    if (user.role === "client")
      data.preferredMaterials = form.getAll("preferredMaterials");
    else {
      data.favoriteMaterials = form.getAll("favoriteMaterials");
      if (data.favoriteMaterials.length > 5)
        return notice("Selecione no máximo cinco materiais.");
    }
    try {
      await api("/dashboard/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          city: data.city,
          state: data.state,
          [user.role + "Profile"]: Object.fromEntries(
            Object.entries(data).filter(
              ([key]) => !["name", "phone", "city", "state"].includes(key),
            ),
          ),
        }),
      });
      notice("Perfil atualizado com sucesso.");
    } catch (error) {
      notice(error.message);
    }
  });
}
async function loadArchitect() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) return (location.href = "/");
  try {
    const architect = await api("/architects/" + id);
    const p = architect.profile;
    $("#architect-profile").innerHTML =
      `<p class="eyebrow">PERFIL DE ARQUITETO</p><h1>${architect.name}</h1><p>${architect.city || ""}${architect.state ? `, ${architect.state}` : ""}</p><p>${p.bio || "Sem apresentação cadastrada."}</p><div class="tag-list">${(p.styles || []).map((style) => `<span>${style}</span>`).join("")}</div><h2>Contato</h2><p><a href="mailto:${architect.email}">${architect.email}</a> · ${architect.phone}</p><h2>Portfólio</h2><div class="result-grid">${projectCards(p.portfolio)}</div>`;
    positionProjectPreviews();
  } catch (error) {
    $("#architect-profile").innerHTML =
      `<h1>Perfil indisponível</h1><p>${error.message}</p>`;
  }
}
document.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("button.delete-project");
  if (deleteButton) {
    event.stopPropagation();
    event.preventDefault();
    const card = deleteButton.closest("article.project-card");
    const id = deleteButton.dataset.projectId;
    if (!id) return;
    fetch(`/api/dashboard/portfolio/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } })
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível remover o projeto.");
        location.reload();
      })
      .catch((error) => notice(error.message));
    return;
  }

  const card = event.target.closest("article.project-card[data-project-url]");
  if (!card || !card.dataset.projectUrl) return;
  window.open(card.dataset.projectUrl, "_blank", "noopener,noreferrer");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const deleteButton = event.target.closest("button.delete-project");
  if (deleteButton) {
    event.preventDefault();
    event.stopPropagation();
    const card = deleteButton.closest("article.project-card");
    const id = deleteButton.dataset.projectId;
    if (!id) return;
    fetch(`/api/dashboard/portfolio/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } })
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível remover o projeto.");
        location.reload();
      })
      .catch((error) => notice(error.message));
    return;
  }

  const card = event.target.closest("article.project-card[data-project-url]");
  if (!card || !card.dataset.projectUrl) return;
  event.preventDefault();
  window.open(card.dataset.projectUrl, "_blank", "noopener,noreferrer");
});

$("#logout")?.addEventListener("click", logout);
if ($("#role")) {
  $("#role").addEventListener("change", (e) => {
    const role = e.target.value;
    $("#client-fields").hidden = role !== "client";
    $("#architect-fields").hidden = role !== "architect";

    syncRegisterPreview(role);
  });

  $("[name='budgetMin']")?.addEventListener("input", () => syncRegisterPreview($("#role").value));
  $("[name='budgetMax']")?.addEventListener("input", () => syncRegisterPreview($("#role").value));
  $("[name='projectGoals']")?.addEventListener("input", () => syncRegisterPreview($("#role").value));

  $("#register").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    for (const key of [
      "preferredStyles",
      "styles",
      "specialties",
      "workingAreas",
    ])
      data[key] = data[key]
        ? data[key]
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
        : [];

    if (data.role === "client") {
      data.preferredMaterials = formData.getAll("preferredMaterials");
      data.budget = {
        min: data.budgetMin ? Number(data.budgetMin) : undefined,
        max: data.budgetMax ? Number(data.budgetMax) : undefined,
      };
    } else {
      data.favoriteMaterials = formData.getAll("favoriteMaterials") || [];
      data.availability = "available";
    }

    data.city = data.city?.trim();
    data.state = data.state?.trim();

    if (data.password !== data.confirmPassword) {
      notice("As senhas precisam ser iguais.");
      return;
    }

    try {
      const result = await api("/auth/register/" + data.role, {
        method: "POST",
        body: JSON.stringify(data),
      });
      localStorage.setItem("arkitetum_token", result.token);
      location.href = "dashboard.html";
    } catch (error) {
      notice(error.message);
    }
  });
}
if ($("#login"))
  $("#login").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.target))),
      });
      localStorage.setItem("arkitetum_token", result.token);
      location.href = "dashboard.html";
    } catch (error) {
      notice(error.message);
    }
  });
if (token()) loadProfileIconFromToken().catch(() => { });
if ($("#client-dashboard"))
  loadDashboard().catch((error) => notice(error.message));
if ($("#profile-form")) loadProfile().catch((error) => notice(error.message));
if ($("#architect-profile")) loadArchitect();
