// ==========================================
// STUDYSPACE – DATEN UND SPEICHER
// ==========================================

const defaultData = {
    subjects: [],
    materials: [],
    flashcards: [],
    tasks: [],
    settings: {
        accent: "blue",
        fontSize: "16px"
    }
};

function loadData() {
    try {
        const saved = localStorage.getItem("studyspaceData");
        if (!saved) return structuredClone(defaultData);

        const data = JSON.parse(saved);

        return {
            subjects: Array.isArray(data.subjects) ? data.subjects : [],
            materials: Array.isArray(data.materials) ? data.materials : [],
            flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
            settings: { ...defaultData.settings, ...data.settings }
        };
    } catch (error) {
        console.error("Daten konnten nicht geladen werden:", error);
        return structuredClone(defaultData);
    }
}

let data = loadData();

function saveData() {
    try {
        localStorage.setItem("studyspaceData", JSON.stringify(data));
        return true;
    } catch (error) {
        alert("Speichern fehlgeschlagen. Möglicherweise ist der Browserspeicher voll.");
        console.error(error);
        return false;
    }
}

function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ==========================================
// NAVIGATION
// ==========================================

const sidebar = document.getElementById("sidebar");
const toggleButton = document.getElementById("toggleButton");

toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
});

const pageTitles = {
    dashboard: "Dashboard",
    subjects: "Meine Fächer",
    materials: "Hefter & Materialien",
    tutor: "KI-Tutor",
    flashcards: "Karteikarten",
    planner: "Lernplan",
    progress: "Fortschritt",
    settings: "Einstellungen"
};

function openPage(pageName) {
    const page = document.getElementById("page-" + pageName);
    if (!page) return;

    document.querySelectorAll(".page").forEach(item => {
        item.classList.remove("active");
    });

    page.classList.add("active");

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        item.classList.toggle("active", item.dataset.page === pageName);
    });

    document.getElementById("pageTitle").textContent = pageTitles[pageName];

    if (pageName === "subjects") renderSubjects();
    if (pageName === "materials") renderMaterials();
    if (pageName === "flashcards") renderFlashcards();
    if (pageName === "planner") renderTasks();
    if (pageName === "progress") renderProgress();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.page));
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.goto));
});

// ==========================================
// FÄCHER
// ==========================================

const subjectForm = document.getElementById("subjectForm");

subjectForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("subjectName").value.trim();
    const color = document.getElementById("subjectColor").value;

    if (!name) return;

    if (data.subjects.some(subject => subject.name.toLowerCase() === name.toLowerCase())) {
        alert("Dieses Fach existiert bereits.");
        return;
    }

    data.subjects.push({
        id: createId(),
        name,
        color,
        created: new Date().toISOString()
    });

    saveData();
    subjectForm.reset();
    renderAll();
});

function deleteSubject(id) {
    const subject = data.subjects.find(item => item.id === id);
    if (!subject) return;

    if (!confirm(`Möchtest du "${subject.name}" wirklich löschen? Zugeordnete Materialien, Karten und Aufgaben bleiben erhalten.`)) {
        return;
    }

    data.subjects = data.subjects.filter(item => item.id !== id);
    saveData();
    renderAll();
}

function renderSubjects() {
    const container = document.getElementById("subjectList");
    document.getElementById("subjectCount").textContent =
        `${data.subjects.length} Fächer`;

    if (data.subjects.length === 0) {
        container.innerHTML = `<div class="panel empty-state">Du hast noch keine Fächer. Füge oben dein erstes Fach hinzu.</div>`;
        return;
    }

    container.innerHTML = data.subjects.map(subject => `
        <div class="subject-card">
            <div class="subject-color ${subject.color}"></div>
            <h3>${escapeHTML(subject.name)}</h3>
            <p>${data.materials.filter(item => item.subjectId === subject.id).length} Materialien ·
            ${data.flashcards.filter(item => item.subjectId === subject.id).length} Karteikarten</p>
            <div class="card-actions">
                <button class="small-button" data-subject-open="${subject.id}">Materialien</button>
                <button class="small-button delete" data-subject-delete="${subject.id}">Löschen</button>
            </div>
        </div>
    `).join("");

    container.querySelectorAll("[data-subject-delete]").forEach(button => {
        button.addEventListener("click", () => deleteSubject(button.dataset.subjectDelete));
    });

    container.querySelectorAll("[data-subject-open]").forEach(button => {
        button.addEventListener("click", () => openPage("materials"));
    });
}
// ==========================================
// FÄCHER IN AUSWAHLLISTEN
// ==========================================

function updateSubjectSelects() {
    const selects = [
        "materialSubject",
        "tutorSubject",
        "flashcardSubject",
        "taskSubject"
    ];

    selects.forEach(id => {
        const select = document.getElementById(id);

        // Überspringen, falls das Element auf dieser Seite fehlt
        if (!select) return;

        const previous = select.value;

        select.innerHTML = `<option value="">Fach auswählen</option>` +
            data.subjects.map(subject =>
                `<option value="${subject.id}">${escapeHTML(subject.name)}</option>`
            ).join("");

        if (data.subjects.some(subject => subject.id === previous)) {
            select.value = previous;
        }
    });
}
// ==========================================
// MATERIALIEN UND HEFTER
// ==========================================

document.getElementById("materialForm").addEventListener("submit", event => {
    event.preventDefault();

    const subjectId = document.getElementById("materialSubject").value;
    const name = document.getElementById("materialName").value.trim();
    const file = document.getElementById("materialFile").files[0];

    if (!subjectId || !name || !file) {
        alert("Bitte fülle alle Felder aus.");
        return;
    }

    data.materials.push({
        id: createId(),
        subjectId,
        name,
        fileName: file.name,
        fileType: file.type || "Unbekannt",
        date: new Date().toISOString()
    });

    saveData();
    event.target.reset();
    renderAll();
    alert("Material wurde vorgemerkt!");
});

function renderMaterials() {
    const container = document.getElementById("materialList");

    if (data.materials.length === 0) {
        container.innerHTML = `<div class="panel empty-state">Noch keine Materialien vorhanden.</div>`;
        return;
    }

    container.innerHTML = data.materials.map(item => {
        const subject = data.subjects.find(s => s.id === item.subjectId);
        return `
            <div class="material-item">
                <div>
                    <strong>${escapeHTML(item.name)}</strong>
                    <p>${escapeHTML(subject?.name || "Kein Fach")} · ${escapeHTML(item.fileName)}</p>
                </div>
                <button class="small-button delete" data-material-delete="${item.id}">Entfernen</button>
            </div>
        `;
    }).join("");

    container.querySelectorAll("[data-material-delete]").forEach(button => {
        button.addEventListener("click", () => {
            data.materials = data.materials.filter(item => item.id !== button.dataset.materialDelete);
            saveData();
            renderAll();
        });
    });
}

// ==========================================
// KI-TUTOR – LERNSESSION VORBEREITEN
// ==========================================

document.getElementById("tutorForm").addEventListener("submit", event => {
    event.preventDefault();

    const topic = document.getElementById("tutorTopic").value.trim();
    const subjectId = document.getElementById("tutorSubject").value;
    const source = document.getElementById("learningSource").value;
    const difficulty = document.getElementById("difficulty").value;
    const method = document.getElementById("learningMethod").value;

    const sourceNames = {
        notebook: "Nur mein Hefter",
        combined: "Hefter + allgemeines Wissen",
        general: "Allgemeines Wissen"
    };

    const subject = data.subjects.find(item => item.id === subjectId);

    document.getElementById("tutorResult").innerHTML = `
        <h3>Deine vorbereitete Lernsession</h3>
        <p><strong>Thema:</strong> ${escapeHTML(topic || "Noch kein Thema angegeben")}</p>
        <p><strong>Fach:</strong> ${escapeHTML(subject?.name || "Nicht ausgewählt")}</p>
        <p><strong>Wissensquelle:</strong> ${sourceNames[source]}</p>
        <p><strong>Schwierigkeit:</strong> ${escapeHTML(difficulty)}</p>
        <p><strong>Lernmethode:</strong> ${escapeHTML(method)}</p>
        <div class="info-note">Diese Einstellungen sind vorbereitet. Die eigentliche KI-Unterstützung wird später angebunden.</div>
    `;
});

// ==========================================
// KARTEIKARTEN
// ==========================================

document.getElementById("flashcardForm").addEventListener("submit", event => {
    event.preventDefault();

    const question = document.getElementById("flashcardQuestion").value.trim();
    const answer = document.getElementById("flashcardAnswer").value.trim();
    const subjectId = document.getElementById("flashcardSubject").value;

    if (!question || !answer) return;

    data.flashcards.push({
        id: createId(),
        question,
        answer,
        subjectId,
        known: false
    });

    saveData();
    event.target.reset();
    renderAll();
});

let currentCardId = null;
let answerVisible = false;

function renderFlashcards() {
    const container = document.getElementById("flashcardList");

    document.getElementById("reviewCounter").textContent =
        `${data.flashcards.length} Karten`;

    if (data.flashcards.length === 0) {
        container.innerHTML = `<div class="panel empty-state">Noch keine Karteikarten erstellt.</div>`;
    } else {
        container.innerHTML = data.flashcards.map(card => {
            const subject = data.subjects.find(s => s.id === card.subjectId);
            return `
                <div class="material-item">
                    <div>
                        <strong>${escapeHTML(card.question)}</strong>
                        <p>${escapeHTML(subject?.name || "Allgemein")}</p>
                    </div>
                    <button class="small-button delete" data-card-delete="${card.id}">Löschen</button>
                </div>
            `;
        }).join("");
    }

    container.querySelectorAll("[data-card-delete]").forEach(button => {
        button.addEventListener("click", () => {
            data.flashcards = data.flashcards.filter(card => card.id !== button.dataset.cardDelete);
            currentCardId = null;
            saveData();
            renderAll();
        });
    });

    if (!data.flashcards.some(card => card.id === currentCardId)) {
        currentCardId = data.flashcards[0]?.id || null;
    }

    showCurrentCard();
}

function showCurrentCard() {
    const card = data.flashcards.find(item => item.id === currentCardId);
    const question = document.getElementById("reviewCard");
    const answer = document.getElementById("reviewAnswer");

    answerVisible = false;
    answer.textContent = "";

    if (!card) {
        question.textContent = "Erstelle deine erste Karteikarte.";
        return;
    }

    question.textContent = card.question;
}

document.getElementById("showAnswerButton").addEventListener("click", () => {
    const card = data.flashcards.find(item => item.id === currentCardId);
    if (!card) return;

    answerVisible = true;
    document.getElementById("reviewAnswer").textContent = card.answer;
});

document.getElementById("knownButton").addEventListener("click", () => {
    if (!data.flashcards.length) return;

    const index = data.flashcards.findIndex(card => card.id === currentCardId);
    if (index === -1) return;

    data.flashcards[index].known = true;

    const nextCard = data.flashcards[(index + 1) % data.flashcards.length];
    currentCardId = nextCard.id;

    saveData();
    showCurrentCard();
});

// ==========================================
// LERNPLAN
// ==========================================

document.getElementById("taskForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("taskName").value.trim();
    const subjectId = document.getElementById("taskSubject").value;
    const date = document.getElementById("taskDate").value;

    if (!name) return;

    data.tasks.push({
        id: createId(),
        name,
        subjectId,
        date,
        completed: false
    });

    saveData();
    event.target.reset();
    renderAll();
});

function renderTasks() {
    const container = document.getElementById("taskList");

    if (data.tasks.length === 0) {
        container.innerHTML = `<div class="panel empty-state">Du hast noch keine Lernaufgaben angelegt.</div>`;
        return;
    }

    const sortedTasks = [...data.tasks].sort((a, b) =>
        (a.date || "9999").localeCompare(b.date || "9999")
    );

    container.innerHTML = sortedTasks.map(task => {
        const subject = data.subjects.find(s => s.id === task.subjectId);
        return `
            <div class="task-item ${task.completed ? "completed" : ""}">
                <div>
                    <strong>${escapeHTML(task.name)}</strong>
                    <p>${escapeHTML(subject?.name || "Allgemein")} · ${task.date || "Kein Datum"}</p>
                </div>
                <div class="button-row">
                    <button class="small-button" data-task-done="${task.id}">
                        ${task.completed ? "Wieder öffnen" : "Erledigt ✓"}
                    </button>
                    <button class="small-button delete" data-task-delete="${task.id}">Löschen</button>
                </div>
            </div>
        `;
    }).join("");

    container.querySelectorAll("[data-task-done]").forEach(button => {
        button.addEventListener("click", () => {
            const task = data.tasks.find(item => item.id === button.dataset.taskDone);
            if (!task) return;
            task.completed = !task.completed;
            saveData();
            renderAll();
        });
    });

    container.querySelectorAll("[data-task-delete]").forEach(button => {
        button.addEventListener("click", () => {
            data.tasks = data.tasks.filter(item => item.id !== button.dataset.taskDelete);
            saveData();
            renderAll();
        });
    });
}

// ==========================================
// FORTSCHRITT UND DASHBOARD
// ==========================================

function renderProgress() {
    document.getElementById("progressSubjects").textContent = data.subjects.length;
    document.getElementById("progressCards").textContent = data.flashcards.length;
    document.getElementById("progressTasks").textContent =
        data.tasks.filter(task => task.completed).length;

    const container = document.getElementById("progressSubjectList");

    if (!data.subjects.length) {
        container.innerHTML = `<p class="muted">Füge Fächer hinzu, um deinen Fortschritt zu sehen.</p>`;
        return;
    }

    container.innerHTML = data.subjects.map(subject => {
        const cards = data.flashcards.filter(card => card.subjectId === subject.id);
        const known = cards.filter(card => card.known).length;
        const percentage = cards.length ? Math.round(known / cards.length * 100) : 0;

        return `
            <div class="section">
                <strong>${escapeHTML(subject.name)}</strong>
                <p class="muted">${known} von ${cards.length} Karten als gewusst markiert · ${percentage}%</p>
                <div class="progress-track">
                    <div class="progress-fill" style="width:${percentage}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

function renderDashboard() {
    document.getElementById("dashboardSubjectCount").textContent = data.subjects.length;
    document.getElementById("dashboardCardCount").textContent = data.flashcards.length;
    document.getElementById("dashboardTaskCount").textContent =
        data.tasks.filter(task => !task.completed).length;

    const container = document.getElementById("dashboardTasks");
    const tasks = data.tasks.filter(task => !task.completed).slice(0, 4);

    if (!tasks.length) {
        container.textContent = "Keine offenen Aufgaben. Du kannst im Lernplan neue hinzufügen.";
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="task-item">
            <strong>${escapeHTML(task.name)}</strong>
            <span class="muted">${task.date || "Ohne Datum"}</span>
        </div>
    `).join("");
}

// ==========================================
// EINSTELLUNGEN
// ==========================================

const accentColors = {
    blue: "#8197ff",
    purple: "#b18bff",
    green: "#70d9ba",
    pink: "#f09acb"
};

function applySettings() {
    document.documentElement.style.setProperty(
        "--accent",
        accentColors[data.settings.accent] || accentColors.blue
    );

    document.body.style.fontSize = data.settings.fontSize || "16px";

    document.getElementById("accentSetting").value = data.settings.accent;
    document.getElementById("fontSetting").value = data.settings.fontSize;
}

document.getElementById("saveSettingsButton").addEventListener("click", () => {
    data.settings.accent = document.getElementById("accentSetting").value;
    data.settings.fontSize = document.getElementById("fontSetting").value;

    saveData();
    applySettings();
    alert("Einstellungen gespeichert.");
});

// ==========================================
// DATEN EXPORTIEREN UND ZURÜCKSETZEN
// ==========================================

document.getElementById("exportButton").addEventListener("click", () => {
    const file = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "studyspace-sicherung.json";
    link.click();

    URL.revokeObjectURL(url);
});

document.getElementById("resetButton").addEventListener("click", () => {
    if (!confirm("Wirklich ALLE Fächer, Karten, Aufgaben und Einstellungen löschen?")) return;

    data = structuredClone(defaultData);
    saveData();
    currentCardId = null;
    renderAll();
    applySettings();
});

// ==========================================
// HILFSFUNKTIONEN
// ==========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function renderAll() {
    updateSubjectSelects();
    renderSubjects();
    renderMaterials();
    renderFlashcards();
    renderTasks();
    renderProgress();
    renderDashboard();
}

// ==========================================
// START
// ==========================================

renderAll();
applySettings();

/* =========================================================
   STUDYSPACE 2.2 – ERWEITERUNG
   Diesen gesamten Inhalt UNTER den bisherigen script.js-Code
   setzen. Die bisherigen Daten bleiben erhalten.
   ========================================================= */

(() => {
    "use strict";

    // ---------- Zusatzdaten separat speichern, damit sie Reloads überleben ----------
    // Die ursprüngliche Speicherung der App bleibt unangetastet.
    const extensionStorageKey = "studyspaceExtensionData";
    let extensionData = {};
    try {
        extensionData = JSON.parse(localStorage.getItem(extensionStorageKey) || "{}");
    } catch (error) {
        console.warn("StudySpace: Zusatzdaten konnten nicht gelesen werden.", error);
    }

    data.studySessions = Array.isArray(extensionData.studySessions) ? extensionData.studySessions : [];
    data.exams = Array.isArray(extensionData.exams) ? extensionData.exams : [];
    data.studyGoals = extensionData.studyGoals || { weeklyMinutes: 300 };
    data.studyTimer = extensionData.studyTimer || {
        running: false,
        startedAt: null,
        elapsedBeforeStart: 0,
        subjectId: ""
    };

    const originalSaveData = saveData;
    saveData = function() {
        originalSaveData();
        try {
            localStorage.setItem(extensionStorageKey, JSON.stringify({
                studySessions: data.studySessions,
                exams: data.exams,
                studyGoals: data.studyGoals,
                studyTimer: data.studyTimer
            }));
        } catch (error) {
            console.error("StudySpace: Zusatzdaten konnten nicht gespeichert werden.", error);
        }
    };

    const extraIcons = ["📚", "🧮", "🌍", "⚗️", "🧬", "🎵", "🗣️", "🏛️", "💻", "✍️", "📐", "🔬", "🎨", "⚖️", "📖", "⭐"];
    const colorPalette = [
        ["Blau", "#638cff"], ["Hellblau", "#48b9e8"], ["Türkis", "#39c6b0"],
        ["Grün", "#66bd75"], ["Limette", "#a5c94d"], ["Gelb", "#d8b64d"],
        ["Orange", "#e99548"], ["Koralle", "#e87968"], ["Rot", "#dc6678"],
        ["Rosa", "#e58cbd"], ["Pink", "#cb78dc"], ["Lila", "#9b82e8"],
        ["Violett", "#7666c9"], ["Grau", "#8792a8"], ["Silber", "#b3bdca"],
        ["Dunkelblau", "#425b9b"]
    ];

    const $ = id => document.getElementById(id);
    const todayISO = () => new Date().toISOString().slice(0, 10);
    const localDateISO = date => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };
    const safeText = value => escapeHTML(value ?? "");
    const getSubject = id => data.subjects.find(s => s.id === id);
    const subjectColor = subject => {
        if (!subject) return "#8197ff";
        const old = {
            blue: "#638cff", purple: "#9b82e8", green: "#39c6b0",
            orange: "#e99548", pink: "#e58cbd"
        };
        return /^#[0-9a-f]{6}$/i.test(subject.color || "") ? subject.color : (old[subject.color] || "#8197ff");
    };
    const formatMinutes = seconds => {
        const mins = Math.floor(seconds / 60);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h ? `${h} Std. ${m} Min.` : `${m} Min.`;
    };
    const formatDate = iso => {
        if (!iso) return "Ohne Datum";
        const d = new Date(`${iso}T12:00:00`);
        return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    // ---------- Neue Navigation und Seiten automatisch einfügen ----------
    const nav = document.querySelector(".navigation");
    const main = document.querySelector(".main-content");

    function addNavItem(page, icon, label) {
        if (document.querySelector(`[data-page="${page}"]`)) return;
        const button = document.createElement("button");
        button.className = "nav-item";
        button.dataset.page = page;
        button.innerHTML = `<span class="nav-icon">${icon}</span><span class="nav-text">${label}</span>`;
        nav.appendChild(button);
        button.addEventListener("click", () => openPage(page));
    }

    function addPage(id, html) {
        if ($(id)) return;
        const section = document.createElement("section");
        section.className = "page";
        section.id = `page-${id}`;
        section.innerHTML = html;
        main.appendChild(section);
    }

    addNavItem("studytime", "⏱", "Lernzeit");
    addNavItem("calendar", "▦", "Kalender");
    addNavItem("exams", "🎓", "Prüfungen");

    addPage("studytime", `
        <div class="page-intro">
            <h1>Lernzeit</h1>
            <p>Erfasse deine Lernzeit und erkenne, wie regelmäßig du lernst.</p>
        </div>
        <div class="study-layout">
            <div class="panel timer-panel">
                <span class="eyebrow">DEIN LERNTIMER</span>
                <div class="timer-clock" id="studyClock">00:00:00</div>
                <label>Woran lernst du gerade?
                    <select id="timerSubject"></select>
                </label>
                <div class="timer-actions">
                    <button class="primary-button" id="timerStart">▶ Start</button>
                    <button class="secondary-button" id="timerPause" disabled>Ⅱ Pause</button>
                    <button class="secondary-button" id="timerFinish" disabled>✓ Beenden & speichern</button>
                </div>
                <p class="muted" id="timerStatus">Starte den Timer, sobald du mit dem Lernen beginnst.</p>
            </div>
            <div class="panel">
                <h3>Dein Lernziel</h3>
                <p class="muted">Wie viele Stunden möchtest du pro Woche lernen?</p>
                <div class="goal-number"><strong id="weeklyGoalLabel">5 Std.</strong><span>pro Woche</span></div>
                <input id="weeklyGoal" type="range" min="60" max="1200" step="30" value="300">
                <div class="goal-progress-track"><div id="weeklyGoalFill"></div></div>
                <p class="muted" id="weeklyGoalProgress">0 von 5 Stunden diese Woche</p>
            </div>
        </div>
        <div class="panel">
            <div class="section-heading">
                <div><h3>Deine Lernzeiten</h3><p>Deine gespeicherten Lernsitzungen.</p></div>
                <button class="secondary-button" id="manualSessionButton">+ Zeit nachtragen</button>
            </div>
            <div id="manualSessionArea" class="manual-session-area" hidden>
                <form id="manualSessionForm" class="form-grid">
                    <input id="manualSessionDate" type="date" required>
                    <input id="manualSessionMinutes" type="number" min="1" max="1440" placeholder="Minuten" required>
                    <select id="manualSessionSubject"></select>
                    <button class="primary-button" type="submit">Speichern</button>
                </form>
            </div>
            <div id="sessionList" class="material-list"></div>
        </div>
    `);

    addPage("calendar", `
        <div class="page-intro">
            <h1>Lernkalender</h1>
            <p>Sieh auf einen Blick, wann du gelernt hast und was ansteht.</p>
        </div>
        <div class="panel">
            <div class="calendar-heading">
                <button class="secondary-button" id="calendarPrev">←</button>
                <h2 id="calendarMonth"></h2>
                <button class="secondary-button" id="calendarNext">→</button>
            </div>
            <div class="calendar-grid calendar-weekdays">
                <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
            </div>
            <div class="calendar-grid" id="calendarDays"></div>
            <div class="calendar-legend">
                <span><i class="legend-study"></i> Gelernt</span>
                <span><i class="legend-task"></i> Aufgabe</span>
                <span><i class="legend-exam"></i> Prüfung</span>
            </div>
        </div>
        <div class="panel">
            <h3 id="selectedDayTitle">Termine und Lernaktivitäten</h3>
            <div id="selectedDayItems" class="material-list"></div>
        </div>
    `);

    addPage("exams", `
        <div class="page-intro">
            <h1>Prüfungen & Klassenarbeiten</h1>
            <p>Trage wichtige Termine ein und verliere keine Prüfung aus dem Blick.</p>
        </div>
        <div class="panel">
            <h3>Neue Prüfung eintragen</h3>
            <form id="examForm" class="form-stack">
                <label>Bezeichnung<input id="examName" placeholder="z. B. Mathematik-Klassenarbeit" required></label>
                <label>Fach<select id="examSubject"></select></label>
                <label>Datum<input id="examDate" type="date" required></label>
                <label>Was kommt dran? (optional)<textarea id="examTopics" placeholder="Themen, Kapitel oder Hinweise..."></textarea></label>
                <button class="primary-button" type="submit">Prüfung speichern</button>
            </form>
        </div>
        <div class="section-heading"><h2>Deine nächsten Prüfungen</h2></div>
        <div id="examList" class="material-list"></div>
    `);

    // Navigation kennt ab jetzt auch die neuen Seiten.
    pageTitles.studytime = "Lernzeit";
    pageTitles.calendar = "Lernkalender";
    pageTitles.exams = "Prüfungen";

    const originalOpenPage = openPage;
    openPage = function(pageName) {
        originalOpenPage(pageName);
        if (pageName === "studytime") renderStudyTime();
        if (pageName === "calendar") renderCalendar();
        if (pageName === "exams") renderExams();
    };

    // ---------- Fachfarben und Fachsymbole ----------
    const colorSelect = $("subjectColor");
    if (colorSelect) {
        colorSelect.innerHTML = colorPalette.map(([name, hex]) =>
            `<option value="${hex}">${name}</option>`).join("");
        colorSelect.value = "#638cff";
    }

    const iconLabel = document.createElement("label");
    iconLabel.className = "subject-icon-field";
    iconLabel.innerHTML = `Fachsymbol
        <select id="subjectIcon">${extraIcons.map(icon => `<option value="${icon}">${icon}</option>`).join("")}</select>`;
    colorSelect.parentElement.insertBefore(iconLabel, subjectForm.querySelector("button"));

    let pendingSubjectIcon = "📚";
    let subjectCountBeforeSubmit = data.subjects.length;
    subjectForm.addEventListener("submit", () => {
        pendingSubjectIcon = $("subjectIcon").value || "📚";
        subjectCountBeforeSubmit = data.subjects.length;
    }, true);
    subjectForm.addEventListener("submit", () => {
        // Nur ein tatsächlich neu angelegtes Fach bekommt das ausgewählte Symbol.
        if (data.subjects.length > subjectCountBeforeSubmit) {
            const newest = data.subjects[data.subjects.length - 1];
            if (newest) {
                newest.icon = pendingSubjectIcon;
                saveData();
                renderSubjects();
            }
        }
    });

    // Ersetzt nur die Darstellung; die vorhandenen Fach-Daten bleiben bestehen.
    renderSubjects = function() {
        const container = $("subjectList");
        $("subjectCount").textContent = `${data.subjects.length} Fächer`;
        if (!data.subjects.length) {
            container.innerHTML = `<div class="panel empty-state">Du hast noch keine Fächer. Füge oben dein erstes Fach hinzu.</div>`;
            return;
        }
        container.innerHTML = data.subjects.map(subject => `
            <div class="subject-card subject-card-enhanced" style="--subject-color:${subjectColor(subject)}">
                <div class="subject-card-top">
                    <span class="subject-symbol">${safeText(subject.icon || "📚")}</span>
                    <span class="subject-color-dot"></span>
                </div>
                <h3>${safeText(subject.name)}</h3>
                <p>${data.materials.filter(item => item.subjectId === subject.id).length} Materialien ·
                ${data.flashcards.filter(item => item.subjectId === subject.id).length} Karteikarten</p>
                <div class="card-actions">
                    <button class="small-button" data-subject-open="${safeText(subject.id)}">Materialien</button>
                    <button class="small-button delete" data-subject-delete="${safeText(subject.id)}">Löschen</button>
                </div>
            </div>`).join("");
        container.querySelectorAll("[data-subject-delete]").forEach(button =>
            button.addEventListener("click", () => deleteSubject(button.dataset.subjectDelete)));
        container.querySelectorAll("[data-subject-open]").forEach(button =>
            button.addEventListener("click", () => {
                $("materialSubject").value = button.dataset.subjectOpen;
                openPage("materials");
            }));
    };

    // ---------- Materialien zeigen die Farbe ihres Fachs ----------
    renderMaterials = function() {
        const container = $("materialList");
        if (!data.materials.length) {
            container.innerHTML = `<div class="panel empty-state">Noch keine Materialien vorhanden.</div>`;
            return;
        }
        container.innerHTML = data.materials.map(item => {
            const subject = getSubject(item.subjectId);
            return `<div class="material-item material-item-colored" style="--subject-color:${subjectColor(subject)}">
                <div class="material-subject-mark"></div>
                <div class="material-main">
                    <strong>${safeText(item.name)}</strong>
                    <p>${safeText(subject?.icon || "📁")} ${safeText(subject?.name || "Kein Fach")} · ${safeText(item.fileName)}</p>
                </div>
                <button class="small-button delete" data-material-delete="${safeText(item.id)}">Entfernen</button>
            </div>`;
        }).join("");
        container.querySelectorAll("[data-material-delete]").forEach(button =>
            button.addEventListener("click", () => {
                data.materials = data.materials.filter(item => item.id !== button.dataset.materialDelete);
                saveData();
                renderAll();
            }));
    };

    // ---------- Karteikarten mit animierter Vorder- und Rückseite ----------
    showCurrentCard = function() {
        const card = data.flashcards.find(item => item.id === currentCardId);
        const holder = $("reviewCard");
        answerVisible = false;
        $("reviewAnswer").textContent = "";
        $("showAnswerButton").textContent = "Antwort zeigen";
        if (!card) {
            holder.className = "review-card empty-state";
            holder.textContent = "Erstelle deine erste Karteikarte.";
            return;
        }
        const subject = getSubject(card.subjectId);
        holder.className = "review-card flip-card-scene";
        holder.innerHTML = `
            <div class="flip-card-inner" id="flipCardInner">
                <div class="flip-card-face flip-card-front">
                    <span class="flip-label">${safeText(subject?.name || "Lernkarte")} · FRAGE</span>
                    <div class="flip-card-content">${safeText(card.question)}</div>
                    <span class="flip-hint">Drehe die Karte um, um die Antwort zu sehen</span>
                </div>
                <div class="flip-card-face flip-card-back">
                    <span class="flip-label">ANTWORT</span>
                    <div class="flip-card-content">${safeText(card.answer)}</div>
                    <span class="flip-hint">Konntest du die Frage beantworten?</span>
                </div>
            </div>`;
    };

    $("showAnswerButton").addEventListener("click", () => {
        const inner = $("flipCardInner");
        if (!inner) return;
        inner.classList.toggle("flipped");
        answerVisible = inner.classList.contains("flipped");
        $("showAnswerButton").textContent = answerVisible ? "← Frage anzeigen" : "Antwort zeigen";
    });

    // ---------- Auswahlfelder für neue Bereiche ----------
    function fillSubjectSelect(id, includeAll = false) {
        const select = $(id);
        if (!select) return;
        const previous = select.value;
        select.innerHTML = `<option value="">${includeAll ? "Alle Fächer" : "Fach auswählen"}</option>` +
            data.subjects.map(s => `<option value="${safeText(s.id)}">${safeText(s.icon || "📚")} ${safeText(s.name)}</option>`).join("");
        if (data.subjects.some(s => s.id === previous)) select.value = previous;
    }

    // ---------- Lernzeit-Timer ----------
    let timerInterval = null;
    let calendarCursor = new Date();
    let selectedCalendarDate = todayISO();

    function elapsedSeconds() {
        const timer = data.studyTimer;
        if (!timer.running || !timer.startedAt) return timer.elapsedBeforeStart || 0;
        return (timer.elapsedBeforeStart || 0) + Math.max(0, Math.floor((Date.now() - timer.startedAt) / 1000));
    }

    function paintClock() {
        const clock = $("studyClock");
        if (!clock) return;
        const seconds = elapsedSeconds();
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        clock.textContent = `${h}:${m}:${s}`;
        $("timerStart").disabled = data.studyTimer.running;
        $("timerPause").disabled = !data.studyTimer.running;
        $("timerFinish").disabled = seconds < 1;
        $("timerStatus").textContent = data.studyTimer.running
            ? `Du lernst gerade${getSubject(data.studyTimer.subjectId) ? " · " + getSubject(data.studyTimer.subjectId).name : ""}.`
            : seconds ? "Timer pausiert. Du kannst fortsetzen oder speichern." : "Starte den Timer, sobald du mit dem Lernen beginnst.";
    }

    function startTimer() {
        if (data.studyTimer.running) return;
        if (!data.studyTimer.startedAt && !data.studyTimer.elapsedBeforeStart) {
            data.studyTimer.subjectId = $("timerSubject")?.value || "";
        }
        data.studyTimer.running = true;
        data.studyTimer.startedAt = Date.now();
        saveData();
        paintClock();
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(paintClock, 1000);
    }

    function pauseTimer() {
        if (!data.studyTimer.running) return;
        data.studyTimer.elapsedBeforeStart = elapsedSeconds();
        data.studyTimer.running = false;
        data.studyTimer.startedAt = null;
        saveData();
        paintClock();
    }

    function finishTimer() {
        const seconds = elapsedSeconds();
        if (seconds < 60) {
            if (!confirm("Die Lernzeit beträgt weniger als eine Minute. Trotzdem speichern?")) return;
        }
        if (seconds > 0) {
            data.studySessions.push({
                id: createId(),
                date: todayISO(),
                seconds,
                subjectId: data.studyTimer.subjectId || "",
                createdAt: new Date().toISOString()
            });
        }
        data.studyTimer = { running: false, startedAt: null, elapsedBeforeStart: 0, subjectId: "" };
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
        saveData();
        renderStudyTime();
        renderCalendar();
        renderProgress();
    }

    function mondayOf(date) {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const day = (d.getDay() + 6) % 7;
        d.setDate(d.getDate() - day);
        return d;
    }

    function weekSessions() {
        const start = mondayOf(new Date());
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return data.studySessions.filter(s => {
            const d = new Date(`${s.date}T12:00:00`);
            return d >= start && d < end;
        });
    }

    function renderStudyTime() {
        fillSubjectSelect("timerSubject");
        fillSubjectSelect("manualSessionSubject");
        if (data.studyTimer.subjectId && $("timerSubject")) $("timerSubject").value = data.studyTimer.subjectId;
        paintClock();

        const goal = Number(data.studyGoals.weeklyMinutes) || 300;
        $("weeklyGoal").value = goal;
        $("weeklyGoalLabel").textContent = `${(goal / 60).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std.`;
        const done = weekSessions().reduce((sum, s) => sum + (s.seconds || 0), 0);
        const doneMinutes = Math.round(done / 60);
        $("weeklyGoalFill").style.width = `${Math.min(100, doneMinutes / goal * 100)}%`;
        $("weeklyGoalProgress").textContent =
            `${formatMinutes(done)} von ${(goal / 60).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Stunden diese Woche`;

        const sessions = [...data.studySessions].sort((a, b) =>
            (b.createdAt || b.date).localeCompare(a.createdAt || a.date)).slice(0, 12);
        $("sessionList").innerHTML = sessions.length ? sessions.map(s => {
            const subject = getSubject(s.subjectId);
            return `<div class="material-item">
                <div><strong>${safeText(subject?.icon || "📘")} ${safeText(subject?.name || "Allgemeines Lernen")}</strong>
                <p>${formatDate(s.date)} · ${formatMinutes(s.seconds || 0)}</p></div>
                <button class="small-button delete" data-session-delete="${safeText(s.id)}">Löschen</button>
            </div>`;
        }).join("") : `<div class="empty-state">Noch keine Lernzeiten gespeichert. Starte oben deinen ersten Timer.</div>`;
        $("sessionList").querySelectorAll("[data-session-delete]").forEach(button =>
            button.addEventListener("click", () => {
                data.studySessions = data.studySessions.filter(s => s.id !== button.dataset.sessionDelete);
                saveData(); renderStudyTime(); renderCalendar(); renderProgress();
            }));
    }

    $("timerStart").addEventListener("click", startTimer);
    $("timerPause").addEventListener("click", pauseTimer);
    $("timerFinish").addEventListener("click", finishTimer);
    $("timerSubject").addEventListener("change", event => {
        if (!data.studyTimer.running && !data.studyTimer.elapsedBeforeStart) {
            data.studyTimer.subjectId = event.target.value;
            saveData();
        }
    });
    $("weeklyGoal").addEventListener("input", event => {
        data.studyGoals.weeklyMinutes = Number(event.target.value);
        saveData();
        renderStudyTime();
    });
    $("manualSessionButton").addEventListener("click", () => {
        $("manualSessionArea").hidden = !$("manualSessionArea").hidden;
        $("manualSessionDate").value = todayISO();
    });
    $("manualSessionForm").addEventListener("submit", event => {
        event.preventDefault();
        const minutes = Number($("manualSessionMinutes").value);
        if (!Number.isFinite(minutes) || minutes <= 0) return;
        data.studySessions.push({
            id: createId(),
            date: $("manualSessionDate").value,
            seconds: Math.round(minutes * 60),
            subjectId: $("manualSessionSubject").value,
            createdAt: new Date().toISOString()
        });
        saveData();
        event.target.reset();
        renderStudyTime();
        renderCalendar();
        renderProgress();
    });

    // ---------- Prüfungen ----------
    $("examForm").addEventListener("submit", event => {
        event.preventDefault();
        data.exams.push({
            id: createId(),
            name: $("examName").value.trim(),
            subjectId: $("examSubject").value,
            date: $("examDate").value,
            topics: $("examTopics").value.trim()
        });
        saveData();
        event.target.reset();
        renderExams();
        renderCalendar();
    });

    function renderExams() {
        fillSubjectSelect("examSubject");
        const exams = [...data.exams].sort((a, b) => a.date.localeCompare(b.date));
        $("examList").innerHTML = exams.length ? exams.map(exam => {
            const subject = getSubject(exam.subjectId);
            const days = Math.ceil((new Date(`${exam.date}T12:00:00`) - new Date(`${todayISO()}T12:00:00`)) / 86400000);
            let label = days < 0 ? "Vergangen" : days === 0 ? "Heute" : `Noch ${days} Tage`;
            return `<div class="exam-item">
                <div class="exam-date-box"><strong>${new Date(`${exam.date}T12:00:00`).getDate()}</strong>
                <span>${new Date(`${exam.date}T12:00:00`).toLocaleDateString("de-DE", { month: "short" })}</span></div>
                <div class="exam-main"><strong>${safeText(exam.name)}</strong>
                <p>${safeText(subject?.name || "Kein Fach")} · ${formatDate(exam.date)} · ${label}</p>
                ${exam.topics ? `<p class="exam-topics">${safeText(exam.topics)}</p>` : ""}</div>
                <button class="small-button delete" data-exam-delete="${safeText(exam.id)}">Löschen</button>
            </div>`;
        }).join("") : `<div class="empty-state">Noch keine Prüfungen eingetragen. Füge oben deinen nächsten Test hinzu.</div>`;
        $("examList").querySelectorAll("[data-exam-delete]").forEach(button =>
            button.addEventListener("click", () => {
                data.exams = data.exams.filter(e => e.id !== button.dataset.examDelete);
                saveData(); renderExams(); renderCalendar();
            }));
    }

    // ---------- Monatskalender ----------
    function renderCalendar() {
        const year = calendarCursor.getFullYear();
        const month = calendarCursor.getMonth();
        $("calendarMonth").textContent = calendarCursor.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
        const first = new Date(year, month, 1);
        const offset = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(`<div class="calendar-day outside"></div>`);
        for (let day = 1; day <= daysInMonth; day++) {
            const date = localDateISO(new Date(year, month, day));
            const hasStudy = data.studySessions.some(s => s.date === date);
            const hasTask = data.tasks.some(t => t.date === date && !t.completed);
            const hasExam = data.exams.some(e => e.date === date);
            const marks = `${hasStudy ? '<i class="day-mark study-mark"></i>' : ""}${hasTask ? '<i class="day-mark task-mark"></i>' : ""}${hasExam ? '<i class="day-mark exam-mark"></i>' : ""}`;
            cells.push(`<button class="calendar-day ${date === todayISO() ? "today" : ""} ${date === selectedCalendarDate ? "selected" : ""}" data-calendar-date="${date}">
                <span>${day}</span><div class="day-marks">${marks}</div></button>`);
        }
        while (cells.length % 7) cells.push(`<div class="calendar-day outside"></div>`);
        $("calendarDays").innerHTML = cells.join("");
        $("calendarDays").querySelectorAll("[data-calendar-date]").forEach(button =>
            button.addEventListener("click", () => {
                selectedCalendarDate = button.dataset.calendarDate;
                renderCalendar();
            }));
        renderSelectedDay();
    }

    function renderSelectedDay() {
        $("selectedDayTitle").textContent = `Einträge am ${formatDate(selectedCalendarDate)}`;
        const items = [];
        data.studySessions.filter(s => s.date === selectedCalendarDate).forEach(s => {
            const subject = getSubject(s.subjectId);
            items.push(`<div class="calendar-entry study-entry"><strong>📘 Lernzeit · ${safeText(subject?.name || "Allgemein")}</strong><p>${formatMinutes(s.seconds || 0)}</p></div>`);
        });
        data.tasks.filter(t => t.date === selectedCalendarDate).forEach(t =>
            items.push(`<div class="calendar-entry task-entry"><strong>☑ Aufgabe · ${safeText(t.name)}</strong><p>${t.completed ? "Erledigt" : "Noch offen"}</p></div>`));
        data.exams.filter(e => e.date === selectedCalendarDate).forEach(e =>
            items.push(`<div class="calendar-entry exam-entry"><strong>🎓 Prüfung · ${safeText(e.name)}</strong><p>${safeText(getSubject(e.subjectId)?.name || "Kein Fach")}</p></div>`));
        $("selectedDayItems").innerHTML = items.length ? items.join("") : `<div class="empty-state">Für diesen Tag ist noch nichts eingetragen.</div>`;
    }

    $("calendarPrev").addEventListener("click", () => {
        calendarCursor.setMonth(calendarCursor.getMonth() - 1);
        renderCalendar();
    });
    $("calendarNext").addEventListener("click", () => {
        calendarCursor.setMonth(calendarCursor.getMonth() + 1);
        renderCalendar();
    });

    // ---------- Fortschritt: Lernzeitstatistik ergänzen ----------
    const oldRenderProgress = renderProgress;
    renderProgress = function() {
        oldRenderProgress();
        const container = $("page-progress");
        if (!$("studyAnalytics")) {
            const panel = document.createElement("div");
            panel.className = "panel";
            panel.id = "studyAnalytics";
            panel.innerHTML = `
                <div class="section-heading">
                    <div><h3>Lernzeit-Statistik</h3><p>Wie viel Zeit hast du mit Lernen verbracht?</p></div>
                    <select id="chartPeriod" class="chart-period">
                        <option value="week">Diese Woche</option>
                        <option value="month" selected>Dieser Monat</option>
                        <option value="year">Dieses Jahr</option>
                    </select>
                </div>
                <div class="analytics-summary"><strong id="totalStudyTime">0 Std.</strong><span>Gesamte erfasste Lernzeit</span></div>
                <div id="studyChart" class="study-chart"></div>
                <div id="subjectStudyStats" class="subject-study-stats"></div>`;
            container.appendChild(panel);
            $("chartPeriod").addEventListener("change", renderStudyChart);
        }
        renderStudyChart();
    };

    function renderStudyChart() {
        if (!$("studyChart")) return;
        const period = $("chartPeriod").value;
        const now = new Date();
        let buckets = [];
        if (period === "week") {
            const start = mondayOf(now);
            buckets = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start); d.setDate(start.getDate() + i);
                return { date: localDateISO(d), label: d.toLocaleDateString("de-DE", { weekday: "short" }) };
            });
        } else if (period === "month") {
            const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            buckets = Array.from({ length: count }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
                return { date: localDateISO(d), label: String(i + 1) };
            });
        } else {
            buckets = Array.from({ length: 12 }, (_, i) => ({
                month: i,
                label: new Date(now.getFullYear(), i, 1).toLocaleDateString("de-DE", { month: "short" })
            }));
        }
        const values = buckets.map(bucket => data.studySessions
            .filter(s => period === "year"
                ? new Date(`${s.date}T12:00:00`).getFullYear() === now.getFullYear() &&
                  new Date(`${s.date}T12:00:00`).getMonth() === bucket.month
                : s.date === bucket.date)
            .reduce((sum, s) => sum + (s.seconds || 0), 0) / 3600);
        const max = Math.max(1, ...values);
        const total = data.studySessions.reduce((sum, s) => sum + (s.seconds || 0), 0);
        $("totalStudyTime").textContent = `${(total / 3600).toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std.`;
        $("studyChart").innerHTML = buckets.map((bucket, i) => `
            <div class="chart-column" title="${bucket.label}: ${values[i].toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std.">
                <div class="chart-bar-area"><div class="chart-bar" style="height:${values[i] ? Math.max(4, values[i] / max * 100) : 0}%"></div></div>
                <span>${safeText(bucket.label)}</span>
            </div>`).join("");
        const bySubject = data.subjects.map(subject => ({
            subject,
            seconds: data.studySessions.filter(s => s.subjectId === subject.id).reduce((sum, s) => sum + (s.seconds || 0), 0)
        })).sort((a, b) => b.seconds - a.seconds);
        $("subjectStudyStats").innerHTML = bySubject.length ? `<h4>Lernzeit nach Fach (gesamter Zeitraum)</h4>` +
            bySubject.map(item => `<div class="subject-stat-row"><span>${safeText(item.subject.icon || "📚")} ${safeText(item.subject.name)}</span><strong>${formatMinutes(item.seconds)}</strong></div>`).join("")
            : `<p class="muted">Lege Fächer an, um die Lernzeit nach Fach auszuwerten.</p>`;
    }

    // ---------- Render-All erweitert die bestehenden Render-Funktionen ----------
    const previousRenderAll = renderAll;
    renderAll = function() {
        previousRenderAll();
        // neue Bereiche aktualisieren, wenn sie bereits aufgebaut sind
        if ($("timerSubject")) fillSubjectSelect("timerSubject");
        if ($("manualSessionSubject")) fillSubjectSelect("manualSessionSubject");
        if ($("examSubject")) fillSubjectSelect("examSubject");
        if ($("studyAnalytics")) renderStudyChart();
    };

    // Initialisierung
    fillSubjectSelect("timerSubject");
    fillSubjectSelect("manualSessionSubject");
    fillSubjectSelect("examSubject");
    $("manualSessionDate").value = todayISO();
    $("examDate").min = todayISO();
    if (data.studyTimer.running && data.studyTimer.startedAt) {
        timerInterval = setInterval(paintClock, 1000);
    }
    paintClock();

    // Timer läuft auch dann weiter, wenn zwischen Seiten gewechselt wird.
    window.addEventListener("beforeunload", saveData);
})();

// ======================================================
// STUDYSPACE 3.0 – INTELLIGENTES MATERIALSYSTEM
// Dateien, Themen, Suche, Vorschau und Lernquellen
// ======================================================

(() => {
    "use strict";

    const DB_NAME = "StudySpaceFilesDB";
    const DB_VERSION = 1;
    const STORE_NAME = "files";
    const MATERIAL_SETTINGS_KEY = "studyspaceMaterialsSettings";

    let materialDB = null;
    let currentPreviewUrl = null;

    // --------------------------------------------------
    // 1. INDEXEDDB – ECHTE DATEIEN SPEICHERN
    // --------------------------------------------------

    function openMaterialDB() {
        return new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) {
                reject(new Error("IndexedDB wird von diesem Browser nicht unterstützt."));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = event => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "id" });
                }
            };

            request.onsuccess = () => {
                materialDB = request.result;
                resolve(materialDB);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async function saveActualFile(id, file) {
        const db = materialDB || await openMaterialDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            store.put({
                id,
                file,
                savedAt: new Date().toISOString()
            });

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    }

    async function getActualFile(id) {
        const db = materialDB || await openMaterialDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const request = transaction.objectStore(STORE_NAME).get(id);

            request.onsuccess = () => resolve(request.result?.file || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function deleteActualFile(id) {
        const db = materialDB || await openMaterialDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            transaction.objectStore(STORE_NAME).delete(id);

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // --------------------------------------------------
    // 2. ZUSÄTZLICHE FELDER IN DAS MATERIALFORMULAR
    // --------------------------------------------------

    const materialForm = document.getElementById("materialForm");

    if (!materialForm) return;

    const materialSubmitButton = materialForm.querySelector('button[type="submit"]');

    const topicLabel = document.createElement("label");
    topicLabel.innerHTML = `
        Thema
        <input id="materialTopic" type="text"
            placeholder="z. B. Genetik, Französische Revolution ...">
    `;

    const subtopicLabel = document.createElement("label");
    subtopicLabel.innerHTML = `
        Unterthema
        <input id="materialSubtopic" type="text"
            placeholder="z. B. Meiose, Ursachen, Folgen ...">
    `;

    const descriptionLabel = document.createElement("label");
    descriptionLabel.innerHTML = `
        Beschreibung oder Notiz
        <textarea id="materialDescription"
            placeholder="Worum geht es auf dieser Seite? Was ist wichtig?"></textarea>
    `;

    materialForm.insertBefore(topicLabel, materialSubmitButton);
    materialForm.insertBefore(subtopicLabel, materialSubmitButton);
    materialForm.insertBefore(descriptionLabel, materialSubmitButton);

    // Zusätzliche Hinweise unter dem Formular
    const storageNote = document.createElement("p");
    storageNote.className = "info-note";
    storageNote.id = "materialStorageNote";
    storageNote.textContent =
        "Deine Dateien werden jetzt direkt in deinem Browser gespeichert. Sie bleiben auch nach dem Neuladen erhalten.";

    materialForm.parentElement.appendChild(storageNote);

    // --------------------------------------------------
    // 3. SUCH- UND FILTERLEISTE
    // --------------------------------------------------

    const materialList = document.getElementById("materialList");

    const filterPanel = document.createElement("div");
    filterPanel.className = "panel material-filter-panel";
    filterPanel.innerHTML = `
        <div class="material-filter-heading">
            <div>
                <h3>Material durchsuchen</h3>
                <p class="muted">Finde schnell die passende Hefterseite.</p>
            </div>
            <span id="materialResultCount" class="muted">0 Materialien</span>
        </div>

        <input id="materialSearch" type="search"
            placeholder="Titel, Thema oder Beschreibung suchen ...">

        <div class="material-filter-grid">
            <select id="materialFilterSubject">
                <option value="">Alle Fächer</option>
            </select>

            <select id="materialFilterType">
                <option value="">Alle Dateitypen</option>
                <option value="image">Bilder</option>
                <option value="pdf">PDF-Dateien</option>
                <option value="other">Andere Dateien</option>
            </select>
        </div>

        <select id="materialFilterTopic">
            <option value="">Alle Themen</option>
        </select>

        <button class="small-button" id="materialClearFilters" type="button">
            Filter zurücksetzen
        </button>
    `;

    materialList.parentElement.insertBefore(filterPanel, materialList);

    // --------------------------------------------------
    // 4. LERNQUELLEN SPEICHERN
    // --------------------------------------------------

    const learningSource = document.getElementById("learningSource");

    function loadMaterialSettings() {
        try {
            return JSON.parse(
                localStorage.getItem(MATERIAL_SETTINGS_KEY)
            ) || { source: "notebook" };
        } catch {
            return { source: "notebook" };
        }
    }

    let materialSettings = loadMaterialSettings();

    if (learningSource) {
        learningSource.value = materialSettings.source || "notebook";

        learningSource.addEventListener("change", () => {
            materialSettings.source = learningSource.value;

            localStorage.setItem(
                MATERIAL_SETTINGS_KEY,
                JSON.stringify(materialSettings)
            );

            showSourceExplanation();
        });

        const sourceInfo = document.createElement("div");
        sourceInfo.id = "learningSourceInfo";
        sourceInfo.className = "info-note";

        learningSource.parentElement.appendChild(sourceInfo);

        showSourceExplanation();
    }

    function showSourceExplanation() {
        const info = document.getElementById("learningSourceInfo");
        if (!info || !learningSource) return;

        const explanations = {
            notebook:
                "Hefter-Modus: Der spätere KI-Tutor soll sich ausschließlich auf deine hochgeladenen Unterrichtsmaterialien stützen.",

            combined:
                "Kombinierter Modus: Deine Materialien bilden die Grundlage. Zusätzliches Wissen soll klar als Ergänzung gekennzeichnet werden.",

            general:
                "Allgemeiner Modus: Der spätere KI-Tutor soll allgemeines Wissen verwenden und nicht auf deinen Hefter beschränkt sein."
        };

        info.textContent = explanations[learningSource.value];
    }

    // --------------------------------------------------
    // 5. MATERIALIEN ANZEIGEN
    // --------------------------------------------------

    function getFileCategory(material) {
        const type = (material.fileType || "").toLowerCase();
        const name = (material.fileName || "").toLowerCase();

        if (type.startsWith("image/")) return "image";
        if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";

        return "other";
    }

    function getFileIcon(material) {
        const category = getFileCategory(material);

        if (category === "image") return "🖼️";
        if (category === "pdf") return "📄";

        return "📎";
    }

    function refreshMaterialFilters() {
        const subjectFilter = document.getElementById("materialFilterSubject");
        const topicFilter = document.getElementById("materialFilterTopic");

        const oldSubject = subjectFilter.value;
        const oldTopic = topicFilter.value;

        subjectFilter.innerHTML = `
            <option value="">Alle Fächer</option>
            ${data.subjects.map(subject => `
                <option value="${escapeHTML(subject.id)}">
                    ${escapeHTML(subject.name)}
                </option>
            `).join("")}
        `;

        const topics = [...new Set(
            data.materials.map(item => item.topic).filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, "de"));

        topicFilter.innerHTML = `
            <option value="">Alle Themen</option>
            ${topics.map(topic => `
                <option value="${escapeHTML(topic)}">
                    ${escapeHTML(topic)}
                </option>
            `).join("")}
        `;

        subjectFilter.value = oldSubject;
        topicFilter.value = oldTopic;
    }

    function renderSmartMaterials() {
        const search = document.getElementById("materialSearch").value
            .trim().toLowerCase();

        const subjectFilter = document.getElementById("materialFilterSubject").value;
        const typeFilter = document.getElementById("materialFilterType").value;
        const topicFilter = document.getElementById("materialFilterTopic").value;

        const filtered = data.materials.filter(item => {
            const subject = data.subjects.find(s => s.id === item.subjectId);

            const searchableText = [
                item.name,
                item.fileName,
                item.topic,
                item.subtopic,
                item.description,
                subject?.name
            ].join(" ").toLowerCase();

            if (search && !searchableText.includes(search)) return false;
            if (subjectFilter && item.subjectId !== subjectFilter) return false;
            if (typeFilter && getFileCategory(item) !== typeFilter) return false;
            if (topicFilter && item.topic !== topicFilter) return false;

            return true;
        });

        document.getElementById("materialResultCount").textContent =
            `${filtered.length} von ${data.materials.length} Materialien`;

        if (!filtered.length) {
            materialList.innerHTML = `
                <div class="panel empty-state">
                    Keine passenden Materialien gefunden.
                    <p>Ändere deine Suche oder setze die Filter zurück.</p>
                </div>
            `;
            return;
        }

        materialList.innerHTML = filtered.map(item => {
            const subject = data.subjects.find(s => s.id === item.subjectId);
            const category = getFileCategory(item);

            return `
                <article class="material-item smart-material-item">
                    <div class="smart-material-info">
                        <div class="smart-material-icon">
                            ${getFileIcon(item)}
                        </div>

                        <div class="smart-material-text">
                            <strong>${escapeHTML(item.name)}</strong>

                            <p>
                                ${escapeHTML(subject?.name || "Kein Fach")}
                                ${item.topic ? " · " + escapeHTML(item.topic) : ""}
                                ${item.subtopic ? " · " + escapeHTML(item.subtopic) : ""}
                            </p>

                            <span class="material-file-name">
                                ${escapeHTML(item.fileName || "Unbekannte Datei")}
                                · ${item.date ? new Date(item.date).toLocaleDateString("de-DE") : ""}
                            </span>

                            ${item.description ? `
                                <p class="material-description">
                                    ${escapeHTML(item.description)}
                                </p>
                            ` : ""}
                        </div>
                    </div>

                    <div class="smart-material-actions">
                        <button class="small-button"
                            data-material-open="${escapeHTML(item.id)}">
                            Öffnen
                        </button>

                        <button class="small-button"
                            data-material-edit="${escapeHTML(item.id)}">
                            Bearbeiten
                        </button>

                        <button class="small-button delete"
                            data-material-delete-new="${escapeHTML(item.id)}">
                            Löschen
                        </button>
                    </div>
                </article>
            `;
        }).join("");

        materialList.querySelectorAll("[data-material-open]").forEach(button => {
            button.addEventListener("click", () => {
                openMaterialPreview(button.dataset.materialOpen);
            });
        });

        materialList.querySelectorAll("[data-material-edit]").forEach(button => {
            button.addEventListener("click", () => {
                editMaterial(button.dataset.materialEdit);
            });
        });

        materialList.querySelectorAll("[data-material-delete-new]").forEach(button => {
            button.addEventListener("click", () => {
                removeMaterial(button.dataset.materialDeleteNew);
            });
        });
    }

    // Vorhandene Materialanzeige ersetzen
    renderMaterials = function() {
        refreshMaterialFilters();
        renderSmartMaterials();
    };

    // --------------------------------------------------
    // 6. NEUES MATERIAL SPEICHERN
    // --------------------------------------------------

    materialForm.addEventListener("submit", async event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const subjectId = document.getElementById("materialSubject").value;
        const name = document.getElementById("materialName").value.trim();
        const fileInput = document.getElementById("materialFile");
        const file = fileInput.files[0];

        const topic = document.getElementById("materialTopic").value.trim();
        const subtopic = document.getElementById("materialSubtopic").value.trim();
        const description = document.getElementById("materialDescription").value.trim();

        if (!subjectId || !name || !file) {
            alert("Bitte wähle ein Fach, gib einen Titel ein und lade eine Datei hoch.");
            return;
        }

        if (file.size > 30 * 1024 * 1024) {
            alert("Die Datei ist größer als 30 MB. Bitte verwende eine kleinere Datei.");
            return;
        }

        const button = materialForm.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = "Wird gespeichert ...";

        const id = createId();

        try {
            await saveActualFile(id, file);

            data.materials.push({
                id,
                subjectId,
                name,
                fileName: file.name,
                fileType: file.type || "Unbekannt",
                topic,
                subtopic,
                description,
                date: new Date().toISOString(),
                fileStored: true
            });

            saveData();

            materialForm.reset();
            document.getElementById("materialTopic").value = "";
            document.getElementById("materialSubtopic").value = "";
            document.getElementById("materialDescription").value = "";

            renderAll();

            alert("Material wurde vollständig gespeichert!");
        } catch (error) {
            console.error("Material konnte nicht gespeichert werden:", error);
            alert("Die Datei konnte nicht gespeichert werden. Prüfe den verfügbaren Browserspeicher.");
        } finally {
            button.disabled = false;
            button.textContent = "Material speichern";
        }
    }, true);

    materialSubmitButton.textContent = "Material speichern";

    // --------------------------------------------------
    // 7. DATEI-VORSCHAU
    // --------------------------------------------------

    function createPreviewModal() {
        let modal = document.getElementById("materialPreviewModal");

        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "materialPreviewModal";
        modal.className = "material-preview-modal";

        modal.innerHTML = `
            <div class="material-preview-window">
                <div class="material-preview-header">
                    <div>
                        <strong id="materialPreviewTitle">Material ansehen</strong>
                        <p id="materialPreviewSubtitle" class="muted"></p>
                    </div>

                    <button id="materialPreviewClose" class="small-button">
                        Schließen ✕
                    </button>
                </div>

                <div id="materialPreviewContent" class="material-preview-content"></div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#materialPreviewClose").addEventListener("click", closePreview);

        modal.addEventListener("click", event => {
            if (event.target === modal) closePreview();
        });

        return modal;
    }

    async function openMaterialPreview(id) {
        const material = data.materials.find(item => item.id === id);
        if (!material) return;

        try {
            const file = await getActualFile(id);

            if (!file) {
                alert("Die Datei selbst wurde nicht gefunden. Möglicherweise stammt dieses Material noch aus der älteren StudySpace-Version. Bitte lade es erneut hoch.");
                return;
            }

            if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);

            currentPreviewUrl = URL.createObjectURL(file);

            const modal = createPreviewModal();
            const content = modal.querySelector("#materialPreviewContent");

            modal.querySelector("#materialPreviewTitle").textContent = material.name;
            modal.querySelector("#materialPreviewSubtitle").textContent =
                material.fileName || "Datei";

            content.innerHTML = "";

            if (file.type.startsWith("image/")) {
                const image = document.createElement("img");
                image.src = currentPreviewUrl;
                image.alt = material.name;
                image.className = "material-preview-image";
                content.appendChild(image);
            } else if (file.type === "application/pdf" ||
                       (material.fileName || "").toLowerCase().endsWith(".pdf")) {
                const frame = document.createElement("iframe");
                frame.src = currentPreviewUrl;
                frame.title = material.name;
                frame.className = "material-preview-pdf";
                content.appendChild(frame);
            } else if (file.type.startsWith("text/")) {
                const textContent = await file.text();
                const pre = document.createElement("pre");
                pre.className = "material-preview-text";
                pre.textContent = textContent;
                content.appendChild(pre);
            } else {
                const link = document.createElement("a");
                link.href = currentPreviewUrl;
                link.download = material.fileName || "material";
                link.textContent = "Datei herunterladen";
                link.className = "primary-button";
                content.appendChild(link);

                const message = document.createElement("p");
                message.textContent =
                    "Für diesen Dateityp ist keine direkte Vorschau verfügbar.";
                content.appendChild(message);
            }

            modal.classList.add("visible");
        } catch (error) {
            console.error(error);
            alert("Die Datei konnte nicht geöffnet werden.");
        }
    }

    function closePreview() {
        const modal = document.getElementById("materialPreviewModal");
        if (modal) modal.classList.remove("visible");

        if (currentPreviewUrl) {
            URL.revokeObjectURL(currentPreviewUrl);
            currentPreviewUrl = null;
        }
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closePreview();
    });

    // --------------------------------------------------
    // 8. MATERIAL BEARBEITEN
    // --------------------------------------------------

    function editMaterial(id) {
        const material = data.materials.find(item => item.id === id);
        if (!material) return;

        const newName = prompt("Neuer Titel:", material.name);
        if (newName === null) return;

        if (!newName.trim()) {
            alert("Der Titel darf nicht leer sein.");
            return;
        }

        const newTopic = prompt("Thema:", material.topic || "");
        if (newTopic === null) return;

        const newSubtopic = prompt("Unterthema:", material.subtopic || "");
        if (newSubtopic === null) return;

        const newDescription = prompt("Beschreibung:", material.description || "");
        if (newDescription === null) return;

        material.name = newName.trim();
        material.topic = newTopic.trim();
        material.subtopic = newSubtopic.trim();
        material.description = newDescription.trim();

        saveData();
        renderMaterials();
    }

    // --------------------------------------------------
    // 9. MATERIAL LÖSCHEN
    // --------------------------------------------------

    async function removeMaterial(id) {
        const material = data.materials.find(item => item.id === id);
        if (!material) return;

        if (!confirm(`Möchtest du "${material.name}" wirklich löschen?`)) return;

        try {
            await deleteActualFile(id);
        } catch (error) {
            console.warn("Datei konnte nicht aus IndexedDB entfernt werden:", error);
        }

        data.materials = data.materials.filter(item => item.id !== id);

        saveData();
        renderAll();
    }

    // --------------------------------------------------
    // 10. FILTER UND SUCHE AKTIVIEREN
    // --------------------------------------------------

    document.getElementById("materialSearch").addEventListener("input", renderSmartMaterials);
    document.getElementById("materialFilterSubject").addEventListener("change", renderSmartMaterials);
    document.getElementById("materialFilterType").addEventListener("change", renderSmartMaterials);
    document.getElementById("materialFilterTopic").addEventListener("change", renderSmartMaterials);

    document.getElementById("materialClearFilters").addEventListener("click", () => {
        document.getElementById("materialSearch").value = "";
        document.getElementById("materialFilterSubject").value = "";
        document.getElementById("materialFilterType").value = "";
        document.getElementById("materialFilterTopic").value = "";

        renderSmartMaterials();
    });

    // --------------------------------------------------
    // 11. DATEIBANK VORBEREITEN
    // --------------------------------------------------

    openMaterialDB().then(() => {
        console.log("StudySpace-Dateispeicher ist bereit.");
    }).catch(error => {
        console.error("Dateispeicher konnte nicht gestartet werden:", error);

        storageNote.textContent =
            "Achtung: Der Dateispeicher konnte nicht gestartet werden. Prüfe, ob dein Browser IndexedDB unterstützt.";
    });

    // Bestehende Materialien beim Start aktualisieren
    refreshMaterialFilters();
    renderSmartMaterials();

    console.log("StudySpace 3.0 – Materialsystem geladen.");
})();


// ======================================================
// STUDYSPACE KI-TUTOR – VERBINDUNG MIT DER NEUEN OBERFLÄCHE
// ======================================================

(() => {
    "use strict";

    const tutorSettingsKey = "studyspaceTutorSettings";

    const defaultTutorSettings = {
        subjectId: "",
        topic: "",
        source: "notebook",
        difficulty: "Mittel",
        method: "Erklären",
        selectedMaterials: []
    };

    // Gespeicherte Einstellungen sicher laden
    let savedSettings = {};

    try {
        savedSettings = JSON.parse(
            localStorage.getItem(tutorSettingsKey) || "{}"
        );
    } catch (error) {
        console.warn("Tutor-Einstellungen konnten nicht gelesen werden.", error);
    }

    const tutorSettings = {
        ...defaultTutorSettings,
        ...savedSettings,
        selectedMaterials: Array.isArray(savedSettings.selectedMaterials)
            ? savedSettings.selectedMaterials
            : []
    };

    const sourceDescriptions = {
        notebook: "Die KI verwendet deine Unterrichtsmaterialien als Grundlage.",
        combined: "Die KI verwendet deine Unterlagen und darf zusätzliche Informationen ergänzen. Diese werden gekennzeichnet.",
        general: "Die KI verwendet allgemeines Wissen und ist nicht auf deinen Hefter beschränkt."
    };

    const get = id => document.getElementById(id);

    function saveTutorSettings() {
        tutorSettings.subjectId = get("tutorSubject")?.value || "";
        tutorSettings.topic = get("tutorTopic")?.value.trim() || "";
        tutorSettings.source = get("learningSource")?.value || "notebook";
        tutorSettings.difficulty = get("difficulty")?.value || "Mittel";
        tutorSettings.method = get("learningMethod")?.value || "Erklären";

        tutorSettings.selectedMaterials = [
            ...document.querySelectorAll(".ai-material-checkbox:checked")
        ].map(input => input.value);

        localStorage.setItem(
            tutorSettingsKey,
            JSON.stringify(tutorSettings)
        );

        // Für die Material-KI verfügbar machen
        window.StudySpaceTutorSettings = tutorSettings;
    }

    function renderSubjects() {
        const select = get("tutorSubject");
        if (!select) return;

        const previousValue = tutorSettings.subjectId;

        select.innerHTML = `
            <option value="">Alle Fächer</option>
            ${(data.subjects || []).map(subject => `
                <option value="${escapeHTML(subject.id)}">
                    ${escapeHTML(subject.name)}
                </option>
            `).join("")}
        `;

        if ((data.subjects || []).some(subject => subject.id === previousValue)) {
            select.value = previousValue;
        }
    }

    function createMaterialSelection() {
        const settingsPanel = document.querySelector(".tutor-settings-panel");
        if (!settingsPanel) {
            console.warn("StudySpace: Einstellungsbereich des Tutors nicht gefunden.");
            return;
        }

        let container = get("aiMaterialSelection");

        if (!container) {
            container = document.createElement("div");
            container.id = "aiMaterialSelection";
            container.className = "tutor-material-selection";

            container.innerHTML = `
                <div class="tutor-material-heading">
                    <strong>Meine Lernmaterialien</strong>
                    <span id="aiMaterialCount">0 ausgewählt</span>
                </div>
                <div id="aiMaterialList"></div>
            `;

            settingsPanel.appendChild(container);
        }

        // Speicher-Button nur anlegen, falls die HTML-Seite keinen enthält
        if (!get("aiSaveSettings")) {
            const saveButton = document.createElement("button");
            saveButton.id = "aiSaveSettings";
            saveButton.className = "primary-button tutor-save-button";
            saveButton.type = "button";
            saveButton.textContent = "Einstellungen speichern";
            settingsPanel.appendChild(saveButton);
        }

        if (!get("aiSaveStatus")) {
            const status = document.createElement("p");
            status.id = "aiSaveStatus";
            status.className = "tutor-field-hint";
            settingsPanel.appendChild(status);
        }
    }

    function renderMaterials() {
        const container = get("aiMaterialList");
        if (!container) return;

        const availableMaterials = (data.materials || []).filter(material => {
            return !tutorSettings.subjectId ||
                material.subjectId === tutorSettings.subjectId;
        });

        if (!availableMaterials.length) {
            container.innerHTML = `
                <p class="tutor-empty-materials">
                    Für dieses Fach sind noch keine Materialien vorhanden.
                </p>
            `;
        } else {
            container.innerHTML = availableMaterials.map(material => `
                <label class="ai-material-item">
                    <input
                        type="checkbox"
                        class="ai-material-checkbox"
                        value="${escapeHTML(material.id)}"
                        ${tutorSettings.selectedMaterials.includes(material.id) ? "checked" : ""}
                    >
                    <span class="ai-material-file">▧</span>
                    <span class="ai-material-name">
                        <strong>${escapeHTML(material.name)}</strong>
                        <small>${escapeHTML(material.fileName || "Lernmaterial")}</small>
                    </span>
                </label>
            `).join("");
        }

        updateMaterialCount();
    }

    function updateMaterialCount() {
        const countElement = get("aiMaterialCount");
        if (!countElement) return;

        const count = document.querySelectorAll(
            ".ai-material-checkbox:checked"
        ).length;

        countElement.textContent = `${count} ausgewählt`;
    }

    function updateSourceDescription() {
        const source = get("learningSource")?.value || "notebook";
        let description = get("aiSourceDescription");

        if (!description) {
            description = document.createElement("p");
            description.id = "aiSourceDescription";
            description.className = "tutor-field-hint";

            get("learningSource")?.insertAdjacentElement(
                "afterend",
                description
            );
        }

        if (description) {
            description.textContent =
                sourceDescriptions[source] || sourceDescriptions.notebook;
        }
    }

    function loadTutorSettings() {
        renderSubjects();

        if (get("tutorTopic")) {
            get("tutorTopic").value = tutorSettings.topic;
        }

        if (get("learningSource")) {
            get("learningSource").value = tutorSettings.source;
        }

        if (get("difficulty")) {
            get("difficulty").value = tutorSettings.difficulty;
        }

        if (get("learningMethod")) {
            get("learningMethod").value = tutorSettings.method;
        }

        updateSourceDescription();
        renderMaterials();

        window.StudySpaceTutorSettings = tutorSettings;
    }

    function initializeTutor() {
        if (!get("page-tutor")) return;

        const requiredFields = [
            "tutorSubject",
            "tutorTopic",
            "learningSource",
            "difficulty",
            "learningMethod"
        ];

        const missingFields = requiredFields.filter(id => !get(id));

        if (missingFields.length) {
            console.error(
                "StudySpace Tutor: Diese HTML-Elemente fehlen:",
                missingFields
            );
            return;
        }

        createMaterialSelection();
        loadTutorSettings();

        get("tutorSubject").addEventListener("change", () => {
            tutorSettings.subjectId = get("tutorSubject").value;
            tutorSettings.selectedMaterials = [];
            renderMaterials();
            saveTutorSettings();
        });

        get("learningSource").addEventListener("change", () => {
            updateSourceDescription();
            saveTutorSettings();
        });

        [
            "tutorTopic",
            "difficulty",
            "learningMethod"
        ].forEach(id => {
            get(id).addEventListener("change", saveTutorSettings);
        });

        get("tutorTopic").addEventListener("input", saveTutorSettings);

        get("aiMaterialList")?.addEventListener("change", event => {
            if (event.target.matches(".ai-material-checkbox")) {
                updateMaterialCount();
                saveTutorSettings();
            }
        });

        get("aiSaveSettings")?.addEventListener("click", () => {
            saveTutorSettings();

            if (get("aiSaveStatus")) {
                get("aiSaveStatus").textContent =
                    "Deine Lerneinstellungen wurden gespeichert.";
            }
        });

        document.querySelectorAll("[data-ai-tool]").forEach(button => {
            button.addEventListener("click", () => {
                const actions = {
                    explain: "Erkläre mir das ausgewählte Thema Schritt für Schritt.",
                    quiz: "Teste mein Wissen mit passenden Übungsfragen.",
                    summary: "Erstelle einen übersichtlichen Lernzettel zum Thema.",
                    cards: "Erstelle Karteikarten zu diesem Thema."
                };

                const input = get("aiChatInput");

                if (input) {
                    input.value = actions[button.dataset.aiTool] || "";
                    input.focus();
                }
            });
        });

        window.addEventListener("studyspaceTutorRefresh", () => {
            renderSubjects();
            renderMaterials();
        });

        console.log("StudySpace Tutor: Neue Oberfläche verbunden.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeTutor, {
            once: true
        });
    } else {
        initializeTutor();
    }
})();



/* =====================================================
   STUDYSPACE AI ENGINE 4.0
   Llama 3.1 8B – lokale KI über WebLLM
   Mit automatischem Fallback auf Llama 3.2 3B
===================================================== */

(() => {
    "use strict";

    const CONFIG = {
        primaryModel: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
        fallbackModel: "Llama-3.2-3B-Instruct-q4f16_1-MLC",

        temperature: 0.4,
        maxTokens: 1800,
        historyMessages: 2,

        webLLMVersion: "0.2.87"
    };

    const state = {
        engine: null,
        module: null,
        loading: false,
        ready: false,
        activeModel: null,
        messages: []
    };

    // -------------------------------------------------
    // STATUSANZEIGE
    // -------------------------------------------------

    function status(message, type = "info") {
        const element = document.getElementById("aiEngineStatus");

        if (!element) {
            console.log("[StudySpace AI]", message);
            return;
        }

        element.textContent = message;
        element.dataset.type = type;
    }

    function progress(info) {
        const bar = document.getElementById("aiProgressBar");
        const label = document.getElementById("aiProgressText");

        if (bar) {
            const value = Math.max(
                0,
                Math.min(100, Math.round((info.progress || 0) * 100))
            );

            bar.style.width = `${value}%`;
        }

        if (label) {
            label.textContent =
                info.text || "Modell wird heruntergeladen...";
        }
    }

    // -------------------------------------------------
    // WEBLLM LADEN
    // -------------------------------------------------

    async function loadLibrary() {
        if (state.module) {
            return state.module;
        }

        status("Neue KI-Engine wird geladen...");

        state.module = await import(
            `https://esm.run/@mlc-ai/web-llm@${CONFIG.webLLMVersion}`
        );

        return state.module;
    }

    // -------------------------------------------------
    // MODELL VERFÜGBARKEIT PRÜFEN
    // -------------------------------------------------

    function modelAvailable(modelId) {
        const models =
            state.module?.prebuiltAppConfig?.model_list || [];

        return models.some(model => model.model_id === modelId);
    }

    // -------------------------------------------------
    // MODELL INITIALISIEREN
    // -------------------------------------------------

    async function createModel(modelId) {
        if (!modelAvailable(modelId)) {
            throw new Error(
                `Das Modell ${modelId} ist in dieser WebLLM-Version nicht verfügbar.`
            );
        }

        return await state.module.CreateMLCEngine(
            modelId,
            {
                initProgressCallback: progress
            }
        );
    }

    async function initialize() {
        if (state.ready) {
            return true;
        }

        if (state.loading) {
            return false;
        }

        state.loading = true;

        try {
            // WebGPU überprüfen
            if (!navigator.gpu) {
                throw new Error(
                    "Dein Browser unterstützt WebGPU nicht."
                );
            }

            const adapter = await navigator.gpu.requestAdapter();

            if (!adapter) {
                throw new Error(
                    "Es wurde keine geeignete GPU gefunden."
                );
            }

            await loadLibrary();

            // Zuerst das leistungsstärkere 8B-Modell versuchen
            try {
                status(
                    "Das leistungsstärkere StudySpace-Modell wird geladen..."
                );

                state.engine = await createModel(
                    CONFIG.primaryModel
                );

                state.activeModel = CONFIG.primaryModel;

            } catch (primaryError) {
                console.warn(
                    "Das 8B-Modell konnte nicht gestartet werden:",
                    primaryError
                );

                status(
                    "Das größere Modell funktioniert nicht. " +
                    "Das kleinere Ersatzmodell wird geladen..."
                );

                state.engine = await createModel(
                    CONFIG.fallbackModel
                );

                state.activeModel = CONFIG.fallbackModel;
            }

            state.ready = true;

            status(
                "StudySpace KI ist bereit!",
                "success"
            );

            console.log(
                "StudySpace KI gestartet:",
                state.activeModel
            );

            return true;

        } catch (error) {
            console.error("StudySpace AI:", error);

            state.engine = null;
            state.activeModel = null;
            state.ready = false;

            status(
                "KI konnte nicht gestartet werden: " + error.message,
                "error"
            );

            return false;

        } finally {
            state.loading = false;
        }
    }

    // -------------------------------------------------
    // SYSTEM-PROMPT
    // -------------------------------------------------

    function getSystemPrompt() {
        const subjectSelect =
            document.getElementById("tutorSubject");

        const subject = subjectSelect?.value
            ? subjectSelect.selectedOptions?.[0]?.textContent?.trim()
            : "Allgemein";

        const topic =
            document.getElementById("tutorTopic")?.value ||
            "Allgemein";

        const difficulty =
            document.getElementById("difficulty")?.value ||
            "Mittel";

        const method =
            document.getElementById("learningMethod")?.value ||
            "Erklären";

        const source =
            document.getElementById("learningSource")?.value ||
            "notebook";

        return `
Du bist der StudySpace-Lernassistent.

Fach: ${subject}
Thema: ${topic}
Niveau: ${difficulty}
Lernmethode: ${method}
Quelle: ${source}

Deine Aufgabe ist es, dem Schüler beim tatsächlichen Lernen zu helfen.

Antworte auf Deutsch.
Erkläre fachlich korrekt und nachvollziehbar.
Verwende klare Überschriften und sinnvolle Absätze.
Erkläre schwierige Fachbegriffe.
Nutze Beispiele und zeige Zusammenhänge.
Passe die Erklärungen an die Klassenstufe 10 an.
Unterscheide zwischen Unterrichtsmaterialien und Ergänzungen.
Erfinde keine Fakten.
Beantworte die konkrete Frage vollständig.
`;
    }

    // -------------------------------------------------
    // GESPRÄCHSKONTEXT
    // -------------------------------------------------

    function getConversationMessages() {
        return state.messages
            .slice(-CONFIG.historyMessages)
            .map(message => ({
                role: message.role,
                content: message.content
            }));
    }

    // -------------------------------------------------
    // KI-ANTWORT ERZEUGEN
    // -------------------------------------------------

    async function ask(question) {
        const userQuestion = String(question ?? "").trim();

        if (!userQuestion) {
            return null;
        }

        if (!state.ready) {
            const started = await initialize();

            if (!started) {
                return "Die KI konnte nicht gestartet werden. Bitte prüfe die Fehlermeldung.";
            }
        }

        const newMessage = {
            role: "user",
            content: userQuestion
        };

        state.messages.push(newMessage);

        try {
            const messages = [
                {
                    role: "system",
                    content: getSystemPrompt()
                },
                ...getConversationMessages()
            ];

            const response =
                await state.engine.chat.completions.create({
                    messages,
                    temperature: CONFIG.temperature,
                    max_tokens: CONFIG.maxTokens
                });

            const answer =
                response.choices?.[0]?.message?.content?.trim() ||
                "Die KI hat leider keine Antwort geliefert.";

            state.messages.push({
                role: "assistant",
                content: answer
            });

            return answer;

        } catch (error) {
            console.error("StudySpace Antwortfehler:", error);

            // Fehlgeschlagene Frage aus dem Kontext entfernen
            if (state.messages[state.messages.length - 1] === newMessage) {
                state.messages.pop();
            }

            return (
                "Bei der Erstellung der Antwort ist ein Fehler aufgetreten. " +
                "Bitte versuche es erneut. Details stehen in der Browser-Konsole."
            );
        }
    }

    // -------------------------------------------------
    // GESPRÄCH ZURÜCKSETZEN
    // -------------------------------------------------

    function clear() {
        state.messages = [];
    }

    // -------------------------------------------------
    // KI BEENDEN
    // -------------------------------------------------

    async function stop() {
        if (state.engine) {
            try {
                await state.engine.unload();
            } catch (error) {
                console.warn(
                    "Fehler beim Beenden der KI:",
                    error
                );
            }
        }

        state.engine = null;
        state.activeModel = null;
        state.ready = false;
        state.loading = false;

        status("StudySpace KI wurde beendet.");
    }

    // -------------------------------------------------
    // ÖFFENTLICHE STUDYSPACE-SCHNITTSTELLE
    // -------------------------------------------------

    window.StudySpaceAI = {
        initialize,
        ask,
        clear,
        stop,

        getState: () => ({
            ready: state.ready,
            loading: state.loading,
            model: state.activeModel || CONFIG.primaryModel
        })
    };

    console.log(
        "StudySpace AI Engine 4.0 geladen."
    );

})();




/* ======================================================
   STUDYSPACE – MATERIALTEXTE UND TEXTERKENNUNG 1.1
   TXT + PDF + Bilder (OCR)
====================================================== */

(() => {
    "use strict";

    const DB_NAME = "StudySpaceFilesDB";
    const STORE_NAME = "files";

    let pdfModule = null;
    let ocrModule = null;
    let ocrWorker = null;

    // --------------------------------------------------
    // STATUSANZEIGE
    // --------------------------------------------------

    function setStatus(message) {
        let element = document.getElementById("aiMaterialStatus");

        if (!element) {
            const chat = document.querySelector(".ai-chat-panel");
            const messages = document.getElementById("aiChatMessages");

            if (!chat || !messages) return;

            element = document.createElement("p");
            element.id = "aiMaterialStatus";
            element.className = "muted";

            chat.insertBefore(element, messages);
        }

        element.textContent = message;
        console.log("[StudySpace Materialien]", message);
    }

    // --------------------------------------------------
    // INDEXEDDB
    // --------------------------------------------------

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function getFileRecord(id) {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const request = transaction.objectStore(STORE_NAME).get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);

            transaction.oncomplete = () => db.close();
            transaction.onerror = () => db.close();
        });
    }

    async function saveExtractedText(id, extractedText) {
        const db = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                if (!request.result) {
                    transaction.abort();
                    return;
                }

                store.put({
                    ...request.result,
                    extractedText,
                    extractedAt: new Date().toISOString()
                });
            };

            transaction.oncomplete = () => {
                db.close();
                resolve(true);
            };

            transaction.onerror = () => {
                db.close();
                reject(transaction.error);
            };

            transaction.onabort = () => {
                db.close();
                reject(transaction.error || new Error("Speichern abgebrochen."));
            };
        });
    }

    // --------------------------------------------------
    // TXT-DATEIEN
    // --------------------------------------------------

    async function readTextFile(file) {
        return file.text();
    }

    // --------------------------------------------------
    // PDF-DATEIEN
    // --------------------------------------------------

    async function loadPdfLibrary() {
        if (pdfModule) return pdfModule;

        setStatus("PDF-Leser wird geladen ...");

        pdfModule = await import(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs"
        );

        pdfModule.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

        return pdfModule;
    }

    async function readPdf(file) {
        const pdfjs = await loadPdfLibrary();

        setStatus("PDF wird untersucht ...");

        const buffer = await file.arrayBuffer();

        const pdf = await pdfjs.getDocument({
            data: buffer
        }).promise;

        const pageLimit = Math.min(pdf.numPages, 40);
        const pages = [];

        for (let number = 1; number <= pageLimit; number++) {
            setStatus(
                `PDF: Seite ${number} von ${pageLimit} wird gelesen ...`
            );

            const page = await pdf.getPage(number);
            const content = await page.getTextContent();

            const pageText = content.items
                .map(item => item.str || "")
                .join(" ");

            pages.push(`Seite ${number}:\n${pageText}`);
        }

        let result = pages.join("\n\n");

        if (pdf.numPages > pageLimit) {
            result +=
                `\n\nHinweis: Nur die ersten ${pageLimit} von ${pdf.numPages} Seiten wurden gelesen.`;
        }

        return result;
    }

    // --------------------------------------------------
    // BILDER – OCR
    // --------------------------------------------------

    async function loadOcrLibrary() {
        if (ocrModule) return ocrModule;

        setStatus("OCR-Bibliothek wird geladen ...");

        ocrModule = await import(
            "https://esm.sh/tesseract.js@5"
        );

        return ocrModule;
    }

    async function getOcrWorker() {
        if (ocrWorker) return ocrWorker;

        const tesseract = await loadOcrLibrary();

        setStatus("Deutsche Texterkennung wird vorbereitet ...");

        ocrWorker = await tesseract.createWorker(
            "deu+eng",
            1,
            {
                workerPath:
                    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",

                corePath:
                    "https://cdn.jsdelivr.net/npm/tesseract.js-core@5",

                langPath:
                    "https://tessdata.projectnaptha.com/4.0.0",

                logger: info => {
                    if (info.status === "recognizing text") {
                        const percent = Math.round(
                            (info.progress || 0) * 100
                        );

                        setStatus(`Foto wird erkannt: ${percent} %`);
                    }
                }
            }
        );

        return ocrWorker;
    }

    async function readImage(file) {
        const worker = await getOcrWorker();

        setStatus("Text auf dem Foto wird erkannt ...");

        const result = await worker.recognize(file);

        return result.data.text || "";
    }

    // --------------------------------------------------
    // MATERIAL AUSLESEN
    // --------------------------------------------------

    async function extractMaterialText(materialId) {
        const material = data.materials.find(
            item => item.id === materialId
        );

        if (!material) {
            throw new Error("Material wurde nicht gefunden.");
        }

        const record = await getFileRecord(materialId);

        if (!record || !record.file) {
            throw new Error("Originaldatei wurde nicht gefunden.");
        }

        if (record.extractedText) {
            return record.extractedText;
        }

        const file = record.file;

        const fileName = (material.fileName || "").toLowerCase();
        const fileType = (
            file.type || material.fileType || ""
        ).toLowerCase();

        let extractedText = "";

        if (
            fileType.startsWith("text/") ||
            /\.(txt|md|csv|json)$/i.test(fileName)
        ) {
            extractedText = await readTextFile(file);

        } else if (
            fileType === "application/pdf" ||
            fileName.endsWith(".pdf")
        ) {
            extractedText = await readPdf(file);

        } else if (fileType.startsWith("image/")) {
            extractedText = await readImage(file);

        } else {
            throw new Error(
                "Dieser Dateityp wird noch nicht unterstützt."
            );
        }

        extractedText = extractedText.trim();

        if (!extractedText) {
            throw new Error(
                "Es wurde kein Text erkannt. Möglicherweise ist das PDF ein Scan."
            );
        }

        await saveExtractedText(materialId, extractedText);

        return extractedText;
    }

    // --------------------------------------------------
    // PASSENDE MATERIALIEN FINDEN
    // --------------------------------------------------

    async function getRelevantMaterialContext() {
        const subjectId =
            document.getElementById("tutorSubject")?.value || "";

        const topic = (
            document.getElementById("tutorTopic")?.value || ""
        ).trim().toLowerCase();

        const selectedMaterials =
    window.StudySpaceTutorSettings?.selectedMaterials || [];

let materials = (data.materials || []).filter(material => {
    const matchesSubject =
        !subjectId || material.subjectId === subjectId;

    const matchesSelection =
        selectedMaterials.length === 0 ||
        selectedMaterials.includes(material.id);

    return matchesSubject && matchesSelection;
});

        if (topic) {
            const matching = materials.filter(material => {
                const searchable = [
                    material.name,
                    material.topic,
                    material.subtopic,
                    material.description
                ].join(" ").toLowerCase();

                return searchable.includes(topic);
            });

            if (matching.length) {
                materials = matching;
            }
        }

        materials = materials.slice(0, 5);

        if (!materials.length) {
            return {
                text: "",
                count: 0,
                note: "Keine passenden Materialien gefunden."
            };
        }

        const sections = [];
        let successfulCount = 0;

        for (let index = 0; index < materials.length; index++) {
            const material = materials[index];

            try {
                setStatus(
                    `Lese Material ${index + 1} von ${materials.length}: ${material.name}`
                );

                const text = await extractMaterialText(material.id);

                sections.push(
                    `MATERIAL: ${material.name}\n` +
                    `THEMA: ${material.topic || "Nicht angegeben"}\n` +
                    `UNTERTHEMA: ${material.subtopic || "Nicht angegeben"}\n` +
                    `INHALT:\n${text.slice(0, 4000)}`
                );

                successfulCount++;

            } catch (error) {
                console.error(
                    "Material konnte nicht gelesen werden:",
                    material.name,
                    error
                );
            }
        }

        return {
            text: sections.join("\n\n--------------------\n\n").slice(0, 9000),
            count: successfulCount,
            note: `${successfulCount} von ${materials.length} Materialien erfolgreich gelesen.`
        };
    }

    // --------------------------------------------------
    // KI MIT MATERIALIEN VERBINDEN
    // --------------------------------------------------

    function connectMaterialsToAI() {
        if (!window.StudySpaceAI) return;

        if (window.StudySpaceAI.materialsConnected) return;

        const originalAsk = window.StudySpaceAI.ask.bind(
            window.StudySpaceAI
        );

        window.StudySpaceAI.ask = async function(question) {
            const source =
                document.getElementById("learningSource")?.value || "notebook";

            if (source === "general") {
                setStatus("Der Tutor verwendet allgemeines Wissen.");
                return originalAsk(question);
            }

            setStatus("Passende Lernmaterialien werden gesucht ...");

            let context;

            try {
                context = await getRelevantMaterialContext();
            } catch (error) {
                console.error(error);

                context = {
                    text: "",
                    count: 0,
                    note: "Materialien konnten nicht gelesen werden."
                };
            }

            let instruction;

            if (source === "notebook") {
                instruction =
                    "Der Nutzer hat ausschließlich seinen Hefter als Quelle gewählt. " +
                    "Verwende nur die bereitgestellten Unterrichtsmaterialien. " +
                    "Wenn die Antwort dort nicht enthalten ist, sage ausdrücklich, " +
                    "dass die Materialien keine ausreichende Information enthalten. " +
                    "Ergänze keine Fakten aus deinem Allgemeinwissen.";
            } else {
                instruction =
                    "Der Nutzer hat Hefter und allgemeines Wissen als Quelle gewählt. " +
                    "Nutze zuerst die bereitgestellten Unterrichtsmaterialien. " +
                    "Kennzeichne zusätzliche Informationen aus deinem Allgemeinwissen deutlich.";
            }

            const materialText = context.text ||
                "Es konnten keine passenden Unterrichtsmaterialien ausgelesen werden.";

            const enhancedQuestion =
                instruction +
                "\n\nUNTERRICHTSMATERIALIEN:\n" +
                materialText +
                "\n\nFRAGE:\n" +
                question;

            setStatus(context.note);

            return originalAsk(enhancedQuestion);
        };

        window.StudySpaceAI.materialsConnected = true;

        console.log("StudySpace: Materialien mit KI verbunden.");
    }

    connectMaterialsToAI();

    // --------------------------------------------------
    // ÖFFENTLICHE FUNKTIONEN
    // --------------------------------------------------

    window.StudySpaceMaterialsAI = {
        extractMaterialText,
        getRelevantMaterialContext,

        clearOcrWorker: async () => {
            if (ocrWorker) {
                await ocrWorker.terminate();
                ocrWorker = null;
            }
        }
    };

    console.log("StudySpace Material-Texterkennung 1.1 geladen.");
})();


/* =========================================
   STUDYSPACE KI-CHAT VERBINDUNG 7.0
   Automatischer KI-Start beim Senden
========================================= */

(() => {
    "use strict";

    function connectTutorChat() {
        const form = document.getElementById("aiChatForm");
        const input = document.getElementById("aiChatInput");
        const sendButton = document.getElementById("aiSendButton");
        const messages = document.getElementById("aiChatMessages");
        const clearButton = document.getElementById("aiClearButton");
        const startButton = document.getElementById("aiStartButton");
        const stopButton = document.getElementById("aiStopButton");
        const status = document.getElementById("aiEngineStatus");

        if (!form || !input || !sendButton || !messages) {
            console.error("StudySpace: Chat-Elemente nicht gefunden.");
            return;
        }

        function setStatus(message) {
            if (status) status.textContent = message;
        }

        function addMessage(text, role) {
            const element = document.createElement("div");
            element.className = `ai-message ${role}`;
            element.textContent = text;
            messages.appendChild(element);
            messages.scrollTop = messages.scrollHeight;
        }

        // Manueller Start, falls ein Start-Button vorhanden ist
        startButton?.addEventListener("click", async () => {
            startButton.disabled = true;
            setStatus("KI-Modell wird geladen...");

            try {
                const ready = await window.StudySpaceAI.initialize();
                setStatus(
                    ready
                        ? "StudySpace KI ist bereit!"
                        : "KI konnte nicht gestartet werden."
                );
            } catch (error) {
                console.error(error);
                setStatus("Fehler: " + error.message);
            }

            startButton.disabled = false;
        });

        // KI beenden
        stopButton?.addEventListener("click", async () => {
            stopButton.disabled = true;

            try {
                await window.StudySpaceAI.stop();
                setStatus("KI wurde beendet.");
            } catch (error) {
                console.error(error);
                setStatus("Fehler beim Beenden.");
            }

            stopButton.disabled = false;
        });

        // Nachricht senden und KI bei Bedarf automatisch starten
        form.addEventListener("submit", async event => {
            event.preventDefault();

            const question = input.value.trim();

            if (!question || sendButton.disabled) return;

            if (!window.StudySpaceAI) {
                addMessage("Die KI-Engine wurde nicht geladen.", "assistant");
                return;
            }

            input.value = "";
            addMessage(question, "user");

            sendButton.disabled = true;
            sendButton.textContent = "KI arbeitet...";

            try {
                setStatus("KI wird gestartet bzw. deine Frage bearbeitet...");

                const answer = await window.StudySpaceAI.ask(question);

                addMessage(
                    answer || "Die KI hat keine Antwort geliefert.",
                    "assistant"
                );

                setStatus("StudySpace KI ist bereit.");

            } catch (error) {
                console.error("StudySpace Chat:", error);
                addMessage("Fehler: " + error.message, "assistant");
                setStatus("Fehler bei der KI-Verbindung.");
            }

            sendButton.disabled = false;
            sendButton.textContent = "Senden";
            input.focus();
        });

        // Chat leeren
        clearButton?.addEventListener("click", () => {
            window.StudySpaceAI?.clear();
            messages.replaceChildren();
            addMessage("Chat geleert. Was möchtest du lernen?", "assistant");
        });

        console.log("StudySpace KI-Chat 7.0 erfolgreich verbunden.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", connectTutorChat, {
            once: true
        });
    } else {
        connectTutorChat();
    }
})();

/* ==========================================
   STUDYSPACE – KI TUTOR VERBESSERUNG 1.0
   Diesen Code ganz unten in script.js einfügen
========================================== */

(function improveStudySpaceTutor() {
    const ai = window.StudySpaceAI;

    if (!ai || typeof ai.ask !== "function") {
        console.warn(
            "StudySpace KI: Verbesserung konnte nicht aktiviert werden. " +
            "Die KI wurde nicht gefunden."
        );
        return;
    }

    // Verhindert, dass die Verbesserung mehrfach aktiviert wird.
    if (ai.__teachingImprovementApplied) {
        return;
    }

    const originalAsk = ai.ask;

    ai.ask = async function (question, ...args) {
        const teachingInstructions = `

WICHTIGE ANWEISUNGEN FÜR DEIN VERHALTEN ALS LERNASSISTENT:

Deine wichtigste Aufgabe ist es, dem Schüler den Lernstoff wirklich beizubringen.

UMGANG MIT HEFTERNOTIZEN:
- Die bereitgestellten Materialien können Fotos, handschriftliche Notizen,
  Stichpunkte, Abkürzungen oder unvollständige Sätze enthalten.
- Bewerte die Notizen nicht vorschnell als unzureichend.
- Versuche zuerst zu erkennen, welche Inhalte, Fachbegriffe und Zusammenhänge
  in den Materialien behandelt werden.
- Verbinde zusammengehörige Informationen und ordne sie sinnvoll.
- Erkläre auch kurze oder unvollständige Notizen so, dass der Schüler sie
  tatsächlich verstehen und lernen kann.
- Wenn ein Begriff oder Zusammenhang nicht vollständig erklärt wird,
  ergänze die notwendigen Grundlagen aus deinem Fachwissen.
- Kennzeichne solche Ergänzungen ausdrücklich mit
  "Ergänzung zum Verständnis".
- Behaupte niemals, dass eine Ergänzung tatsächlich im Hefter steht.
- Wenn eine Stelle durch schlechte Bildqualität nicht lesbar ist,
  benenne genau diese Stelle. Verwirf deshalb nicht den gesamten Inhalt.

ERKLÄREN STATT NUR ZUSAMMENFASSEN:
- Erkläre Fachbegriffe in verständlicher Sprache.
- Zeige, wie einzelne Inhalte miteinander zusammenhängen.
- Verwende passende Beispiele aus dem Alltag.
- Erkläre bei Formeln auch, was die einzelnen Größen bedeuten.
- Zeige bei Rechenaufgaben den Lösungsweg Schritt für Schritt.
- Erkläre nicht nur, WAS richtig ist, sondern auch WARUM.
- Gehe davon aus, dass der Schüler den Stoff noch nicht vollständig verstanden hat.

AUFBAU EINER GUTEN LERNERKLÄRUNG:
1. Worum geht es in diesem Thema?
2. Welche wichtigen Begriffe und Regeln muss man kennen?
3. Wie hängen die Inhalte zusammen?
4. Wie funktioniert das Ganze an einem konkreten Beispiel?
5. Was muss man sich für eine Klassenarbeit merken?

UNTERRICHTSNIVEAU:
- Passe deine Erklärungen an die 10. Klasse eines Gymnasiums an.
- Verwende verständliche, aber fachlich korrekte Sprache.
- Erkläre schwierige Dinge lieber etwas ausführlicher.
- Schreibe übersichtlich mit sinnvollen Überschriften.
- Vermeide unnötig komplizierte Formulierungen.
- Überfordere den Schüler nicht mit zu vielen Informationen auf einmal.

DEIN VERHALTEN:
- Sage nicht ständig, dass die Materialien nicht ausreichen.
- Nutze alle erkennbaren Informationen, die dir zur Verfügung stehen.
- Stelle gezielte Rückfragen, wenn eine wichtige Information tatsächlich fehlt.
- Erstelle auf Wunsch einen vollständigen Lernzettel aus den vorhandenen Notizen.
- Hilf dem Schüler dabei, den Stoff zu verstehen und nicht nur auswendig zu lernen.

WICHTIG:
Eine gute Antwort soll dem Schüler beim Lernen helfen.
Eine bloße Aussage darüber, dass die Notizen unvollständig sind, ist keine
ausreichende Antwort, solange du noch sinnvolle Inhalte erklären kannst.
`;

        const enhancedQuestion =
            String(question) + "\n\n" + teachingInstructions;

        return originalAsk.call(this, enhancedQuestion, ...args);
    };

    ai.__teachingImprovementApplied = true;

    console.log(
        "StudySpace KI: Verbesserte Lern- und Erklärungsmethode aktiviert."
    );
})();


/* =========================================================
   STUDYSPACE – ADVANCED AI TUTOR 2.0
   Verbesserte Erklärungen, Lernübersichten und Lernmethoden
   Ganz unten in script.js einfügen
========================================================= */

(function StudySpaceAdvancedTutor() {

    const ai = window.StudySpaceAI;

    if (!ai || typeof ai.ask !== "function") {
        console.warn("StudySpace Advanced Tutor: KI nicht gefunden.");
        return;
    }

    if (ai.__advancedTutorV2) {
        return;
    }

    // Bisherige KI-Funktion sichern
    const previousAsk = ai.ask;

    // -----------------------------------------------------
    // 1. ERKENNUNG DER LERNABSICHT
    // -----------------------------------------------------

    function detectLearningMode(question) {
        const q = question.toLowerCase();

        if (
            /lernübersicht|lernzettel|zusammenfassung|lernzusammenfassung|überblick|prüfungsübersicht|themenübersicht/.test(q)
        ) {
            return "overview";
        }

        if (
            /karteikarten|lernkarten|flashcards/.test(q)
        ) {
            return "flashcards";
        }

        if (
            /quiz|teste mich|abfragen|prüfe mich|wissensabfrage/.test(q)
        ) {
            return "quiz";
        }

        if (
            /übungsaufgaben|aufgaben erstellen|aufgaben zum üben|trainieren/.test(q)
        ) {
            return "practice";
        }

        if (
            /rechne|berechne|löse|lösungsweg|aufgabe lösen/.test(q)
        ) {
            return "problem";
        }

        return "explain";
    }

    // -----------------------------------------------------
    // 2. GRUNDLEGENDE INTELLIGENZ- UND QUALITÄTSREGELN
    // -----------------------------------------------------

    const coreInstructions = `

DU BIST DER FACHLICH STARKE UND PÄDAGOGISCH ANSPRUCHSVOLLE
LERNASSISTENT VON STUDYSPACE.

DEIN ZIEL:
Du sollst dem Schüler nicht einfach Antworten geben.
Du sollst ihm helfen, Inhalte wirklich zu verstehen,
Zusammenhänge zu erkennen und gute schulische Leistungen zu erreichen.

FACHLICHE QUALITÄT:
- Antworte fachlich korrekt und präzise.
- Unterscheide zwischen gesicherten Fakten und Vermutungen.
- Erfinde keine Inhalte und keine Formeln.
- Prüfe, ob deine Beispiele und Rechenwege fachlich stimmen.
- Erkläre wichtige Zusammenhänge, nicht nur einzelne Fakten.
- Vermeide unnötige Wiederholungen.
- Beantworte die eigentliche Frage direkt.

UMGANG MIT DEM HEFTER:
- Nutze alle verfügbaren Unterrichtsmaterialien.
- Fotos können handschriftliche Notizen und Stichpunkte enthalten.
- Rekonstruiere vorsichtig den Sinn kurzer oder unvollständiger Notizen.
- Verbinde Informationen, die offensichtlich zusammengehören.
- Behandle Stichpunkte nicht so, als wären sie unbrauchbar.
- Ergänze fehlende Grundlagen, wenn sie zum Verständnis notwendig sind.
- Kennzeichne zusätzliche Erklärungen mit "Ergänzung zum Verständnis".
- Gib niemals vor, dass eine Ergänzung im Hefter steht.
- Wenn eine Information nicht lesbar ist, rate nicht einfach.
- Erkläre trotzdem alle anderen erkennbaren Inhalte.

QUELLENTRENNUNG:
Unterscheide sauber zwischen:
1. Informationen aus den Unterrichtsmaterialien.
2. Ergänzungen aus deinem Fachwissen.
3. Informationen, die du nicht sicher erkennen kannst.

Wenn der Schüler ausschließlich mit seinem Hefter lernen möchte,
bleiben die Unterrichtsmaterialien die maßgebliche Grundlage.
Notwendige Grundlagen darfst du trotzdem als Ergänzung erklären.

PÄDAGOGIK:
- Erkläre auf dem Niveau der 10. Klasse eines Gymnasiums.
- Beginne bei den Grundlagen, wenn das Verständnis fehlt.
- Verwende einfache Sprache, aber die richtigen Fachbegriffe.
- Erkläre Fachbegriffe unmittelbar.
- Verwende konkrete und passende Beispiele.
- Zeige Ursache und Wirkung.
- Erkläre, warum etwas funktioniert.
- Zerlege komplizierte Zusammenhänge in verständliche Schritte.
- Setze Wissen sinnvoll mit bereits erklärten Inhalten in Beziehung.

GUTE ANTWORTEN:
- Verwende klare Überschriften.
- Verwende kurze, verständliche Absätze.
- Nutze Aufzählungen für wichtige Informationen.
- Verwende Tabellen nur, wenn sie wirklich beim Lernen helfen.
- Hebe zentrale Begriffe, Regeln und Formeln hervor.
- Schreibe nicht unnötig kompliziert.
- Erstelle keine riesigen Textblöcke.

QUALITÄTSKONTROLLE:
Prüfe vor deiner Antwort:
1. Habe ich die Frage vollständig beantwortet?
2. Sind die Fachinformationen korrekt?
3. Sind die Zusammenhänge verständlich erklärt?
4. Habe ich wichtige Informationen aus dem Hefter berücksichtigt?
5. Sind Ergänzungen eindeutig gekennzeichnet?
6. Kann ein Schüler der 10. Klasse damit tatsächlich lernen?

Gib keine bloßen Aussagen wie "Die Materialien reichen nicht aus",
solange du noch sinnvolle Inhalte erklären kannst.
`;

    // -----------------------------------------------------
    // 3. SPEZIELLE ANWEISUNGEN FÜR LERNÜBERSICHTEN
    // -----------------------------------------------------

    const overviewInstructions = `

SPEZIALMODUS: ERSTELLE EINE HOCHWERTIGE LERNÜBERSICHT.

Wenn der Schüler eine Lernübersicht, einen Lernzettel oder eine
Zusammenfassung verlangt, erstellst du ein richtiges Lernmaterial
und nicht einfach eine kurze Zusammenfassung.

DIE LERNÜBERSICHT SOLL FOLGENDES ENTHALTEN,
SOWEIT ES ZUM THEMA PASST:

1. THEMA UND EINORDNUNG
- Nenne das Thema.
- Erkläre kurz, worum es insgesamt geht.
- Zeige, welche Teilthemen dazugehören.

2. WICHTIGE FACHBEGRIFFE
- Sammle die zentralen Fachbegriffe.
- Erkläre jeden Begriff verständlich und präzise.
- Vermeide unklare oder zu kurze Definitionen.

3. AUSFÜHRLICHE ERKLÄRUNG
- Erkläre die einzelnen Teilthemen systematisch.
- Zeige Zusammenhänge zwischen den Inhalten.
- Erkläre wichtige Abläufe und Ursachen.
- Gehe von den Grundlagen zu schwierigeren Inhalten.
- Lass keine wesentlichen Informationen aus den Materialien weg.

4. REGELN UND FORMELN
Bei mathematischen und naturwissenschaftlichen Themen:
- Schreibe wichtige Formeln korrekt auf.
- Erkläre jede Variable.
- Nenne passende Einheiten.
- Erkläre, wann eine Formel verwendet wird.
- Zeige bei Bedarf das Umstellen der Formel.
- Führe einen nachvollziehbaren Beispielrechenweg vor.

5. BEISPIELE
- Verwende passende Beispiele.
- Erkläre, wie man das Wissen anwendet.
- Nutze Beispiele, die für die Klassenstufe verständlich sind.

6. VERGLEICHE UND ZUSAMMENHÄNGE
- Stelle wichtige Unterschiede gegenüber.
- Erkläre Gemeinsamkeiten.
- Zeige, welche Inhalte miteinander verbunden sind.

7. TYPISCHE FEHLER
- Nenne häufige Denkfehler.
- Erkläre, worauf man besonders achten muss.
- Zeige gegebenenfalls den Unterschied zwischen einer richtigen
  und einer falschen Vorgehensweise.

8. DAS MUSS ICH KÖNNEN
Erstelle eine kompakte Übersicht mit den wichtigsten Lernzielen:
- Was muss ich wissen?
- Was muss ich erklären können?
- Was muss ich anwenden oder berechnen können?

9. MERKSÄTZE
Fasse besonders wichtige Regeln und Zusammenhänge in
einprägsamen Sätzen zusammen.

10. KURZER WISSENSTEST
Erstelle am Ende einige passende Verständnisfragen.
Die Fragen sollen prüfen, ob der Schüler den Stoff verstanden hat.

WICHTIGE REGELN FÜR DIE LERNÜBERSICHT:
- Die Übersicht muss inhaltlich vollständig und sinnvoll geordnet sein.
- Verwende keine unnötigen Fülltexte.
- Kürze nicht so stark, dass wichtige Erklärungen fehlen.
- Schreibe nicht einfach die Notizen um.
- Mache aus den Notizen ein verständliches Lernmaterial.
- Erfinde keine Inhalte, nur um die Übersicht länger zu machen.
- Kennzeichne notwendige Ergänzungen aus deinem Fachwissen.
- Verwende passende Unterüberschriften.
- Gestalte das Ergebnis so, dass man direkt damit für eine Klassenarbeit
  lernen kann.

Wenn mehrere Themen in den Materialien vorkommen,
behandle sie geordnet und stelle ihre Zusammenhänge dar.
`;

    // -----------------------------------------------------
    // 4. SPEZIELLE ANWEISUNGEN FÜR ERKLÄRUNGEN
    // -----------------------------------------------------

    const explainInstructions = `

SPEZIALMODUS: ERKLÄREN UND VERSTEHEN.

Wenn der Schüler eine Erklärung verlangt:
- Beginne mit einer einfachen Antwort auf seine Frage.
- Erkläre anschließend den Hintergrund.
- Definiere die notwendigen Fachbegriffe.
- Zeige den Zusammenhang mit einem passenden Beispiel.
- Gehe davon aus, dass der Schüler das Thema möglicherweise
  noch nicht vollständig verstanden hat.
- Überspringe keine wichtigen Zwischenschritte.
- Stelle am Ende höchstens eine kurze Verständnisfrage,
  wenn sie sinnvoll ist.

Vermeide es, eine einfache Frage unnötig kompliziert zu beantworten.
Bei schwierigen Themen darfst du ausführlicher werden.
`;

    // -----------------------------------------------------
    // 5. SPEZIELLE ANWEISUNGEN FÜR RECHENAUFGABEN
    // -----------------------------------------------------

    const problemInstructions = `

SPEZIALMODUS: MATHEMATISCHE UND NATURWISSENSCHAFTLICHE AUFGABEN.

Löse Aufgaben nachvollziehbar und nicht nur mit dem Endergebnis.

Verwende, wenn passend, diesen Aufbau:

1. GEGEBEN:
Welche Werte und Informationen sind bekannt?

2. GESUCHT:
Was soll berechnet oder bestimmt werden?

3. FORMEL:
Welche Formel passt und warum?

4. UMSTELLEN:
Muss die Formel umgestellt werden?
Zeige die Umstellung verständlich.

5. EINSETZEN:
Setze die bekannten Werte ein.

6. RECHNEN:
Zeige die Rechenschritte übersichtlich.

7. ERGEBNIS:
Nenne das Ergebnis mit der richtigen Einheit.

8. KONTROLLE:
Prüfe, ob das Ergebnis sinnvoll ist.

Wenn ein anderer Lösungsweg einfacher oder verständlicher ist,
darfst du ihn ebenfalls verwenden.
`;

    // -----------------------------------------------------
    // 6. SPEZIELLE ANWEISUNGEN FÜR ABFRAGEN
    // -----------------------------------------------------

    const quizInstructions = `

SPEZIALMODUS: AKTIVES LERNEN.

Wenn der Schüler abgefragt werden möchte:
- Stelle zunächst nur eine Frage.
- Warte auf seine Antwort.
- Bewerte die Antwort fachlich.
- Erkläre Fehler verständlich.
- Gib bei einer richtigen Antwort eine kurze Begründung.
- Passe die Schwierigkeit schrittweise an.
- Wiederhole Inhalte, die noch nicht sicher sitzen.
- Verrate nicht direkt die Lösung, bevor der Schüler antwortet.

Arbeite wie ein guter Lehrer in einer mündlichen Prüfung.
`;

    // -----------------------------------------------------
    // 7. SPEZIELLE ANWEISUNGEN FÜR KARTEIKARTEN
    // -----------------------------------------------------

    const flashcardInstructions = `

SPEZIALMODUS: KARTEIKARTEN.

Erstelle sinnvolle Karteikarten aus den Unterrichtsmaterialien.

Jede Karte soll enthalten:
VORDERSEITE:
Eine klare Frage oder einen Begriff.

RÜCKSEITE:
Eine präzise, verständliche Antwort.

Regeln:
- Eine Karte soll möglichst nur einen Lerninhalt enthalten.
- Frage nicht nur Definitionen, sondern auch Zusammenhänge ab.
- Berücksichtige Formeln, Regeln und wichtige Beispiele.
- Vermeide doppelte Karten.
- Verwende keine unnötig langen Antworten.
- Decke alle wichtigen Inhalte ab.
`;

    // -----------------------------------------------------
    // 8. SPEZIELLE ANWEISUNGEN FÜR ÜBUNGSAUFGABEN
    // -----------------------------------------------------

    const practiceInstructions = `

SPEZIALMODUS: ÜBUNGSAUFGABEN.

Erstelle passende Aufgaben zum aktuellen Lernstoff.

Achte auf:
- Unterschiedliche Schwierigkeitsgrade.
- Aufgaben, die Grundlagen abfragen.
- Aufgaben, die Verständnis prüfen.
- Aufgaben, die Wissen anwenden lassen.
- Anspruchsvollere Transferaufgaben, wenn passend.

Gib die Lösungen zunächst getrennt von den Aufgaben aus,
damit der Schüler selbst üben kann.

Die Aufgaben müssen fachlich korrekt und für die 10. Klasse
angemessen sein.
`;

    // -----------------------------------------------------
    // 9. NEUE ASK-FUNKTION
    // -----------------------------------------------------

    ai.ask = async function (question, ...args) {

        const originalQuestion = String(question ?? "");

        const mode = detectLearningMode(originalQuestion);

        let modeInstructions = explainInstructions;

        switch (mode) {
            case "overview":
                modeInstructions = overviewInstructions;
                break;

            case "problem":
                modeInstructions = problemInstructions;
                break;

            case "quiz":
                modeInstructions = quizInstructions;
                break;

            case "flashcards":
                modeInstructions = flashcardInstructions;
                break;

            case "practice":
                modeInstructions = practiceInstructions;
                break;
        }

        const enhancedQuestion = `
${originalQuestion}

${coreInstructions}

${modeInstructions}

LETZTE WICHTIGE ANWEISUNG:
Beantworte die konkrete Anfrage des Schülers.
Halte dich an den erkannten Lernmodus.
Arbeite fachlich sorgfältig und pädagogisch sinnvoll.
`;

        return previousAsk.call(this, enhancedQuestion, ...args);
    };

    ai.__advancedTutorV2 = true;

    console.log(
        "StudySpace Advanced Tutor 2.0 aktiviert."
    );

})();