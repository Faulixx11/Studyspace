/* StudySpace Ernährung – Multi-Bereich-Grundgerüst
   Eigener Speicherbereich; Lern-Daten werden nicht verändert. */
(() => {
  "use strict";

  const STORAGE_KEY = "studyspaceNutritionDataV1";
  const PROFILE_DEFAULTS = {
    diet: "vegan",
    highProteinFocus: true,
    avoidNuts: true,
    allergies: "",
    dislikes: ""
  };

  const readStore = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        profile: { ...PROFILE_DEFAULTS, ...(value.profile || {}) },
        recipes: Array.isArray(value.recipes) ? value.recipes : [],
        mealPlans: Array.isArray(value.mealPlans) ? value.mealPlans : [],
        pantry: Array.isArray(value.pantry) ? value.pantry : [],
        shoppingLists: Array.isArray(value.shoppingLists) ? value.shoppingLists : [],
        mealPrepPlans: Array.isArray(value.mealPrepPlans) ? value.mealPrepPlans : [],
        knowledgeProgress: value.knowledgeProgress || {}
      };
    } catch (error) {
      console.error("Ernährungsdaten konnten nicht gelesen werden:", error);
      return { profile: { ...PROFILE_DEFAULTS }, recipes: [], mealPlans: [], pantry: [], shoppingLists: [], mealPrepPlans: [], knowledgeProgress: {} };
    }
  };

  let nutritionData = readStore();
  let currentPage = "nutrition-dashboard";
  let initialized = false;

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nutritionData));
      return true;
    } catch (error) {
      console.error("Ernährungsdaten konnten nicht gespeichert werden:", error);
      alert("Die Ernährungsdaten konnten nicht gespeichert werden. Bitte prüfe den verfügbaren Browserspeicher.");
      return false;
    }
  }

  function pageMarkup() {
    const main = document.querySelector(".main-content");
    if (!main || document.getElementById("nutrition-dashboard")) return;

    const pages = [
      ["nutrition-dashboard", "Übersicht"],
      ["nutrition-recipes", "Rezepte"],
      ["nutrition-planner", "Essensplan"],
      ["nutrition-shopping", "Einkauf & Vorrat"],
      ["nutrition-mealprep", "Meal Prep"],
      ["nutrition-knowledge", "Ernährungswissen"],
      ["nutrition-ai", "KI-Assistent"],
      ["nutrition-profile", "Ernährungsprofil"]
    ];

    const wrapper = document.createElement("div");
    wrapper.id = "nutritionPages";
    wrapper.innerHTML = `
      <section class="nutrition-page" id="nutrition-dashboard">
        <div class="nutrition-hero">
          <div class="eyebrow">DEIN ERNÄHRUNGSBEREICH</div>
          <h1>Gut essen. Gut versorgt sein.</h1>
          <p>Plane deine vegane Ernährung, entdecke proteinreiche pflanzliche Lebensmittel und organisiere Rezepte, Einkäufe und Meal Prep an einem Ort.</p>
          <span class="nutrition-tag">🌱 Vegan</span><span class="nutrition-tag">💪 Proteinbewusst</span><span class="nutrition-tag">🥜 Nussfrei eingestellt</span>
        </div>
        <div class="section-heading"><div><h2>Deine Bereiche</h2><p>Alles für deine vegane Ernährung.</p></div></div>
        <div class="nutrition-grid">
          <button class="nutrition-card" data-nutrition-page="nutrition-recipes"><span class="nutrition-icon">🍲</span><h3>Rezepte</h3><p>Speichere eigene Gerichte und finde proteinreiche vegane Ideen.</p></button>
          <button class="nutrition-card" data-nutrition-page="nutrition-planner"><span class="nutrition-icon">📅</span><h3>Essensplan</h3><p>Plane Frühstück, Mittagessen, Abendessen und Snacks.</p></button>
          <button class="nutrition-card" data-nutrition-page="nutrition-shopping"><span class="nutrition-icon">🛒</span><h3>Einkauf & Vorrat</h3><p>Erstelle Einkaufslisten und behalte deine Zutaten im Blick.</p></button>
          <button class="nutrition-card" data-nutrition-page="nutrition-mealprep"><span class="nutrition-icon">🥗</span><h3>Meal Prep</h3><p>Organisiere Vorbereitung und Mahlzeiten für mehrere Tage.</p></button>
          <button class="nutrition-card" data-nutrition-page="nutrition-knowledge"><span class="nutrition-icon">📚</span><h3>Ernährungswissen</h3><p>Verstehe pflanzliche Proteine, Vitamine und Mineralstoffe.</p></button>
          <button class="nutrition-card" data-nutrition-page="nutrition-ai"><span class="nutrition-icon">✨</span><h3>KI-Ernährungsassistent</h3><p>Entwickle Ideen passend zu deinen Zutaten und Vorlieben.</p></button>
        </div>
        <div class="section" style="margin-top:22px">
          <div class="nutrition-note"><strong>Dein Ernährungsprofil:</strong> vegan · proteinbewusst · ohne Nüsse voreingestellt. Du kannst deine Vorlieben jederzeit anpassen. Nährwertangaben werden später transparent aus den Zutaten berechnet und sind Schätzwerte.</div>
        </div>
      </section>
      <section class="nutrition-page" id="nutrition-recipes">
        <div class="page-intro"><h1>Rezepte</h1><p>Deine Sammlung für abwechslungsreiche, vegane und proteinbewusste Gerichte.</p></div>
        <div class="nutrition-recipe-toolbar">
          <input id="recipeSearch" type="search" placeholder="Rezepte oder Zutaten suchen …" aria-label="Rezepte suchen">
          <select id="recipeFilter" aria-label="Rezepte filtern"><option value="all">Alle Rezepte</option><option value="protein">Proteinreiche Rezepte</option></select>
          <button type="button" class="nutrition-primary-button" id="newRecipeButton">＋ Rezept erstellen</button>
        </div>
        <div id="recipeEditor" class="nutrition-editor" hidden></div>
        <div id="recipeList" class="nutrition-recipe-list"></div>
        <p class="nutrition-muted">Proteinwerte sind Näherungswerte auf Basis der hinterlegten Zutaten. Markenprodukte und Zubereitungsarten können abweichen.</p>
      </section>
      <section class="nutrition-page" id="nutrition-planner">
        <div class="page-intro"><h1>Essensplan</h1><p>Deine Mahlzeiten übersichtlich über die Woche planen.</p></div>
        <div class="nutrition-note">Als Nächstes kommen Wochenkalender, Mahlzeiten-Zuordnung und die direkte Übernahme von Rezepten.</div>
      </section>
      <section class="nutrition-page" id="nutrition-shopping">
        <div class="page-intro"><h1>Einkauf & Vorrat</h1><p>Behalte Lebensmittel und benötigte Zutaten im Blick.</p></div>
        <div class="nutrition-note">Die Einkaufsliste wird später automatisch aus deinem Essensplan erstellt und mit vorhandenen Vorräten abgeglichen.</div>
      </section>
      <section class="nutrition-page" id="nutrition-mealprep">
        <div class="page-intro"><h1>Meal Prep</h1><p>Plane die Vorbereitung deiner Mahlzeiten.</p></div>
        <div class="nutrition-note">Hier entstehen später Vorbereitungspläne, Portionierung, Aufgaben und Hinweise zur sicheren Lagerung.</div>
      </section>
      <section class="nutrition-page" id="nutrition-knowledge">
        <div class="page-intro"><h1>Ernährungswissen</h1><p>Verlässliche Grundlagen zu veganer Ernährung und Nährstoffen.</p></div>
        <div class="nutrition-grid">
          <article class="nutrition-card"><span class="nutrition-icon">🌱</span><h3>Pflanzliche Proteinquellen</h3><p>Soja, Tofu, Tempeh, Hülsenfrüchte, Seitan und Getreide kennenlernen.</p></article>
          <article class="nutrition-card"><span class="nutrition-icon">🧬</span><h3>Nährstoffe</h3><p>Wissen über unter anderem Vitamin B12, Eisen, Calcium, Jod und Omega-3.</p></article>
          <article class="nutrition-card"><span class="nutrition-icon">🥦</span><h3>Abwechslung</h3><p>Wie unterschiedliche Lebensmittel zu einer ausgewogenen Ernährung beitragen.</p></article>
        </div>
      </section>
      <section class="nutrition-page" id="nutrition-ai">
        <div class="page-intro"><h1>KI-Ernährungsassistent</h1><p>Ideen und Planung passend zu deiner veganen Ernährung.</p></div>
        <div class="nutrition-note">Die KI-Anbindung kommt in einer späteren Phase. Sie soll deine bestätigten Vorlieben, Rezepte und Vorräte berücksichtigen. Ein sicherer Server-Endpunkt ist dafür erforderlich; geheime API-Schlüssel werden nicht im Browser gespeichert.</div>
      </section>
      <section class="nutrition-page" id="nutrition-profile">
        <div class="page-intro"><h1>Ernährungsprofil</h1><p>Lege fest, welche Lebensmittel und Vorschläge zu dir passen.</p></div>
        <div class="panel">
          <h3>Deine Ernährungsweise</h3>
          <div class="nutrition-profile-grid">
            <label class="nutrition-setting"><input type="radio" name="nutritionDiet" value="vegan" checked><span><strong>Vegan</strong><br><small class="muted">Ohne tierische Lebensmittel</small></span></label>
            <label class="nutrition-setting"><input type="radio" name="nutritionDiet" value="vegetarian"><span><strong>Vegetarisch</strong><br><small class="muted">Ohne Fleisch und Fisch</small></span></label>
            <label class="nutrition-setting"><input type="radio" name="nutritionDiet" value="flexible"><span><strong>Flexibel</strong><br><small class="muted">Individuell anpassbar</small></span></label>
          </div>
        </div>
        <div class="panel">
          <h3>Deine Vorlieben</h3>
          <label class="nutrition-setting"><input id="nutritionHighProtein" type="checkbox"><span><strong>Proteinbewusste Vorschläge</strong><br><small class="muted">Bevorzuge Rezepte mit pflanzlichen Proteinquellen.</small></span></label>
          <label class="nutrition-setting" style="margin-top:10px"><input id="nutritionAvoidNuts" type="checkbox"><span><strong>Keine Nüsse vorschlagen</strong><br><small class="muted">Nüsse bei Rezeptideen und Einkaufsvorschlägen ausschließen.</small></span></label>
          <label class="form-stack" style="margin-top:16px">Weitere Lebensmittel, die du nicht magst oder meiden musst
            <textarea id="nutritionDislikes" rows="2" placeholder="Zum Beispiel bestimmte Zutaten"></textarea>
          </label>
          <label class="form-stack" style="margin-top:12px">Allergien oder Unverträglichkeiten (optional)
            <textarea id="nutritionAllergies" rows="2" placeholder="Nur eintragen, wenn relevant"></textarea>
          </label>
          <button class="primary-button" id="saveNutritionProfile" type="button">Profil speichern</button>
          <p class="muted" id="nutritionProfileStatus" aria-live="polite"></p>
        </div>
      </section>
    `;
    main.appendChild(wrapper);
    wrapper.querySelectorAll("[data-nutrition-page]").forEach(button => {
      button.addEventListener("click", () => showPage(button.dataset.nutritionPage));
    });
    bindRecipes();
    bindProfile();
    renderProfile();
  }

  function buildNavigation() {
    const sidebar = document.getElementById("sidebar");
    const existingNav = sidebar?.querySelector(".navigation");
    if (!sidebar || !existingNav || document.getElementById("nutritionNavigation")) return;

    const nav = document.createElement("nav");
    nav.id = "nutritionNavigation";
    nav.setAttribute("aria-label", "Ernährungsnavigation");
    nav.innerHTML = `
      <button class="nav-item active" data-nutrition-page="nutrition-dashboard"><span class="nav-icon">⌂</span><span class="nav-text">Übersicht</span></button>
      <button class="nav-item" data-nutrition-page="nutrition-recipes"><span class="nav-icon">🍲</span><span class="nav-text">Rezepte</span></button>
      <button class="nav-item" data-nutrition-page="nutrition-planner"><span class="nav-icon">▦</span><span class="nav-text">Essensplan</span></button>
      <button class="nav-item" data-nutrition-page="nutrition-shopping"><span class="nav-icon">🛒</span><span class="nav-text">Einkauf & Vorrat</span></button>
      <button class="nav-item" data-nutrition-page="nutrition-mealprep"><span class="nav-icon">◷</span><span class="nav-text">Meal Prep</span></button>
      <button class="nav-item" data-nutrition-page="nutrition-knowledge"><span class="nav-icon">▤</span><span class="nav-text">Ernährungswissen</span></button>
      <button class="nav-item" data-nutrition-page="nutrition-ai"><span class="nav-icon">✧</span><span class="nav-text">KI-Assistent</span></button>
      <button class="nav-item" data-nutrition-page="nutrition-profile"><span class="nav-icon">⚙</span><span class="nav-text">Ernährungsprofil</span></button>
    `;
    existingNav.insertAdjacentElement("afterend", nav);
    nav.querySelectorAll("[data-nutrition-page]").forEach(button => {
      button.addEventListener("click", () => showPage(button.dataset.nutritionPage));
    });
  }

  function buildModeSwitch() {
    const topbar = document.querySelector(".topbar");
    if (!topbar || document.getElementById("workspaceSwitch")) return;
    const profile = topbar.querySelector(".profile");
    const wrap = document.createElement("div");
    wrap.className = "nutrition-switch-wrap";
    wrap.id = "workspaceSwitch";
    wrap.innerHTML = `
      <button type="button" class="nutrition-switch active" data-mode="learning">🎓 Lernen</button>
      <button type="button" class="nutrition-switch" data-mode="nutrition">🌱 Ernährung</button>
    `;
    if (profile) topbar.insertBefore(wrap, profile);
    else topbar.appendChild(wrap);
    wrap.querySelectorAll("[data-mode]").forEach(button => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });
  }

  function setMode(mode) {
    const learning = mode !== "nutrition";
    document.body.classList.toggle("nutrition-mode", !learning);
    const learningNav = document.querySelector(".sidebar .navigation");
    const nutritionNav = document.getElementById("nutritionNavigation");
    const settings = document.querySelector(".sidebar-bottom");
    if (learningNav) learningNav.style.display = learning ? "flex" : "none";
    if (nutritionNav) nutritionNav.style.display = learning ? "none" : "flex";
    if (settings) settings.style.display = learning ? "block" : "none";

    document.querySelectorAll("#workspaceSwitch [data-mode]").forEach(button => {
      button.classList.toggle("active", button.dataset.mode === (learning ? "learning" : "nutrition"));
    });

    if (learning) {
      document.querySelectorAll(".nutrition-page").forEach(page => page.classList.remove("active"));
      localStorage.setItem("studyspaceWorkspaceMode", "learning");
      if (typeof window.openPage === "function") window.openPage("dashboard");
      else {
        document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
        document.getElementById("page-dashboard")?.classList.add("active");
      }
      const title = document.getElementById("pageTitle");
      if (title) title.textContent = "Dashboard";
      const label = document.querySelector(".topbar-label");
      if (label) label.textContent = "DEIN PERSÖNLICHER LERNBEREICH";
    } else {
      localStorage.setItem("studyspaceWorkspaceMode", "nutrition");
      showPage("nutrition-dashboard");
      const label = document.querySelector(".topbar-label");
      if (label) label.textContent = "DEIN PERSÖNLICHER ERNÄHRUNGSBEREICH";
    }
  }

  function showPage(id) {
    const page = document.getElementById(id);
    if (!page) return;
    document.querySelectorAll(".page, .nutrition-page").forEach(item => item.classList.remove("active"));
    page.classList.add("active");
    document.querySelectorAll("#nutritionNavigation [data-nutrition-page]").forEach(button => {
      button.classList.toggle("active", button.dataset.nutritionPage === id);
    });
    document.getElementById("pageTitle").textContent = page.querySelector("h1")?.textContent || "Ernährung";
    const label = document.querySelector(".topbar-label");
    if (label) label.textContent = "DEIN PERSÖNLICHER ERNÄHRUNGSBEREICH";
    currentPage = id;
    if (id === "nutrition-recipes") renderRecipes();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function bindProfile() {
    const button = document.getElementById("saveNutritionProfile");
    if (!button) return;
    button.addEventListener("click", () => {
      nutritionData.profile.diet = document.querySelector('input[name="nutritionDiet"]:checked')?.value || "vegan";
      nutritionData.profile.highProteinFocus = document.getElementById("nutritionHighProtein").checked;
      nutritionData.profile.avoidNuts = document.getElementById("nutritionAvoidNuts").checked;
      nutritionData.profile.dislikes = document.getElementById("nutritionDislikes").value.trim();
      nutritionData.profile.allergies = document.getElementById("nutritionAllergies").value.trim();
      if (saveStore()) document.getElementById("nutritionProfileStatus").textContent = "Dein Ernährungsprofil wurde auf diesem Gerät gespeichert.";
    });
  }

  function renderProfile() {
    const profile = nutritionData.profile;
    const diet = document.querySelector('input[name="nutritionDiet"][value="' + profile.diet + '"]');
    if (diet) diet.checked = true;
    const protein = document.getElementById("nutritionHighProtein");
    const nuts = document.getElementById("nutritionAvoidNuts");
    const dislikes = document.getElementById("nutritionDislikes");
    const allergies = document.getElementById("nutritionAllergies");
    if (protein) protein.checked = !!profile.highProteinFocus;
    if (nuts) nuts.checked = !!profile.avoidNuts;
    if (dislikes) dislikes.value = profile.dislikes || "";
    if (allergies) allergies.value = profile.allergies || "";
  }


  // Kleine, transparente Referenzliste: Proteinwerte je 100 g Lebensmittel.
  // Werte sind Näherungen; trockene und gegarte Produkte sind getrennt bezeichnet.
  const FOOD_LIBRARY = [
    {id:"tofu",name:"Tofu natur",protein:15},
    {id:"tempeh",name:"Tempeh",protein:19},
    {id:"seitan",name:"Seitan",protein:25},
    {id:"soy-mince-dry",name:"Sojagranulat (trocken)",protein:50},
    {id:"tvp-dry",name:"Sojaschnetzel (trocken)",protein:50},
    {id:"lentils-cooked",name:"Linsen (gekocht)",protein:9},
    {id:"chickpeas-cooked",name:"Kichererbsen (gekocht)",protein:8.9},
    {id:"kidney-cooked",name:"Kidneybohnen (gekocht)",protein:8.7},
    {id:"edamame",name:"Edamame",protein:12},
    {id:"soy-yogurt",name:"Sojajoghurt natur",protein:4},
    {id:"soy-milk",name:"Sojadrink ungesüßt",protein:3.3},
    {id:"oats",name:"Haferflocken",protein:13.5},
    {id:"lentil-pasta-dry",name:"Linsenpasta (trocken)",protein:26},
    {id:"wholegrain-pasta-dry",name:"Vollkornnudeln (trocken)",protein:13},
    {id:"quinoa-dry",name:"Quinoa (trocken)",protein:14},
    {id:"rice-dry",name:"Reis (trocken)",protein:7.5},
    {id:"peas",name:"Erbsen",protein:5.5},
    {id:"broccoli",name:"Brokkoli",protein:2.8},
    {id:"spinach",name:"Spinat",protein:2.9},
    {id:"mushrooms",name:"Champignons",protein:3.1},
    {id:"tomatoes",name:"Tomaten",protein:0.9},
    {id:"potatoes",name:"Kartoffeln",protein:2},
    {id:"wholegrain-bread",name:"Vollkornbrot",protein:9},
    {id:"pea-protein",name:"Erbsenproteinpulver",protein:80}
  ];

  const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));

  function recipeProtein(recipe) {
    const total = (recipe.ingredients || []).reduce((sum, ingredient) => {
      const protein = Number(ingredient.proteinPer100g) || 0;
      const grams = Number(ingredient.grams) || 0;
      return sum + protein * grams / 100;
    }, 0);
    return total / Math.max(1, Number(recipe.servings) || 1);
  }

  function recipeFormMarkup(recipe = null) {
    const editing = !!recipe;
    const ingredients = editing && recipe.ingredients?.length ? recipe.ingredients : [{foodId:"tofu",grams:150}];
    return `
      <form id="nutritionRecipeForm" class="nutrition-recipe-form">
        <input type="hidden" id="recipeEditId" value="${escapeText(recipe?.id || "")}">
        <div class="nutrition-form-grid">
          <label>Rezeptname<input id="recipeName" required maxlength="90" value="${escapeText(recipe?.name || "")}" placeholder="z. B. Tofu-Gemüse-Bowl"></label>
          <label>Portionen<input id="recipeServings" type="number" min="1" max="20" value="${Number(recipe?.servings) || 2}" required></label>
        </div>
        <label>Kurze Beschreibung<textarea id="recipeDescription" rows="2" maxlength="300" placeholder="Was macht das Gericht aus?">${escapeText(recipe?.description || "")}</textarea></label>
        <div class="nutrition-editor-heading"><strong>Zutaten</strong><button type="button" class="nutrition-small-button" id="addIngredientButton">＋ Zutat</button></div>
        <div id="recipeIngredients">
          ${ingredients.map((ingredient,index) => ingredientRowMarkup(ingredient,index)).join("")}
        </div>
        <label>Zubereitung<textarea id="recipeInstructions" rows="4" placeholder="Beschreibe die Zubereitung …">${escapeText(recipe?.instructions || "")}</textarea></label>
        <div class="nutrition-recipe-preview" id="recipeProteinPreview">Protein pro Portion wird anhand der Zutaten berechnet.</div>
        <div class="nutrition-form-actions">
          <button type="button" class="nutrition-small-button" id="cancelRecipeButton">Abbrechen</button>
          <button type="submit" class="nutrition-primary-button">${editing ? "Änderungen speichern" : "Rezept speichern"}</button>
        </div>
      </form>`;
  }

  function ingredientRowMarkup(ingredient = {}, index = 0) {
    const selected = FOOD_LIBRARY.some(food => food.id === ingredient.foodId) ? ingredient.foodId : FOOD_LIBRARY[0].id;
    return `<div class="nutrition-ingredient-row">
      <select class="recipe-food" aria-label="Lebensmittel">${FOOD_LIBRARY.map(food => `<option value="${food.id}" ${food.id===selected?"selected":""}>${escapeText(food.name)} · ${food.protein} g Protein/100 g</option>`).join("")}</select>
      <label class="nutrition-grams-label">Gramm<input class="recipe-grams" type="number" min="1" max="5000" step="1" value="${Math.max(1,Number(ingredient.grams)||100}"></label>
      <button type="button" class="nutrition-remove-ingredient" aria-label="Zutat entfernen">×</button>
    </div>`;
  }

  function bindRecipes() {
    const editor = document.getElementById("recipeEditor");
    const list = document.getElementById("recipeList");
    const newButton = document.getElementById("newRecipeButton");
    if (!editor || !list || !newButton) return;

    newButton.addEventListener("click", () => openRecipeEditor());
    document.getElementById("recipeSearch").addEventListener("input", renderRecipes);
    document.getElementById("recipeFilter").addEventListener("change", renderRecipes);

    editor.addEventListener("click", event => {
      if (event.target.closest("#cancelRecipeButton")) {
        editor.hidden = true;
        editor.innerHTML = "";
      }
      if (event.target.closest("#addIngredientButton")) {
        const rows = document.getElementById("recipeIngredients");
        rows.insertAdjacentHTML("beforeend", ingredientRowMarkup({foodId:"tofu",grams:100}, rows.children.length));
        updateProteinPreview();
      }
      if (event.target.closest(".nutrition-remove-ingredient")) {
        event.target.closest(".nutrition-ingredient-row")?.remove();
        updateProteinPreview();
      }
    });
    editor.addEventListener("change", event => {
      if (event.target.matches(".recipe-food,.recipe-grams")) updateProteinPreview();
    });
    editor.addEventListener("input", event => {
      if (event.target.matches(".recipe-grams")) updateProteinPreview();
    });
    editor.addEventListener("submit", event => {
      if (event.target.id !== "nutritionRecipeForm") return;
      event.preventDefault();
      const name = document.getElementById("recipeName").value.trim();
      const servings = Number(document.getElementById("recipeServings").value);
      const ingredients = [...editor.querySelectorAll(".nutrition-ingredient-row")].map(row => {
        const food = FOOD_LIBRARY.find(item => item.id === row.querySelector(".recipe-food").value);
        return food ? {foodId:food.id,name:food.name,proteinPer100g:food.protein,grams:Number(row.querySelector(".recipe-grams").value)} : null;
      }).filter(item => item && item.grams > 0);
      if (!name || !Number.isInteger(servings) || servings < 1 || !ingredients.length) {
        alert("Bitte gib einen Namen, mindestens eine Zutat mit Menge und eine gültige Portionszahl ein.");
        return;
      }
      const id = document.getElementById("recipeEditId").value;
      const previous = nutritionData.recipes.find(item => item.id === id);
      const recipe = {
        id: id || "recipe-" + Date.now().toString(36) + Math.random().toString(36).slice(2,7),
        name,
        description: document.getElementById("recipeDescription").value.trim(),
        servings,
        ingredients,
        instructions: document.getElementById("recipeInstructions").value.trim(),
        updatedAt: new Date().toISOString(),
        createdAt: previous?.createdAt || new Date().toISOString()
      };
      if (id) nutritionData.recipes = nutritionData.recipes.map(item => item.id === id ? recipe : item);
      else nutritionData.recipes.unshift(recipe);
      if (saveStore()) {
        editor.hidden = true;
        editor.innerHTML = "";
        renderRecipes();
      }
    });

    list.addEventListener("click", event => {
      const edit = event.target.closest("[data-recipe-edit]");
      const remove = event.target.closest("[data-recipe-delete]");
      if (edit) {
        const recipe = nutritionData.recipes.find(item => item.id === edit.dataset.recipeEdit);
        if (recipe) openRecipeEditor(recipe);
      }
      if (remove) {
        const recipe = nutritionData.recipes.find(item => item.id === remove.dataset.recipeDelete);
        if (recipe && confirm("Möchtest du das Rezept „" + recipe.name + "“ wirklich löschen?")) {
          nutritionData.recipes = nutritionData.recipes.filter(item => item.id !== recipe.id);
          saveStore();
          renderRecipes();
        }
      }
    });
    renderRecipes();
  }

  function openRecipeEditor(recipe = null) {
    const editor = document.getElementById("recipeEditor");
    if (!editor) return;
    editor.innerHTML = recipeFormMarkup(recipe);
    editor.hidden = false;
    updateProteinPreview();
    editor.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function updateProteinPreview() {
    const rows = [...document.querySelectorAll("#recipeIngredients .nutrition-ingredient-row")];
    const total = rows.reduce((sum,row) => {
      const food = FOOD_LIBRARY.find(item => item.id === row.querySelector(".recipe-food")?.value);
      const grams = Number(row.querySelector(".recipe-grams")?.value) || 0;
      return sum + (food ? food.protein * grams / 100 : 0);
    },0);
    const servings = Math.max(1,Number(document.getElementById("recipeServings")?.value)||1);
    const preview = document.getElementById("recipeProteinPreview");
    if (preview) preview.innerHTML = `Geschätztes Protein: <strong>${total.toFixed(1).replace(".",",")} g insgesamt</strong> · <strong>${(total/servings).toFixed(1).replace(".",",")} g pro Portion</strong>`;
  }

  function renderRecipes() {
    const list = document.getElementById("recipeList");
    if (!list) return;
    const query = (document.getElementById("recipeSearch")?.value || "").trim().toLocaleLowerCase("de");
    const filter = document.getElementById("recipeFilter")?.value || "all";
    const recipes = nutritionData.recipes.filter(recipe => {
      const searchable = [recipe.name,recipe.description,...(recipe.ingredients||[]).map(item=>item.name)].join(" ").toLocaleLowerCase("de");
      return searchable.includes(query) && (filter !== "protein" || recipeProtein(recipe) >= 20);
    }).sort((a,b)=>recipeProtein(b)-recipeProtein(a));
    if (!recipes.length) {
      list.innerHTML = `<div class="nutrition-empty">${nutritionData.recipes.length ? "Keine passenden Rezepte gefunden." : "Noch keine Rezepte gespeichert. Erstelle dein erstes Rezept und füge pflanzliche Proteinquellen hinzu."}</div>`;
      return;
    }
    list.innerHTML = recipes.map(recipe => {
      const protein = recipeProtein(recipe);
      return `<article class="nutrition-recipe-card">
        <div class="nutrition-recipe-card-top"><div><span class="nutrition-tag">${protein >= 20 ? "Proteinreich · Richtwert" : "Veganes Rezept"}</span><h3>${escapeText(recipe.name)}</h3><p>${escapeText(recipe.description || "Eigenes Rezept")}</p></div><div class="nutrition-protein-number"><strong>${protein.toFixed(1).replace(".",",")}</strong><span>g Protein / Portion</span></div></div>
        <div class="nutrition-recipe-meta"><span>🍽️ ${recipe.servings} Portionen</span><span>🥬 ${(recipe.ingredients||[]).length} Zutaten</span></div>
        <details class="nutrition-recipe-details"><summary>Zutaten und Zubereitung ansehen</summary>
          <ul>${(recipe.ingredients||[]).map(item=>`<li>${escapeText(item.name)} – ${item.grams} g</li>`).join("")}</ul>
          <p>${escapeText(recipe.instructions || "Noch keine Zubereitung hinterlegt.")}</p>
        </details>
        <div class="nutrition-form-actions"><button class="nutrition-small-button" data-recipe-edit="${escapeText(recipe.id)}">Bearbeiten</button><button class="nutrition-small-button nutrition-danger-button" data-recipe-delete="${escapeText(recipe.id)}">Löschen</button></div>
      </article>`;
    }).join("");
  }

  function start() {
    if (initialized) return;
    initialized = true;
    pageMarkup();
    buildNavigation();
    buildModeSwitch();
    const mode = localStorage.getItem("studyspaceWorkspaceMode") || "learning";
    setMode(mode);
    console.log("StudySpace Ernährung-Grundgerüst geladen.");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
