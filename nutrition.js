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
        <div class="nutrition-note">Die Rezeptdatenbank wird in der nächsten Entwicklungsphase aufgebaut. Geplant sind Zutaten, Mengen, Portionen, Zubereitung, Nährwertangaben und Filter für pflanzliche Proteinquellen.</div>
        <div class="nutrition-empty" style="margin-top:15px">Noch keine Rezepte gespeichert.</div>
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
