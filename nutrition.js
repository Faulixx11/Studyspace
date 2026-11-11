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
      renderNutritionDashboard();
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
      ["nutrition-profile", "Ernährungsprofil"],
      ["nutrition-nutrients", "Nährwerte"],
      ["nutrition-scanner", "Lebensmittelscanner"]
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
        <div class="nutrition-planner-toolbar"><label>Woche ab <input id="plannerWeek" type="date"></label><button class="nutrition-primary-button" id="generateShoppingFromPlan">🛒 Einkaufsliste aus dieser Woche erstellen</button></div><div id="plannerGrid" class="nutrition-planner-grid"></div><p class="nutrition-muted">Du kannst jede Mahlzeit mit einem deiner gespeicherten Rezepte oder einem freien Eintrag belegen. Die Planung wird automatisch gespeichert.</p>
      </section>
      <section class="nutrition-page" id="nutrition-shopping">
        <div class="page-intro"><h1>Einkauf & Vorrat</h1><p>Behalte Lebensmittel und benötigte Zutaten im Blick.</p></div>
        <div class="nutrition-shopping-toolbar"><button class="nutrition-primary-button" id="makeShoppingList">＋ Liste aus Wochenplan erstellen</button><button class="nutrition-small-button" id="addShoppingItem">＋ Artikel manuell</button></div><div id="shoppingLists"></div><div class="nutrition-divider"></div><h2>Vorrat</h2><form id="pantryForm" class="nutrition-inline-form"><input id="pantryName" placeholder="Lebensmittel" required><input id="pantryAmount" type="number" min="1" step="1" placeholder="Menge in g" required><button class="nutrition-primary-button">Vorrat hinzufügen</button></form><div id="pantryList"></div><p class="nutrition-muted">Beim Erstellen einer Einkaufsliste werden bekannte Vorratsmengen von den geplanten Zutaten abgezogen. Prüfe Mengen und Packungsgrößen vor dem Einkauf.</p>
      </section>
      <section class="nutrition-page" id="nutrition-mealprep">
        <div class="page-intro"><h1>Meal Prep</h1><p>Plane die Vorbereitung deiner Mahlzeiten.</p></div>
        <div class="nutrition-prep-toolbar"><label>Planname<input id="prepName" placeholder="z. B. Vorbereitung für die Schulwoche"></label><button class="nutrition-primary-button" id="createPrepPlan">＋ Meal-Prep-Plan erstellen</button></div><div id="mealPrepList"></div><p class="nutrition-muted">Plane nur die Vorbereitung. Beachte bei gekühlten Speisen saubere Behälter, zügiges Abkühlen und eine durchgehende Kühlung; bei Unsicherheit lieber frisch zubereiten.</p>
      </section>
      <section class="nutrition-page" id="nutrition-knowledge">
        <div class="page-intro"><h1>Ernährungswissen</h1><p>Verlässliche Grundlagen zu veganer Ernährung und Nährstoffen.</p></div>
        <div class="nutrition-knowledge-grid"><article class="nutrition-card"><h3>🌱 Pflanzliche Proteinquellen</h3><p>Tofu, Tempeh, Sojadrink, Hülsenfrüchte, Seitan, Erbsen und Getreide liefern Protein. Unterschiedliche Quellen über den Tag verteilt sorgen für Abwechslung.</p></article><article class="nutrition-card"><h3>🧬 Vitamin B12</h3><p>Bei veganer Ernährung ist eine zuverlässige B12-Versorgung besonders wichtig. Angereicherte Lebensmittel können beitragen; eine passende Supplementierung sollte fachlich abgestimmt werden.</p></article><article class="nutrition-card"><h3>🩸 Eisen</h3><p>Hülsenfrüchte, Tofu, Vollkorn und Samen enthalten pflanzliches Eisen. Vitamin-C-reiche Lebensmittel zur Mahlzeit können die Aufnahme verbessern.</p></article><article class="nutrition-card"><h3>🦴 Calcium</h3><p>Calcium steckt unter anderem in calciumangereicherten Pflanzendrinks, calciumreichem Mineralwasser und bestimmten Tofusorten.</p></article><article class="nutrition-card"><h3>🌊 Jod & Omega-3</h3><p>Jodiertes Speisesalz kann zur Jodversorgung beitragen. Für Omega-3 sind beispielsweise Rapsöl und geschrotete Leinsamen Quellen von ALA.</p></article><article class="nutrition-card"><h3>🥦 Vielfalt statt Perfektion</h3><p>Eine abwechslungsreiche Ernährung mit Gemüse, Obst, Hülsenfrüchten, Vollkorn und geeigneten angereicherten Lebensmitteln ist hilfreicher als einzelne „Superfoods“.</p></article></div><div class="nutrition-note" style="margin-top:16px">Das ist allgemeines Ernährungswissen und keine persönliche medizinische Beratung. Bei veganer Ernährung lohnt sich eine individuelle Beratung zu kritischen Nährstoffen.</div>
      </section>
      <section class="nutrition-page" id="nutrition-ai">
        <div class="page-intro"><h1>KI-Ernährungsassistent</h1><p>Ideen und Planung passend zu deiner veganen Ernährung.</p></div>
        <div class="nutrition-note">Dieser Assistent arbeitet derzeit lokal mit deinen gespeicherten Rezepten und Vorratsangaben. Er ist noch keine generative KI und kann keine Nährstoff- oder Gesundheitsdiagnosen stellen. Eine echte KI-Anbindung folgt erst mit sicherem Server-Endpunkt.</div><div class="nutrition-ai-box"><div id="nutritionAiMessages" class="nutrition-ai-messages"><div class="nutrition-ai-message">Hallo! Ich kann deine Rezepte durchsuchen und dir Ideen anhand deiner Vorräte zeigen.</div></div><form id="nutritionAiForm"><textarea id="nutritionAiInput" rows="3" placeholder="z. B. Was kann ich mit Tofu und Brokkoli kochen?"></textarea><button class="nutrition-primary-button">Frage stellen</button></form><div class="nutrition-import-area"><h3>Rezept importieren</h3><p class="nutrition-muted">Füge ein Rezept als Text ein oder importiere eine StudySpace-Rezeptdatei im JSON-Format.</p><textarea id="recipeImportText" rows="5" placeholder="Rezeptname: ...&#10;Zutaten: 200 g Tofu, 150 g Brokkoli&#10;Zubereitung: ..."></textarea><div class="nutrition-form-actions"><label class="nutrition-small-button">JSON-Datei auswählen<input id="recipeImportFile" type="file" accept=".json,application/json" hidden></label><button class="nutrition-primary-button" id="importRecipeText" type="button">Text als Rezept übernehmen</button></div></div><div class="nutrition-import-area"><h3>Zutatenfoto</h3><p class="nutrition-muted">Du kannst ein Foto als Notiz anhängen. Eine automatische KI-Erkennung ist noch nicht aktiv; bestätige Zutaten immer selbst.</p><input id="ingredientPhoto" type="file" accept="image/*"><div id="ingredientPhotoPreview"></div></div></div>
      </section>
      <section class="nutrition-page" id="nutrition-nutrients"><div class="page-intro"><h1>Nährwertanalyse</h1><p>Geschätzte Nährwerte deiner gespeicherten Rezepte pro Portion.</p></div><label class="nutrition-analysis-label">Rezept auswählen<select id="nutrientRecipeSelect"><option value="">Rezept wählen …</option></select></label><div id="nutrientAnalysis" class="nutrition-analysis-grid"><div class="nutrition-empty">Wähle ein Rezept aus.</div></div><div class="nutrition-note">Orientierungswerte aus einer allgemeinen Lebensmittelliste. Markenprodukte und Zubereitung können abweichen. Keine Kalorien- oder Gewichtsziele.</div><h2>Lebensmittel-Referenzliste</h2><div id="foodDatabase" class="nutrition-food-database"></div></section>
      <section class="nutrition-page" id="nutrition-scanner"><div class="page-intro"><h1>Lebensmittelscanner</h1><p>Produktinformationen per Barcode finden.</p></div><div class="nutrition-note">Die Suche nutzt Open Food Facts. Daten können unvollständig oder fehlerhaft sein. Prüfe Verpackung und Zutatenliste, besonders bei Allergien.</div><div class="nutrition-scanner-panel"><form id="barcodeForm" class="nutrition-inline-form"><input id="barcodeInput" inputmode="numeric" placeholder="Barcode-Nummer eingeben"><button class="nutrition-primary-button">Produkt suchen</button></form><div class="nutrition-form-actions"><button class="nutrition-small-button" id="startBarcodeCamera" type="button">Kamera starten</button><button class="nutrition-small-button" id="stopBarcodeCamera" type="button" disabled>Kamera stoppen</button></div><video id="barcodeVideo" playsinline muted hidden></video><p id="barcodeStatus" class="nutrition-muted">Kamera wird erst nach Klick aktiviert. HTTPS und Browserfreigabe erforderlich.</p><div id="barcodeResult"></div></div></section>
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
    bindPlanner();
    bindShopping();
    bindMealPrep();
    bindNutritionAssistant();
    bindBarcodeScanner();
    renderNutrientAnalysis();
    renderFoodDatabase();
    renderNutritionDashboard();
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
      <button class="nav-item" data-nutrition-page="nutrition-nutrients"><span class="nav-icon">◉</span><span class="nav-text">Nährwerte</span></button>
      <button class="nav-item" data-nutrition-page="nutrition-scanner"><span class="nav-icon">▣</span><span class="nav-text">Lebensmittelscanner</span></button>
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
    if (id === "nutrition-planner") renderPlanner();
    if (id === "nutrition-shopping") { renderShopping(); renderPantry(); }
    if (id === "nutrition-mealprep") renderMealPrep();
    if (id === "nutrition-nutrients") renderNutrientAnalysis();
    if (id === "nutrition-scanner") renderFoodDatabase();
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
      <label class="nutrition-grams-label">Gramm<input class="recipe-grams" type="number" min="1" max="5000" step="1" value="${Math.max(1,Number(ingredient.grams)||100)}"></label>
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
      if (event.target.matches(".recipe-grams") || event.target.id === "recipeServings") updateProteinPreview();
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


  const PLAN_SLOTS = ["Frühstück","Mittagessen","Abendessen","Snack"];
  const isoDate = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
  const mondayOf = date => { const d=new Date(date+"T12:00:00"); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return d; };
  const addDays = (date,n) => { const d=new Date(date+"T12:00:00"); d.setDate(d.getDate()+n); return d; };
  const plannerDate = () => document.getElementById("plannerWeek")?.value || isoDate(mondayOf(new Date()));
  function ensureWeek(date) {
    const monday=isoDate(mondayOf(date));
    let plan=nutritionData.mealPlans.find(p=>p.weekStart===monday);
    if(!plan){plan={id:"week-"+monday,weekStart:monday,meals:[]};nutritionData.mealPlans.push(plan);saveStore();}
    return plan;
  }
  function renderPlanner() {
    const grid=document.getElementById("plannerGrid"); if(!grid)return;
    const start=mondayOf(plannerDate()); const plan=ensureWeek(isoDate(start));
    grid.innerHTML=Array.from({length:7},(_,i)=>{
      const day=addDays(isoDate(start),i), key=isoDate(day);
      const label=day.toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"2-digit"});
      return '<section class="nutrition-day"><h3>'+escapeText(label)+'</h3>'+PLAN_SLOTS.map(slot=>{
        const meal=plan.meals.find(m=>m.date===key&&m.slot===slot);
        const recipe=meal?.recipeId?nutritionData.recipes.find(r=>r.id===meal.recipeId):null;
        const title=recipe?.name||meal?.customName||"Noch frei";
        return '<div class="nutrition-meal-slot"><label>'+slot+'</label><div class="nutrition-meal-current">'+escapeText(title)+'</div><select data-plan-recipe data-date="'+key+'" data-slot="'+slot+'"><option value="">— Rezept wählen —</option>'+nutritionData.recipes.map(r=>'<option value="'+escapeText(r.id)+'" '+(meal?.recipeId===r.id?'selected':'')+'>'+escapeText(r.name)+'</option>').join("")+'</select><input data-plan-custom data-date="'+key+'" data-slot="'+slot+'" placeholder="Oder freie Mahlzeit" value="'+escapeText(meal?.customName||"")+'"><button class="nutrition-small-button" data-plan-clear data-date="'+key+'" data-slot="'+slot+'">Entfernen</button></div>';
      }).join("")+'</section>';
    }).join("");
  }
  function bindPlanner() {
    const week=document.getElementById("plannerWeek"); if(!week)return;
    week.value=isoDate(mondayOf(new Date()));
    week.addEventListener("change",renderPlanner);
    document.getElementById("plannerGrid").addEventListener("change",e=>{
      const el=e.target;if(!el.matches("[data-plan-recipe]"))return;
      const plan=ensureWeek(el.dataset.date), date=el.dataset.date, slot=el.dataset.slot;
      let meal=plan.meals.find(m=>m.date===date&&m.slot===slot);
      if(!meal){meal={date,slot};plan.meals.push(meal);}
      meal.recipeId=el.value||"";
      if(meal.recipeId)meal.customName="";
      if(!meal.recipeId&&!meal.customName)plan.meals=plan.meals.filter(m=>m!==meal);
      saveStore();renderPlanner();
    });
    document.getElementById("plannerGrid").addEventListener("change",e=>{
      const el=e.target;if(!el.matches("[data-plan-custom]"))return;
      const plan=ensureWeek(el.dataset.date), date=el.dataset.date, slot=el.dataset.slot;
      let meal=plan.meals.find(m=>m.date===date&&m.slot===slot);
      if(!meal){meal={date,slot};plan.meals.push(meal);}
      meal.customName=el.value.trim();meal.recipeId="";
      if(!meal.customName)plan.meals=plan.meals.filter(m=>m!==meal);
      saveStore();renderPlanner();
    });
    document.getElementById("plannerGrid").addEventListener("click",e=>{
      const b=e.target.closest("[data-plan-clear]");if(!b)return;
      const plan=ensureWeek(b.dataset.date);
      plan.meals=plan.meals.filter(m=>!(m.date===b.dataset.date&&m.slot===b.dataset.slot));
      saveStore();renderPlanner();
    });
    const make=()=>generateShoppingList();
    document.getElementById("makeShoppingList")?.addEventListener("click",make);
    document.getElementById("generateShoppingFromPlan")?.addEventListener("click",make);
    renderPlanner();
  }
  function generateShoppingList() {
    const start=mondayOf(plannerDate()), week=isoDate(start);
    const plan=nutritionData.mealPlans.find(p=>p.weekStart===week);
    if(!plan||!plan.meals.some(m=>m.recipeId&&nutritionData.recipes.some(r=>r.id===m.recipeId))){alert("In dieser Woche sind noch keine gespeicherten Rezepte eingeplant.");return;}
    const totals={};
    plan.meals.filter(m=>m.recipeId).forEach(meal=>{
      const recipe=nutritionData.recipes.find(r=>r.id===meal.recipeId);if(!recipe)return;
      (recipe.ingredients||[]).forEach(ing=>{
        const key=ing.foodId||ing.name.toLowerCase();
        if(!totals[key])totals[key]={key,name:ing.name,grams:0};
        totals[key].grams+=Number(ing.grams)||0;
      });
    });
    const items=Object.values(totals).map(item=>{
      const inPantry=nutritionData.pantry.filter(p=>(p.foodId||p.name.toLowerCase())===item.key).reduce((s,p)=>s+(Number(p.grams)||0),0);
      return {...item,grams:Math.max(0,Math.ceil(item.grams-inPantry)),checked:false};
    }).filter(i=>i.grams>0);
    const list={id:"list-"+Date.now(),weekStart:week,createdAt:new Date().toISOString(),items};
    nutritionData.shoppingLists.unshift(list);saveStore();renderShopping();
    showPage("nutrition-shopping");
  }
  function renderShopping() {
    const root=document.getElementById("shoppingLists");if(!root)return;
    if(!nutritionData.shoppingLists.length){root.innerHTML='<div class="nutrition-empty">Noch keine Einkaufsliste. Erstelle sie aus deinem Wochenplan oder füge Artikel manuell hinzu.</div>';return;}
    root.innerHTML=nutritionData.shoppingLists.map(list=>'<section class="nutrition-list-card"><div class="nutrition-form-actions"><h3>Einkauf · Woche ab '+escapeText(new Date(list.weekStart+"T12:00:00").toLocaleDateString("de-DE"))+'</h3><button class="nutrition-small-button nutrition-danger-button" data-delete-list="'+escapeText(list.id)+'">Liste löschen</button></div>'+((list.items||[]).map((item,i)=>'<label class="nutrition-check-item"><input type="checkbox" data-list-check="'+escapeText(list.id)+'" data-item-index="'+i+'" '+(item.checked?'checked':'')+'><span>'+escapeText(item.name)+' · '+item.grams+' g</span><button type="button" class="nutrition-small-button" data-remove-list-item="'+escapeText(list.id)+'" data-item-index="'+i+'">×</button></label>').join("")||'<p class="nutrition-muted">Alle benötigten Mengen sind laut Vorrat abgedeckt.</p>')+'</section>').join("");
  }
  function renderPantry() {
    const root=document.getElementById("pantryList");if(!root)return;
    root.innerHTML=nutritionData.pantry.length?nutritionData.pantry.map(p=>'<div class="nutrition-pantry-item"><span>'+escapeText(p.name)+' · '+p.grams+' g</span><button class="nutrition-small-button nutrition-danger-button" data-pantry-delete="'+escapeText(p.id)+'">Entfernen</button></div>').join(""):'<div class="nutrition-empty">Dein Vorrat ist noch leer.</div>';
  }
  function bindShopping() {
    const form=document.getElementById("pantryForm");if(!form)return;
    form.addEventListener("submit",e=>{e.preventDefault();const name=document.getElementById("pantryName").value.trim(),grams=Number(document.getElementById("pantryAmount").value);if(!name||grams<=0)return;nutritionData.pantry.push({id:"pantry-"+Date.now(),name,grams,foodId:FOOD_LIBRARY.find(f=>f.name.toLowerCase()===name.toLowerCase())?.id||name.toLowerCase()});saveStore();form.reset();renderPantry();});
    document.getElementById("addShoppingItem").addEventListener("click",()=>{const name=prompt("Welcher Artikel soll auf die Einkaufsliste?");if(!name?.trim())return;const amount=Number(prompt("Welche Menge in Gramm? (Zahl eingeben)"))||0;if(amount<=0)return;let list=nutritionData.shoppingLists[0];if(!list){list={id:"list-"+Date.now(),weekStart:isoDate(mondayOf(new Date())),items:[]};nutritionData.shoppingLists.unshift(list);}list.items.push({name:name.trim(),grams:amount,checked:false,key:name.toLowerCase()});saveStore();renderShopping();});
    document.getElementById("shoppingLists").addEventListener("change",e=>{const c=e.target.closest("[data-list-check]");if(!c)return;const l=nutritionData.shoppingLists.find(x=>x.id===c.dataset.listCheck);if(l?.items[c.dataset.itemIndex]){l.items[c.dataset.itemIndex].checked=c.checked;saveStore();}});
    document.getElementById("shoppingLists").addEventListener("click",e=>{const d=e.target.closest("[data-delete-list]");if(d){nutritionData.shoppingLists=nutritionData.shoppingLists.filter(x=>x.id!==d.dataset.deleteList);saveStore();renderShopping();return;}const r=e.target.closest("[data-remove-list-item]");if(r){const l=nutritionData.shoppingLists.find(x=>x.id===r.dataset.removeListItem);l?.items.splice(Number(r.dataset.itemIndex),1);saveStore();renderShopping();}});
    renderShopping();renderPantry();
  }
  function renderMealPrep() {
    const root=document.getElementById("mealPrepList");if(!root)return;
    root.innerHTML=nutritionData.mealPrepPlans.length?nutritionData.mealPrepPlans.map(p=>'<section class="nutrition-list-card"><div class="nutrition-form-actions"><h3>'+escapeText(p.name)+'</h3><button class="nutrition-small-button nutrition-danger-button" data-prep-delete="'+escapeText(p.id)+'">Löschen</button></div>'+(p.tasks||[]).map((t,i)=>'<label class="nutrition-check-item"><input type="checkbox" data-prep-task="'+escapeText(p.id)+'" data-task-index="'+i+'" '+(t.done?'checked':'')+'><span>'+escapeText(t.text)+'</span></label>').join("")+'</section>').join(""):'<div class="nutrition-empty">Noch kein Meal-Prep-Plan angelegt.</div>';
  }
  function bindMealPrep() {
    const button=document.getElementById("createPrepPlan");if(!button)return;
    button.addEventListener("click",()=>{const name=document.getElementById("prepName").value.trim();if(!name){alert("Bitte gib deinem Plan einen Namen.");return;}nutritionData.mealPrepPlans.unshift({id:"prep-"+Date.now(),name,tasks:[{text:"Rezepte und Mengen prüfen",done:false},{text:"Einkaufsliste kontrollieren",done:false},{text:"Zutaten waschen und vorbereiten",done:false},{text:"Speisen in saubere Behälter portionieren",done:false},{text:"Beschriften und zeitnah kühlen",done:false}]});saveStore();document.getElementById("prepName").value="";renderMealPrep();});
    document.getElementById("mealPrepList").addEventListener("change",e=>{const c=e.target.closest("[data-prep-task]");if(!c)return;const p=nutritionData.mealPrepPlans.find(x=>x.id===c.dataset.prepTask);if(p?.tasks[c.dataset.taskIndex]){p.tasks[c.dataset.taskIndex].done=c.checked;saveStore();}});
    document.getElementById("mealPrepList").addEventListener("click",e=>{const b=e.target.closest("[data-prep-delete]");if(!b)return;nutritionData.mealPrepPlans=nutritionData.mealPrepPlans.filter(p=>p.id!==b.dataset.prepDelete);saveStore();renderMealPrep();});
    renderMealPrep();
  }
  function bindNutritionAssistant() {
    const form=document.getElementById("nutritionAiForm");if(!form)return;
    const messages=document.getElementById("nutritionAiMessages");
    const reply=(text)=>{const div=document.createElement("div");div.className="nutrition-ai-message";div.textContent=text;messages.appendChild(div);};
    form.addEventListener("submit",e=>{e.preventDefault();const q=document.getElementById("nutritionAiInput").value.trim();if(!q)return;reply("Du: "+q);const terms=q.toLowerCase().split(/[^a-zäöüß]+/).filter(x=>x.length>2);
      const matches=nutritionData.recipes.filter(r=>(r.name+" "+(r.ingredients||[]).map(i=>i.name).join(" ")).toLowerCase().includes(terms.find(t=>(r.name+" "+(r.ingredients||[]).map(i=>i.name)).toLowerCase().includes(t))||"§"));
      const pantry=nutritionData.pantry.filter(p=>terms.some(t=>p.name.toLowerCase().includes(t)));
      let answer=matches.length?"Diese gespeicherten Rezepte könnten passen: "+matches.slice(0,5).map(r=>r.name+" (ca. "+recipeProtein(r).toFixed(1)+" g Protein/Portion)").join("; "):"Ich habe in deinen gespeicherten Rezepten keinen eindeutigen Treffer gefunden. Du kannst Zutaten im Vorrat ergänzen oder ein Rezept importieren.";
      if(pantry.length)answer+=" Im Vorrat gefunden: "+pantry.map(p=>p.name).join(", ")+".";
      answer+=" Hinweis: Das ist eine lokale Suche, keine generative KI oder medizinische Beratung.";reply(answer);document.getElementById("nutritionAiInput").value="";
    });
    document.getElementById("importRecipeText").addEventListener("click",()=>{
      const raw=document.getElementById("recipeImportText").value.trim();if(!raw){alert("Bitte füge zuerst einen Rezepttext ein.");return;}
      const lines=raw.split(/\r?\n/),name=(lines.find(x=>/^(rezeptname|name)\s*:/i.test(x))||"").split(":").slice(1).join(":").trim()||"Importiertes Rezept";
      const instructions=lines.filter(x=>/^(zubereitung|anleitung)\s*:/i.test(x)).join("\n").replace(/^[^:]+:/,"").trim();
      const ingredientLine=lines.find(x=>/^zutaten\s*:/i.test(x))||"";
      const ingredients=[];
      const textPart=ingredientLine.replace(/^[^:]+:/,"");
      const re=/(\d+(?:[.,]\d+)?)\s*(g|gramm)\s+([^,;]+)/gi;let match;
      while((match=re.exec(textPart))!==null){const label=match[3].trim().toLowerCase();const food=FOOD_LIBRARY.find(f=>label.includes(f.name.toLowerCase())||f.name.toLowerCase().includes(label));if(food)ingredients.push({foodId:food.id,name:food.name,proteinPer100g:food.protein,grams:Number(match[1].replace(",","."))});}
      nutritionData.recipes.unshift({id:"recipe-"+Date.now(),name,description:"Importiert – bitte Angaben prüfen",servings:2,ingredients,instructions,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      saveStore();document.getElementById("recipeImportText").value="";alert(ingredients.length?"Rezept importiert. Bitte Zutaten und Mengen kontrollieren.":"Rezepttext gespeichert, aber Zutaten konnten nicht sicher zugeordnet werden. Bitte im Rezepteditor ergänzen.");showPage("nutrition-recipes");renderRecipes();
    });
    document.getElementById("recipeImportFile").addEventListener("change",async e=>{
      const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());const recipes=Array.isArray(data)?data:(Array.isArray(data.recipes)?data.recipes:[data]);let added=0;recipes.forEach(r=>{if(!r.name||!Array.isArray(r.ingredients))return;nutritionData.recipes.unshift({...r,id:"recipe-"+Date.now()+"-"+added++,servings:Math.max(1,Number(r.servings)||1)});});saveStore();alert(added+" Rezept(e) importiert. Bitte die Zutaten prüfen.");showPage("nutrition-recipes");renderRecipes();}catch(err){alert("Die Datei konnte nicht als gültige JSON-Rezeptdatei gelesen werden.");}e.target.value="";
    });
    document.getElementById("ingredientPhoto").addEventListener("change",e=>{const file=e.target.files?.[0],root=document.getElementById("ingredientPhotoPreview");root.innerHTML="";if(!file)return;const img=document.createElement("img");img.className="nutrition-photo-preview";img.alt="Ausgewähltes Zutatenfoto";img.src=URL.createObjectURL(file);root.appendChild(img);const note=document.createElement("p");note.className="nutrition-muted";note.textContent="Foto lokal zur Ansicht ausgewählt. Zutaten bitte selbst bestätigen; es wurde keine automatische Erkennung durchgeführt.";root.appendChild(note);});
  }

  const NUTRIENTS_PER_100G = {"tofu":[15,2,8,1],"tempeh":[19,9,11,5],"seitan":[25,14,2,1],"soy-mince-dry":[50,30,1,15],"tvp-dry":[50,30,1,15],"lentils-cooked":[9,20,.4,8],"chickpeas-cooked":[8.9,27,2.6,7.6],"kidney-cooked":[8.7,22.8,.5,6.4],"edamame":[12,9,5,5],"soy-yogurt":[4,2,2.3,.6],"soy-milk":[3.3,.7,1.8,.6],"oats":[13.5,58.7,7,10],"lentil-pasta-dry":[26,55,2,11],"wholegrain-pasta-dry":[13,64,2.5,8],"quinoa-dry":[14,64,6,7],"rice-dry":[7.5,78,.7,1.3],"peas":[5.5,10,.4,5.5],"broccoli":[2.8,7,.4,2.6],"spinach":[2.9,1.4,.4,2.2],"mushrooms":[3.1,3.3,.3,1],"tomatoes":[.9,3.9,.2,1.2],"potatoes":[2,17,.1,2.2],"wholegrain-bread":[9,42,3.5,7],"pea-protein":[80,4,6,2]};
  function recipeNutrients(r){const t={protein:0,carbs:0,fat:0,fiber:0};(r.ingredients||[]).forEach(i=>{const v=NUTRIENTS_PER_100G[i.foodId];if(!v)return;const f=(Number(i.grams)||0)/100;t.protein+=v[0]*f;t.carbs+=v[1]*f;t.fat+=v[2]*f;t.fiber+=v[3]*f;});const s=Math.max(1,Number(r.servings)||1);Object.keys(t).forEach(k=>t[k]/=s);return t;}
  function renderNutrientAnalysis(){const sel=document.getElementById("nutrientRecipeSelect"),root=document.getElementById("nutrientAnalysis");if(!sel||!root)return;const old=sel.value;sel.innerHTML='<option value="">Rezept wählen …</option>'+nutritionData.recipes.map(r=>'<option value="'+escapeText(r.id)+'">'+escapeText(r.name)+'</option>').join("");if(nutritionData.recipes.some(r=>r.id===old))sel.value=old;const draw=()=>{const r=nutritionData.recipes.find(x=>x.id===sel.value);if(!r){root.innerHTML='<div class="nutrition-empty">Wähle ein Rezept aus.</div>';return;}const n=recipeNutrients(r);root.innerHTML=Object.entries({Protein:n.protein,Kohlenhydrate:n.carbs,Fett:n.fat,Ballaststoffe:n.fiber}).map(x=>'<article class="nutrition-nutrient-card"><span>'+x[0]+'</span><strong>'+x[1].toFixed(1).replace(".",",")+' g</strong><small>pro Portion · Schätzwert</small></article>').join("");};if(!sel.dataset.bound){sel.addEventListener("change",draw);sel.dataset.bound="1";}draw();}
  function renderFoodDatabase(){const root=document.getElementById("foodDatabase");if(root)root.innerHTML=FOOD_LIBRARY.map(f=>'<article class="nutrition-food-row"><strong>'+escapeText(f.name)+'</strong><span>'+f.protein+' g Protein / 100 g</span><small>Orientierungswert</small></article>').join("");}
  let barcodeStream=null,barcodeLoop=0;
  async function lookupBarcode(code){const status=document.getElementById("barcodeStatus"),root=document.getElementById("barcodeResult");if(!/^\d{8,14}$/.test(code)){status.textContent="Bitte eine Barcode-Nummer mit 8 bis 14 Ziffern eingeben.";return;}status.textContent="Produkt wird gesucht …";root.innerHTML="";try{const res=await fetch("https://world.openfoodfacts.org/api/v2/product/"+encodeURIComponent(code)+".json?fields=product_name,brands,ingredients_text,allergens_tags,nutriments,image_url,quantity");if(!res.ok)throw Error("HTTP "+res.status);const data=await res.json();if(data.status!==1||!data.product){status.textContent="Kein Produkt gefunden.";return;}const p=data.product,n=p.nutriments||{},vals=[["Protein",n.proteins_100g],["Kohlenhydrate",n.carbohydrates_100g],["Fett",n.fat_100g],["Ballaststoffe",n.fiber_100g]].filter(x=>Number.isFinite(Number(x[1])));root.innerHTML='<article class="nutrition-product-result">'+(p.image_url?'<img src="'+escapeText(p.image_url)+'" alt="Produktbild">':"")+'<div><h3>'+escapeText(p.product_name||"Unbenanntes Produkt")+'</h3><p>'+escapeText(p.brands||"Marke unbekannt")+' · '+escapeText(p.quantity||"Menge unbekannt")+'</p><div class="nutrition-product-nutrients">'+vals.map(x=>'<span>'+x[0]+': <strong>'+x[1]+' g</strong>/100 g</span>').join("")+'</div><p class="nutrition-muted">'+escapeText((p.ingredients_text||"Keine Zutatenliste hinterlegt.").slice(0,700))+'</p><p class="nutrition-muted">Allergene: '+escapeText((p.allergens_tags||[]).map(x=>x.replace("en:","")).join(", ")||"Keine Angaben")+'</p><button type="button" class="nutrition-primary-button" id="addScannedToPantry">Mit 100 g zum Vorrat hinzufügen</button></div></article>';document.getElementById("addScannedToPantry").addEventListener("click",()=>{nutritionData.pantry.push({id:"pantry-"+Date.now(),name:p.product_name||"Gescanntes Produkt",grams:100,foodId:"barcode-"+code});saveStore();alert("Produkt mit 100 g eingetragen. Bitte Menge prüfen.");});status.textContent="Produkt gefunden. Verpackungsangaben gegenprüfen.";}catch(e){status.textContent="Produktdatenbank nicht erreichbar. Prüfe deine Internetverbindung.";console.warn(e);}}
  function stopBarcodeCamera(){if(barcodeLoop)cancelAnimationFrame(barcodeLoop);barcodeLoop=0;if(barcodeStream)barcodeStream.getTracks().forEach(t=>t.stop());barcodeStream=null;const v=document.getElementById("barcodeVideo");if(v){v.pause();v.srcObject=null;v.hidden=true;}const b=document.getElementById("stopBarcodeCamera");if(b)b.disabled=true;}
  function bindBarcodeScanner(){const form=document.getElementById("barcodeForm");if(!form)return;form.addEventListener("submit",e=>{e.preventDefault();lookupBarcode(document.getElementById("barcodeInput").value.trim());});document.getElementById("startBarcodeCamera").addEventListener("click",async()=>{const status=document.getElementById("barcodeStatus"),video=document.getElementById("barcodeVideo");if(!("BarcodeDetector" in window)){status.textContent="Barcode-Erkennung wird in diesem Browser nicht unterstützt. Nutze die manuelle Eingabe.";return;}try{const detector=new BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e"]});barcodeStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});video.srcObject=barcodeStream;video.hidden=false;await video.play();document.getElementById("stopBarcodeCamera").disabled=false;status.textContent="Barcode vor die Kamera halten.";const scan=async()=>{if(!barcodeStream)return;try{const found=await detector.detect(video);if(found.length){const value=found[0].rawValue;document.getElementById("barcodeInput").value=value;stopBarcodeCamera();lookupBarcode(value);return;}}catch(e){}barcodeLoop=requestAnimationFrame(scan);};scan();}catch(e){status.textContent="Kamera nicht verfügbar oder Zugriff verweigert. Nutze die manuelle Eingabe.";stopBarcodeCamera();}});document.getElementById("stopBarcodeCamera").addEventListener("click",stopBarcodeCamera);}

  function renderNutritionDashboard() {
    const hero=document.querySelector("#nutrition-dashboard .nutrition-hero");if(!hero)return;
    let stats=document.getElementById("nutritionQuickStats");
    if(!stats){stats=document.createElement("div");stats.id="nutritionQuickStats";stats.className="nutrition-quick-stats";stats.innerHTML='<div><strong id="nutritionRecipeCount">0</strong><span>Rezepte</span></div><div><strong id="nutritionPlannedCount">0</strong><span>geplante Mahlzeiten</span></div><div><strong id="nutritionPantryCount">0</strong><span>Vorratsartikel</span></div>';hero.appendChild(stats);}
    document.getElementById("nutritionRecipeCount").textContent=nutritionData.recipes.length;
    document.getElementById("nutritionPlannedCount").textContent=nutritionData.mealPlans.reduce((s,p)=>s+p.meals.length,0);
    document.getElementById("nutritionPantryCount").textContent=nutritionData.pantry.length;
  }

  function start() {
    if (initialized) return;
    initialized = true;
    pageMarkup();
    buildNavigation();
    buildModeSwitch();

    // Alle Ernährungsbereiche nach dem Erzeugen der Seiten einmalig aktivieren.
    bindProfile();
    renderProfile();
    bindRecipes();
    bindPlanner();
    bindShopping();
    bindMealPrep();
    bindNutritionAssistant();
    bindBarcodeScanner();
    renderNutrientAnalysis();
    renderFoodDatabase();
    renderNutritionDashboard();

    const mode = localStorage.getItem("studyspaceWorkspaceMode") || "learning";
    setMode(mode);
    console.log("StudySpace Ernährung geladen.");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
