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
 const container=document.getElementById("materialList");
 if(!container)return;
 if(!data.materials.length){container.innerHTML='<div class="panel empty-state">Noch keine Materialien vorhanden.</div>';return;}
 const ids=[...new Set(data.materials.map(x=>x.subjectId||""))];
 ids.forEach(subjectId=>{
  const group=data.materials.filter(x=>(x.subjectId||"")===subjectId)
   .sort((a,b)=>(Number.isFinite(a.materialOrder)?a.materialOrder:Infinity)-(Number.isFinite(b.materialOrder)?b.materialOrder:Infinity));
  group.forEach((x,i)=>x.materialOrder=i);
 });
 const sorted=[...data.materials].sort((a,b)=>{
  const ai=data.subjects.findIndex(x=>x.id===a.subjectId),bi=data.subjects.findIndex(x=>x.id===b.subjectId);
  return ai===bi?(a.materialOrder??0)-(b.materialOrder??0):ai-bi;
 });
 container.innerHTML=sorted.map(item=>{
  const subject=data.subjects.find(x=>x.id===item.subjectId);
  const group=sorted.filter(x=>x.subjectId===item.subjectId),index=group.findIndex(x=>x.id===item.id);
  const label=item.name||item.fileName||"Material",ext=(item.fileName||"").split(".").pop().toUpperCase();
  return `<div class="material-item material-library-item" data-material-row="${escapeHTML(item.id)}" draggable="true">
   <button type="button" class="material-touch-grip" data-material-grip="${escapeHTML(item.id)}" aria-label="Material verschieben" title="Gedrückt halten und ziehen" style="display:flex!important;visibility:visible!important;align-items:center!important;justify-content:center!important;flex:0 0 48px!important;width:48px!important;height:52px!important;border:2px solid #70b5ff!important;border-radius:10px!important;background:#203b5d!important;color:white!important;font-size:24px!important;touch-action:none!important;user-select:none!important">⠿</button>
   <div class="material-library-title"><strong>${escapeHTML(label)}</strong><p>${escapeHTML(subject?.name||"Kein Fach")} · ${escapeHTML(ext||"DATEI")} · ${escapeHTML(item.fileName||"")}</p></div>
   <div class="material-library-actions">
    <button type="button" data-material-up="${escapeHTML(item.id)}" ${index===0?"disabled":""} aria-label="Material nach oben verschieben" style="display:inline-flex!important;visibility:visible!important;opacity:1!important;min-width:92px;min-height:44px;padding:10px 12px;border:2px solid #69a7ff;border-radius:9px;background:#203b5d;color:#fff;font-size:15px;font-weight:700;align-items:center;justify-content:center;touch-action:manipulation">↑ Nach oben</button>
    <button type="button" data-material-down="${escapeHTML(item.id)}" ${index===group.length-1?"disabled":""} aria-label="Material nach unten verschieben" style="display:inline-flex!important;visibility:visible!important;opacity:1!important;min-width:92px;min-height:44px;padding:10px 12px;border:2px solid #69a7ff;border-radius:9px;background:#203b5d;color:#fff;font-size:15px;font-weight:700;align-items:center;justify-content:center;touch-action:manipulation">↓ Nach unten</button>
    <label style="display:inline-flex;align-items:center;gap:6px;color:inherit;font-size:13px">Position
      <select data-material-position="${escapeHTML(item.id)}" aria-label="Position von ${escapeHTML(label)}" style="min-height:42px;min-width:64px;padding:6px;border-radius:8px">
       ${group.map((entry,i)=>`<option value="${i}" ${i===index?"selected":""}>${i+1}</option>`).join("")}
      </select>
    </label>
    <button type="button" class="small-button" data-material-rename="${escapeHTML(item.id)}">✎ Name</button>
    <button type="button" class="small-button material-open-button" data-material-open="${escapeHTML(item.id)}">Öffnen</button>
    <button type="button" class="small-button delete" data-material-delete="${escapeHTML(item.id)}">Entfernen</button>
   </div></div>`;
 }).join("");

 container.onchange=event=>{
  const select=event.target.closest("[data-material-position]");
  if(!select||!container.contains(select))return;
  const id=select.dataset.materialPosition;
  const item=data.materials.find(x=>x.id===id);
  if(!item)return;
  const group=orderedMaterials(item.subjectId);
  const from=group.findIndex(x=>x.id===id);
  const to=Number(select.value);
  if(from<0||!Number.isInteger(to)||to<0||to>=group.length)return;
  const [moved]=group.splice(from,1);
  group.splice(to,0,moved);
  saveMaterialOrder(group);
  renderMaterials();
 };

 // Touch-Reordering: Griff gedrückt halten, über ein anderes Material ziehen, loslassen.
 let touchDrag=null;
 container.querySelectorAll("[data-material-grip]").forEach(grip=>{
  grip.addEventListener("pointerdown",event=>{
   if(event.pointerType==="mouse"&&event.button!==0)return;
   const row=grip.closest("[data-material-row]");if(!row)return;
   event.preventDefault();
   touchDrag={id:grip.dataset.materialGrip,subjectId:data.materials.find(x=>String(x.id)===String(grip.dataset.materialGrip))?.subjectId};
   grip.setPointerCapture?.(event.pointerId);
   row.classList.add("material-touch-dragging");
   row.style.opacity=".55";
  });
  grip.addEventListener("pointermove",event=>{
   if(!touchDrag)return;
   event.preventDefault();
   const target=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-material-row]");
   container.querySelectorAll(".material-touch-over").forEach(el=>el.classList.remove("material-touch-over"));
   if(target&&target.dataset.materialRow!==String(touchDrag.id)){
    const targetItem=data.materials.find(x=>String(x.id)===String(target.dataset.materialRow));
    if(targetItem&&String(targetItem.subjectId)===String(touchDrag.subjectId))target.classList.add("material-touch-over");
   }
  });
  const finish=event=>{
   if(!touchDrag)return;
   const moving=touchDrag;touchDrag=null;
   const row=grip.closest("[data-material-row]");
   const target=document.elementFromPoint(event.clientX,event.clientY)?.closest("[data-material-row]");
   if(row){row.classList.remove("material-touch-dragging");row.style.opacity="";}
   container.querySelectorAll(".material-touch-over").forEach(el=>el.classList.remove("material-touch-over"));
   if(target&&target.dataset.materialRow!==String(moving.id)){
    reorderMaterialBefore(String(moving.id),String(target.dataset.materialRow));
   }
  };
  grip.addEventListener("pointerup",finish);
  grip.addEventListener("pointercancel",()=>{
   touchDrag=null;
   const row=grip.closest("[data-material-row]");
   if(row){row.classList.remove("material-touch-dragging");row.style.opacity="";}
   container.querySelectorAll(".material-touch-over").forEach(el=>el.classList.remove("material-touch-over"));
  });
 });

 container.onclick=event=>{
  const b=event.target.closest("button");if(!b||!container.contains(b))return;
  const id=b.dataset.materialUp||b.dataset.materialDown||b.dataset.materialRename||b.dataset.materialOpen||b.dataset.materialDelete;
  if(!id)return;
  if(b.hasAttribute("data-material-open")){event.preventDefault();window.dispatchEvent(new CustomEvent("studyspace:open-material",{detail:{id}}));return;}
  if(b.hasAttribute("data-material-rename")){
   const item=data.materials.find(x=>x.id===id);if(!item)return;
   const value=prompt("Neuer Name für dieses Material:",item.name||item.fileName||"");
   if(value===null)return;if(!value.trim()){alert("Bitte gib einen Namen ein.");return;}
   item.name=value.trim();saveData();renderMaterials();return;
  }
  if(b.hasAttribute("data-material-delete")){data.materials=data.materials.filter(x=>x.id!==id);saveData();renderAll();return;}
  moveMaterialInList(id,b.hasAttribute("data-material-up")?-1:1);
 };
 container.ondragstart=event=>{
  const row=event.target.closest("[data-material-row]");if(!row)return;
  event.dataTransfer.setData("text/plain",row.dataset.materialRow);event.dataTransfer.effectAllowed="move";
 };
 container.ondragover=event=>{if(event.target.closest("[data-material-row]"))event.preventDefault();};
 container.ondrop=event=>{
  const row=event.target.closest("[data-material-row]");if(!row)return;event.preventDefault();
  const from=event.dataTransfer.getData("text/plain"),to=row.dataset.materialRow;
  if(from&&to&&from!==to)reorderMaterialBefore(from,to);
 };
}
function orderedMaterials(subjectId){
 return data.materials.filter(x=>(x.subjectId||"")===(subjectId||""))
  .sort((a,b)=>(a.materialOrder??0)-(b.materialOrder??0));
}
function saveMaterialOrder(group){group.forEach((x,i)=>x.materialOrder=i);saveData();}
function moveMaterialInList(id,direction){
 const item=data.materials.find(x=>x.id===id);if(!item)return;
 const group=orderedMaterials(item.subjectId),i=group.findIndex(x=>x.id===id),j=i+direction;
 if(i<0||j<0||j>=group.length)return;
 [group[i],group[j]]=[group[j],group[i]];saveMaterialOrder(group);renderMaterials();
}
function reorderMaterialBefore(fromId,toId){
 const from=data.materials.find(x=>x.id===fromId),to=data.materials.find(x=>x.id===toId);
 if(!from||!to||from.subjectId!==to.subjectId)return;
 const group=orderedMaterials(from.subjectId),i=group.findIndex(x=>x.id===fromId),j=group.findIndex(x=>x.id===toId);
 if(i<0||j<0)return;const [moved]=group.splice(i,1);group.splice(j,0,moved);saveMaterialOrder(group);renderMaterials();
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

const legacyTaskForm = document.getElementById("taskForm");
if (legacyTaskForm) legacyTaskForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = document.getElementById("taskName").value.trim();
    const subjectId = document.getElementById("taskSubject").value;
    const date = document.getElementById("taskDate").value;
    if (!name) return;
    data.tasks.push({ id:createId(), name, subjectId, date, completed:false });
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
    // Das Dashboard ist die Startseite; Aufgaben und Fortschritt liegen zentral im Lerncockpit.
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

    // Die zentrale renderMaterials()-Funktion bleibt aktiv.
    // Sie enthält die Sortiersteuerung (Nach oben/Nach unten/Position)
    // sowie die Touch-Griff-Funktion. Eine spätere vereinfachte
    // Neudefinition hatte diese Oberfläche bisher wieder entfernt.

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
        }).sort((a, b) => {
            if (a.subjectId !== b.subjectId) {
                const ai = data.subjects.findIndex(subject => subject.id === a.subjectId);
                const bi = data.subjects.findIndex(subject => subject.id === b.subjectId);
                return ai - bi;
            }
            const ao = Number.isFinite(a.materialOrder) ? a.materialOrder : data.materials.indexOf(a);
            const bo = Number.isFinite(b.materialOrder) ? b.materialOrder : data.materials.indexOf(b);
            return ao - bo;
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
                        <button type="button" class="small-button material-move-button"
                            data-smart-material-up="${escapeHTML(item.id)}"
                            ${data.materials.filter(m => m.subjectId === item.subjectId).sort((a,b)=>(a.materialOrder ?? data.materials.indexOf(a))-(b.materialOrder ?? data.materials.indexOf(b))).findIndex(m => m.id === item.id) === 0 ? "disabled" : ""}>
                            ↑ Nach oben
                        </button>
                        <button type="button" class="small-button material-move-button"
                            data-smart-material-down="${escapeHTML(item.id)}"
                            ${(() => { const g=data.materials.filter(m=>m.subjectId===item.subjectId).sort((a,b)=>(a.materialOrder ?? data.materials.indexOf(a))-(b.materialOrder ?? data.materials.indexOf(b))); return g.findIndex(m=>m.id===item.id)===g.length-1; })() ? "disabled" : ""}>
                            ↓ Nach unten
                        </button>
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

        // Sortierung direkt an den tatsächlich angezeigten Materialkarten.
        materialList.querySelectorAll("[data-smart-material-up], [data-smart-material-down]").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.dataset.smartMaterialUp || button.dataset.smartMaterialDown;
                const item = data.materials.find(material => String(material.id) === String(id));
                if (!item) return;
                const group = data.materials
                    .filter(material => material.subjectId === item.subjectId)
                    .sort((a, b) => (a.materialOrder ?? data.materials.indexOf(a)) - (b.materialOrder ?? data.materials.indexOf(b)));
                const index = group.findIndex(material => String(material.id) === String(id));
                const next = index + (button.hasAttribute("data-smart-material-up") ? -1 : 1);
                if (index < 0 || next < 0 || next >= group.length) return;
                [group[index], group[next]] = [group[next], group[index]];
                group.forEach((material, position) => material.materialOrder = position);
                saveData();
                renderSmartMaterials();
            });
        });

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
        const files = Array.from(document.getElementById("materialFile").files || []);
        const topic = document.getElementById("materialTopic").value.trim();
        const subtopic = document.getElementById("materialSubtopic").value.trim();
        const description = document.getElementById("materialDescription").value.trim();
        if (!subjectId || !name || !files.length) {
            alert("Bitte wähle ein Fach, gib einen Titel ein und lade mindestens eine Datei hoch.");
            return;
        }
        const oversized = files.find(file => file.size > 30 * 1024 * 1024);
        if (oversized) { alert("Die Datei „" + oversized.name + "“ ist größer als 30 MB."); return; }
        const button = materialForm.querySelector('button[type="submit"]');
        button.disabled = true;
        const savedIds = [];
        try {
            for (let i=0;i<files.length;i++) {
                const file=files[i], id=createId();
                button.textContent="Speichere "+(i+1)+" von "+files.length+" …";
                await saveActualFile(id,file);
                savedIds.push(id);
                data.materials.push({
                    id,subjectId,
                    name:files.length===1?name:name+" · "+file.name,
                    fileName:file.name,fileType:file.type||"application/octet-stream",
                    topic,subtopic,description,date:new Date().toISOString(),
                    fileStored:true,batchName:files.length>1?name:""
                });
            }
            saveData();materialForm.reset();renderAll();
            alert(files.length+" Datei(en) wurden gespeichert.");
        } catch(error) {
            console.error(error);
            data.materials=data.materials.filter(item=>!savedIds.includes(item.id));
            for(const id of savedIds){try{await deleteActualFile(id);}catch{}}
            saveData();
            alert("Upload fehlgeschlagen. Bitte prüfe den verfügbaren Speicherplatz.");
        } finally {
            button.disabled=false;button.textContent="Material speichern";
        }
    }, true);;

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


/* =====================================================
   STUDYSPACE – KI-LERNBLÄTTER SYSTEM 1.0
   Eigenständiges Zusatzmodul
===================================================== */

(function () {
    "use strict";

    const STORAGE_KEY = "studySpaceAiSheets";

    function loadSheets() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveSheets(sheets) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function createSheet(data) {
        if (!data || !data.title || !data.content) {
            return null;
        }

        const sheets = loadSheets();

        const sheet = {
            id: Date.now().toString(),
            title: data.title,
            subject: data.subject || "Allgemein",
            content: data.content,
            createdAt: new Date().toISOString()
        };

        sheets.unshift(sheet);
        saveSheets(sheets);
        render();

        return sheet.id;
    }

    function deleteSheet(id) {
        if (!confirm("Möchtest du dieses Lernblatt wirklich löschen?")) {
            return;
        }

        saveSheets(loadSheets().filter(sheet => sheet.id !== id));
        render();

        const viewer = document.getElementById("aiSheetViewer");
        if (viewer) {
            viewer.hidden = true;
            viewer.innerHTML = "";
        }
    }

    function openSheet(id) {
        const sheet = loadSheets().find(item => item.id === id);
        const viewer = document.getElementById("aiSheetViewer");

        if (!sheet || !viewer) return;

        viewer.hidden = false;
        viewer.innerHTML = `
            <div class="ai-sheet-open">
                <div class="ai-sheet-top">
                    <div>
                        <span class="ai-sheet-tag">${escapeHTML(sheet.subject)}</span>
                        <h2>${escapeHTML(sheet.title)}</h2>
                        <p class="muted">
                            Erstellt am ${new Date(sheet.createdAt).toLocaleDateString("de-DE")}
                        </p>
                    </div>
                    <button class="secondary-button" id="closeAiSheet">Schließen</button>
                </div>

                <div class="ai-sheet-content">${escapeHTML(sheet.content).replace(/\n/g, "<br>")}</div>
            </div>
        `;

        document.getElementById("closeAiSheet").addEventListener("click", () => {
            viewer.hidden = true;
            viewer.innerHTML = "";
        });

        viewer.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function render() {
        const container = document.getElementById("aiSheetsList");
        if (!container) return;

        const sheets = loadSheets();

        if (sheets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    Noch keine Lernblätter vorhanden.
                    <p>Deine erstellten Lernübersichten erscheinen hier.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sheets.map(sheet => `
            <article class="ai-sheet-card">
                <div class="ai-sheet-card-icon">✦</div>
                <div class="ai-sheet-card-info">
                    <span class="ai-sheet-tag">${escapeHTML(sheet.subject)}</span>
                    <h3>${escapeHTML(sheet.title)}</h3>
                    <p>${new Date(sheet.createdAt).toLocaleDateString("de-DE")}</p>
                </div>
                <div class="ai-sheet-card-actions">
                    <button class="primary-button" data-open-sheet="${escapeHTML(sheet.id)}">
                        Öffnen
                    </button>
                    <button class="danger-button" data-delete-sheet="${escapeHTML(sheet.id)}">
                        Löschen
                    </button>
                </div>
            </article>
        `).join("");

        container.querySelectorAll("[data-open-sheet]").forEach(button => {
            button.addEventListener("click", () => openSheet(button.dataset.openSheet));
        });

        container.querySelectorAll("[data-delete-sheet]").forEach(button => {
            button.addEventListener("click", () => deleteSheet(button.dataset.deleteSheet));
        });
    }

    window.StudySpaceSheets = {
        create: createSheet,
        delete: deleteSheet,
        open: openSheet,
        render: render,
        getAll: loadSheets
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", render);
    } else {
        render();
    }

    console.log("StudySpace KI-Lernblätter 1.0 geladen.");
})();


/* =====================================================
   STUDYSPACE – KI-LERNBLÄTTER SEITEN-INTEGRATION
===================================================== */

(function () {
    const navigation = document.querySelector(".navigation");
    const tutorButton = navigation?.querySelector('[data-page="tutor"]');
    const main = document.querySelector(".main-content");

    if (!navigation || !tutorButton || !main) {
        console.error("KI-Lernblätter: Einbindung nicht möglich.");
        return;
    }

    // Doppelte Einbindung verhindern
    if (document.getElementById("page-ai-sheets")) return;

    // Navigationsbutton erstellen
    const navButton = document.createElement("button");
    navButton.className = "nav-item";
    navButton.dataset.page = "ai-sheets";
    navButton.innerHTML = `
        <span class="nav-icon">▤</span>
        <span class="nav-text">KI-Lernblätter</span>
    `;

    tutorButton.insertAdjacentElement("afterend", navButton);

    // Neue Seite erstellen
    const page = document.createElement("section");
    page.className = "page";
    page.id = "page-ai-sheets";

    page.innerHTML = `
        <div class="page-intro">
            <h1>KI-Lernblätter</h1>
            <p>Deine automatisch erstellten und gespeicherten Lernübersichten.</p>
        </div>

        <div class="panel">
            <div class="section-heading">
                <div>
                    <h3>Deine Lernblätter</h3>
                    <p class="muted">Alle deine persönlichen KI-Lernunterlagen an einem Ort.</p>
                </div>
            </div>

            <div id="aiSheetsList" class="ai-sheets-list">
                <div class="empty-state">Noch keine Lernblätter vorhanden.</div>
            </div>
        </div>

        <div id="aiSheetViewer" class="ai-sheet-viewer" hidden></div>
    `;

    const flashcardsPage = document.getElementById("page-flashcards");

    if (flashcardsPage) {
        main.insertBefore(page, flashcardsPage);
    } else {
        main.appendChild(page);
    }

    // Navigation
    navButton.addEventListener("click", () => {
        document.querySelectorAll(".page").forEach(item => {
            item.classList.remove("active");
        });

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        page.classList.add("active");
        navButton.classList.add("active");

        const title = document.getElementById("pageTitle");
        if (title) title.textContent = "KI-Lernblätter";

        if (window.StudySpaceSheets) {
            window.StudySpaceSheets.render();
        }
    });

    console.log("StudySpace KI-Lernblätter-Seite integriert.");
})();



/* =====================================================
   STUDYSPACE – AUTOMATISCHER LERNBLATT-GENERATOR 1.0
   Ohne KI – nutzt vorhandene Materialien und OCR-Texte
===================================================== */

(function () {
    "use strict";

    const DB_NAME = "StudySpaceFilesDB";
    const STORE_NAME = "files";

    const waitForPage = () => {
        const page = document.getElementById("page-ai-sheets");

        if (!page) {
            setTimeout(waitForPage, 300);
            return;
        }

        if (document.getElementById("sheetGenerator")) return;

        buildGenerator(page);
    };

    function getStudyData() {
        try {
            return JSON.parse(localStorage.getItem("studyspaceData")) || {};
        } catch {
            return {};
        }
    }

    function getFiles() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.close();
                    resolve([]);
                    return;
                }

                const transaction = db.transaction(STORE_NAME, "readonly");
                const get = transaction.objectStore(STORE_NAME).getAll();

                get.onsuccess = () => {
                    resolve(get.result || []);
                    db.close();
                };

                get.onerror = () => {
                    db.close();
                    reject(get.error);
                };
            };
        });
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function findFile(material, files, materials) {
        const stored = material.fileStored;

        if (stored) {
            const match = files.find(file =>
                String(file.id) === String(stored)
            );

            if (match) return match;
        }

        const byId = files.find(file =>
            String(file.id) === String(material.id)
        );

        if (byId) return byId;

        // Sicherer Rückgriff, wenn genau eine Datei
        // genau einem Material zugeordnet ist.
        if (files.length === 1 && materials.length === 1) {
            return files[0];
        }

        return null;
    }

    function cleanText(text) {
        return String(text || "")
            .replace(/\r/g, "\n")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function extractLines(text) {
        return cleanText(text)
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length >= 3)
            .filter(line => !/^(seite \d+|\d{1,2}:\d{2})$/i.test(line));
    }

    function createStructuredSheet(materials, subjectName) {
        const definitions = [];
        const formulas = [];
        const questions = [];
        const examples = [];
        const other = [];

        let originalText = "";

        materials.forEach(material => {
            const text = cleanText(material.text);

            if (!text) return;

            originalText +=
                `\n\n--- ${material.name} ---\n\n${text}`;

            const lines = extractLines(text);

            lines.forEach(line => {
                if (
                    /^(wie|warum|weshalb|was|welcher|welche|wodurch)\b/i.test(line) ||
                    /\?$/.test(line)
                ) {
                    questions.push(line);
                } else if (
                    /formel|gleichung|berechnung/i.test(line) ||
                    /[a-zA-Z]\s*=\s*[-\d]/.test(line) ||
                    /[²³]/.test(line)
                ) {
                    formulas.push(line);
                } else if (
                    /beispiel|zum beispiel|z\.?\s*b\.?/i.test(line)
                ) {
                    examples.push(line);
                } else if (
                    /definition|bezeichnet man|versteht man unter|ist eine|ist die|bedeutet/i.test(line)
                ) {
                    definitions.push(line);
                } else {
                    other.push(line);
                }
            });
        });

        const section = (title, entries) => {
            if (!entries.length) {
                return `${title}\nKeine eindeutigen Einträge erkannt.\n`;
            }

            return `${title}\n${entries
                .map(entry => "• " + entry)
                .join("\n")}\n`;
        };

        return `
LERNBLATT: ${subjectName}

QUELLEN
${materials.map(item => "• " + item.name).join("\n")}

========================================
1. GRUNDBEGRIFFE UND DEFINITIONEN
========================================

${section("", definitions)}

========================================
2. FORMELN UND BERECHNUNGEN
========================================

${section("", formulas)}

========================================
3. BEISPIELE
========================================

${section("", examples)}

========================================
4. MÖGLICHE LERNFRAGEN
========================================

${section("", questions)}

========================================
5. WEITERE INHALTE AUS DEINEM MATERIAL
========================================

${section("", other)}

========================================
6. ORIGINALTEXT ZUR KONTROLLE
========================================

${originalText}

========================================
HINWEIS
========================================

Dieses Lernblatt wurde automatisch anhand deiner
gespeicherten Materialien strukturiert.

Es wurde keine KI-Zusammenfassung erstellt.
Die Erkennung und Zuordnung von Begriffen kann
fehlerhaft sein. Vergleiche wichtige Angaben
mit deinem Originalhefter.
        `.trim();
    }

    function buildGenerator(page) {
        const panel = document.createElement("div");
        panel.id = "sheetGenerator";
        panel.className = "panel sheet-generator";

        panel.innerHTML = `
            <div class="section-heading">
                <div>
                    <h2>Lernblatt erstellen</h2>
                    <p class="muted">
                        Erstelle strukturierte Lernblätter aus deinen
                        vorhandenen Heftern und StudySpace-Materialien.
                    </p>
                </div>
            </div>

            <div class="sheet-generator-fields">
                <label for="sheetSubject">Fach</label>
                <select id="sheetSubject">
                    <option value="all">Alle Fächer</option>
                </select>

                <label for="sheetTitle">Titel des Lernblatts</label>
                <input
                    id="sheetTitle"
                    type="text"
                    placeholder="z. B. Dynamik und Kräfte"
                />
            </div>

            <div class="sheet-source-heading">
                <h3>Materialien auswählen</h3>
                <button type="button" class="secondary-button"
                    id="reloadSheetSources">
                    Aktualisieren
                </button>
            </div>

            <div id="sheetSourceList" class="sheet-source-list">
                Materialien werden geladen ...
            </div>

            <div id="sheetGeneratorStatus" class="muted"></div>

            <button id="generateSheetButton" class="primary-button">
                Lernblatt erstellen
            </button>
        `;

        const listPanel = page.querySelector(".panel");

        if (listPanel) {
            page.insertBefore(panel, listPanel);
        } else {
            page.prepend(panel);
        }

        const data = getStudyData();
        const subjectSelect = panel.querySelector("#sheetSubject");

        (data.subjects || []).forEach(subject => {
            const option = document.createElement("option");
            option.value = subject.id;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });

        let availableMaterials = [];

        async function loadSources() {
            const list = panel.querySelector("#sheetSourceList");
            const status = panel.querySelector("#sheetGeneratorStatus");

            list.textContent = "Materialien werden geladen ...";
            status.textContent = "";

            try {
                const currentData = getStudyData();
                const files = await getFiles();

                availableMaterials = (currentData.materials || []).map(material => {
                    const file = findFile(
                        material,
                        files,
                        currentData.materials || []
                    );

                    const subject = (currentData.subjects || []).find(
                        item => String(item.id) === String(material.subjectId)
                    );

                    return {
                        ...material,
                        subjectName: subject?.name || "Allgemein",
                        text: cleanText(
                            file?.extractedText || material.description || ""
                        ),
                        fileAvailable: Boolean(file),
                        hasText: Boolean(
                            file?.extractedText || material.description
                        )
                    };
                });

                renderSources();
            } catch (error) {
                console.error("Lernblatt-Quellen:", error);
                list.textContent =
                    "Die gespeicherten Materialien konnten nicht geladen werden.";
            }
        }

        function renderSources() {
            const list = panel.querySelector("#sheetSourceList");
            const selectedSubject = subjectSelect.value;

            const filtered = availableMaterials.filter(material =>
                selectedSubject === "all" ||
                String(material.subjectId) === selectedSubject
            );

            if (!filtered.length) {
                list.innerHTML = `
                    <div class="empty-state">
                        Keine passenden Materialien gefunden.
                    </div>
                `;
                return;
            }

            list.innerHTML = filtered.map(material => `
                <label class="sheet-source-item">
                    <input
                        type="checkbox"
                        value="${escapeHTML(material.id)}"
                        ${material.hasText ? "checked" : "disabled"}
                    />
                    <span class="sheet-source-info">
                        <strong>${escapeHTML(material.name)}</strong>
                        <small>
                            ${escapeHTML(material.subjectName)}
                            ·
                            ${material.hasText
                                ? "Text verfügbar"
                                : "Kein ausgelesener Text"}
                        </small>
                    </span>
                    <span class="sheet-source-status">
                        ${material.hasText ? "✓" : "–"}
                    </span>
                </label>
            `).join("");
        }

        subjectSelect.addEventListener("change", renderSources);

        panel.querySelector("#reloadSheetSources")
            .addEventListener("click", loadSources);

        panel.querySelector("#generateSheetButton")
            .addEventListener("click", () => {
                const selectedIds = [
                    ...panel.querySelectorAll(
                        "#sheetSourceList input:checked"
                    )
                ].map(input => input.value);

                const selected = availableMaterials.filter(material =>
                    selectedIds.includes(String(material.id)) &&
                    material.hasText
                );

                const title = panel.querySelector("#sheetTitle")
                    .value.trim();

                const status = panel.querySelector("#sheetGeneratorStatus");

                if (!selected.length) {
                    status.textContent =
                        "Bitte wähle mindestens ein Material mit erkanntem Text aus.";
                    return;
                }

                if (!title) {
                    status.textContent =
                        "Bitte gib deinem Lernblatt einen Titel.";
                    panel.querySelector("#sheetTitle").focus();
                    return;
                }

                const subjectNames = [
                    ...new Set(selected.map(item => item.subjectName))
                ];

                const subjectName = subjectNames.join(", ");

                const content = createStructuredSheet(
                    selected,
                    subjectName
                );

                if (!window.StudySpaceSheets) {
                    status.textContent =
                        "Die Lernblattverwaltung wurde nicht gefunden.";
                    return;
                }

                const id = window.StudySpaceSheets.create({
                    title,
                    subject: subjectName,
                    content
                });

                if (id) {
                    status.textContent =
                        "Lernblatt erfolgreich erstellt und gespeichert.";

                    panel.querySelector("#sheetTitle").value = "";

                    if (subjectNames.length === 1) {
                        subjectSelect.value = selected[0].subjectId;
                    }

                    window.StudySpaceSheets.render();

                    const viewer = document.getElementById("aiSheetViewer");

                    if (viewer) {
                        window.StudySpaceSheets.open(id);
                    }
                } else {
                    status.textContent =
                        "Das Lernblatt konnte nicht erstellt werden.";
                }
            });

        loadSources();

        console.log("StudySpace Lernblatt-Generator 1.0 geladen.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", waitForPage);
    } else {
        waitForPage();
    }
})();


/* ==========================================================
   STUDYSPACE – LERNWERKSTATT 1.0
   Wiederholung · Prüfungsmodus · Fehlertrainer · Notizen
   Eigene Daten werden separat gespeichert.
========================================================== */

(() => {
    "use strict";

    const STORAGE_KEY = "studySpaceLearningWorkshop";
    const $ = id => document.getElementById(id);

    const today = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const uid = () => "lw_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);

    const emptyData = {
        notes: [],
        questions: [],
        mistakes: [],
        history: [],
        settings: { dailyGoal: 30 },
        lastVisit: today(),
        streak: 0
    };

    function loadWorkshop() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            return { ...emptyData, ...saved };
        } catch {
            return structuredClone(emptyData);
        }
    }

    let store = loadWorkshop();

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
            updateOverview();
            return true;
        } catch (error) {
            console.error("Lernwerkstatt konnte nicht speichern:", error);
            alert("Speichern fehlgeschlagen. Möglicherweise ist dein Browserspeicher voll.");
            return false;
        }
    }

    function subjects() {
        return Array.isArray(data.subjects) ? data.subjects : [];
    }

    function cards() {
        return Array.isArray(data.flashcards) ? data.flashcards : [];
    }

    function subjectName(id) {
        return subjects().find(s => String(s.id) === String(id))?.name || "Allgemein";
    }

    function subjectOptions(selected = "") {
        return `<option value="">Allgemein / kein Fach</option>` +
            subjects().map(s =>
                `<option value="${esc(s.id)}" ${String(s.id) === String(selected) ? "selected" : ""}>${esc(s.name)}</option>`
            ).join("");
    }

    function dueDate(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function ensurePage() {
        if ($("page-workshop")) return;

        const nav = document.querySelector(".navigation");
        const main = document.querySelector(".main-content");

        if (!nav || !main) {
            console.error("Lernwerkstatt: Navigation oder Hauptbereich nicht gefunden.");
            return;
        }

        const navButton = document.createElement("button");
        navButton.className = "nav-item";
        navButton.dataset.page = "workshop";
        navButton.innerHTML = `
            <span class="nav-icon">🧠</span>
            <span class="nav-text">Lernwerkstatt</span>
        `;
        nav.appendChild(navButton);

        const page = document.createElement("section");
        page.className = "page";
        page.id = "page-workshop";

        page.innerHTML = `
            <div class="page-intro">
                <h1>Lernwerkstatt</h1>
                <p>Wiederhole gezielt, trainiere Prüfungsfragen und erkenne deine Wissenslücken.</p>
            </div>

            <div class="lw-overview" id="lwOverview"></div>

            <div class="lw-tabs">
                <button class="lw-tab active" data-tab="today">Heute lernen</button>
                <button class="lw-tab" data-tab="cards">Wiederholen</button>
                <button class="lw-tab" data-tab="exam">Prüfungsmodus</button>
                <button class="lw-tab" data-tab="mistakes">Fehlertrainer</button>
                <button class="lw-tab" data-tab="questions">Fragenpool</button>
                <button class="lw-tab" data-tab="notes">Lernnotizen</button>
                <button class="lw-tab" data-tab="stats">Statistik</button>
                <button class="lw-tab" data-tab="backup">Daten</button>
            </div>

            <div class="lw-panel active" id="lw-today">
                <div class="lw-section-heading">
                    <div>
                        <h2>Dein Lernstart</h2>
                        <p>Beginne mit den Inhalten, die heute wirklich wichtig sind.</p>
                    </div>
                </div>
                <div id="lwTodayContent"></div>
                <div class="lw-box">
                    <h3>Tagesziel</h3>
                    <p>Wie viele Minuten möchtest du heute aktiv lernen?</p>
                    <div class="lw-inline">
                        <input type="number" id="lwDailyGoal" min="5" max="600" step="5">
                        <span>Minuten</span>
                        <button class="primary-button" id="lwSaveGoal">Ziel speichern</button>
                    </div>
                    <div class="lw-progress"><div id="lwGoalProgress"></div></div>
                    <p id="lwGoalText" class="muted"></p>
                </div>
                <div class="lw-box">
                    <h3>Deine StudySpace-Karteikarten</h3>
                    <p>Auch deine bereits vorhandenen Karteikarten kannst du hier wiederholen.</p>
                    <button class="primary-button" data-open-tab="cards">Karteikarten wiederholen</button>
                </div>
            </div>

            <div class="lw-panel" id="lw-cards">
                <div class="lw-section-heading">
                    <div>
                        <h2>Intelligente Wiederholung</h2>
                        <p>Karten werden abhängig davon erneut fällig, wie sicher du sie beherrschst.</p>
                    </div>
                </div>
                <div class="lw-inline lw-filters">
                    <select id="lwCardSubject"><option value="">Alle Fächer</option></select>
                    <select id="lwCardSource">
                        <option value="all">Alle Karten</option>
                        <option value="due">Nur fällige Karten</option>
                        <option value="new">Noch nie gelernt</option>
                    </select>
                </div>
                <div id="lwReviewArea"></div>
            </div>

            <div class="lw-panel" id="lw-exam">
                <div class="lw-section-heading">
                    <div>
                        <h2>Prüfungsmodus</h2>
                        <p>Teste dein Wissen ohne die Antwort vorher zu sehen.</p>
                    </div>
                </div>
                <div class="lw-box">
                    <label>Fach
                        <select id="lwExamSubject"><option value="">Alle Fächer</option></select>
                    </label>
                    <label>Anzahl der Fragen
                        <select id="lwExamCount">
                            <option value="5">5 Fragen</option>
                            <option value="10" selected>10 Fragen</option>
                            <option value="20">20 Fragen</option>
                            <option value="all">Alle verfügbaren Fragen</option>
                        </select>
                    </label>
                    <button class="primary-button" id="lwStartExam">Prüfung starten</button>
                </div>
                <div id="lwExamArea"></div>
            </div>

            <div class="lw-panel" id="lw-mistakes">
                <div class="lw-section-heading">
                    <div>
                        <h2>Fehlertrainer</h2>
                        <p>Hier sammelst du Fragen, bei denen du noch unsicher bist.</p>
                    </div>
                </div>
                <div id="lwMistakeList"></div>
            </div>

            <div class="lw-panel" id="lw-questions">
                <div class="lw-section-heading">
                    <div>
                        <h2>Eigener Fragenpool</h2>
                        <p>Erstelle Fragen und Antworten für deinen persönlichen Prüfungsmodus.</p>
                    </div>
                </div>
                <form id="lwQuestionForm" class="lw-form">
                    <label>Frage
                        <textarea id="lwQuestionText" required placeholder="Was möchtest du wissen?"></textarea>
                    </label>
                    <label>Musterantwort
                        <textarea id="lwQuestionAnswer" required placeholder="Wie lautet eine gute Antwort?"></textarea>
                    </label>
                    <label>Fach
                        <select id="lwQuestionSubject">${subjectOptions()}</select>
                    </label>
                    <label>Thema / Kapitel
                        <input id="lwQuestionTopic" placeholder="z. B. Dynamik, Kräfte">
                    </label>
                    <label>Schwierigkeit
                        <select id="lwQuestionDifficulty">
                            <option value="1">Leicht</option>
                            <option value="2" selected>Mittel</option>
                            <option value="3">Schwer</option>
                        </select>
                    </label>
                    <button class="primary-button" type="submit">Frage speichern</button>
                </form>
                <div class="lw-inline lw-filters">
                    <input id="lwQuestionSearch" placeholder="Fragen durchsuchen ...">
                    <select id="lwQuestionFilter"><option value="">Alle Fächer</option></select>
                </div>
                <div id="lwQuestionList"></div>
            </div>

            <div class="lw-panel" id="lw-notes">
                <div class="lw-section-heading">
                    <div>
                        <h2>Deine Lernnotizen</h2>
                        <p>Erstelle eigene Erklärungen, Zusammenfassungen und Merksätze.</p>
                    </div>
                </div>
                <form id="lwNoteForm" class="lw-form">
                    <label>Titel
                        <input id="lwNoteTitle" required placeholder="z. B. Newtonsche Gesetze">
                    </label>
                    <label>Fach
                        <select id="lwNoteSubject">${subjectOptions()}</select>
                    </label>
                    <label>Thema
                        <input id="lwNoteTopic" placeholder="Kapitel oder Unterthema">
                    </label>
                    <label>Inhalt
                        <textarea id="lwNoteContent" rows="7" required placeholder="Schreibe deine Erklärung, Definitionen, Beispiele oder Formeln ..."></textarea>
                    </label>
                    <button class="primary-button" type="submit">Notiz speichern</button>
                </form>
                <input id="lwNoteSearch" class="lw-search" placeholder="Notizen durchsuchen ...">
                <div id="lwNoteList"></div>
            </div>

            <div class="lw-panel" id="lw-stats">
                <div class="lw-section-heading">
                    <div>
                        <h2>Dein Lernfortschritt</h2>
                        <p>Beobachte deine Wiederholungen und deine Entwicklung.</p>
                    </div>
                </div>
                <div id="lwStatsContent"></div>
            </div>

            <div class="lw-panel" id="lw-backup">
                <div class="lw-section-heading">
                    <div>
                        <h2>Datensicherung</h2>
                        <p>Exportiere deine Lernwerkstatt-Daten oder importiere eine Sicherung.</p>
                    </div>
                </div>
                <div class="lw-box">
                    <button class="primary-button" id="lwExport">Lernwerkstatt exportieren</button>
                    <label class="lw-file-label">Sicherung importieren
                        <input type="file" id="lwImport" accept=".json,application/json">
                    </label>
                    <p class="muted">Beim Import werden die Daten der Lernwerkstatt ersetzt. Deine normalen StudySpace-Fächer und Materialien bleiben unberührt.</p>
                </div>
            </div>
        `;

        main.appendChild(page);

        navButton.addEventListener("click", () => openPage("workshop"));

        // Die vorhandene Navigation kennt die neue Seite.
        pageTitles.workshop = "Lernwerkstatt";

        navButton.addEventListener("click", () => {
            document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
            page.classList.add("active");
            document.querySelectorAll(".nav-item[data-page]").forEach(b =>
                b.classList.toggle("active", b.dataset.page === "workshop")
            );
            $("pageTitle").textContent = "Lernwerkstatt";
            renderAllWorkshop();
        });

        bindEvents();
        renderAllWorkshop();
    }

    function switchTab(name) {
        document.querySelectorAll(".lw-tab").forEach(b =>
            b.classList.toggle("active", b.dataset.tab === name)
        );
        document.querySelectorAll(".lw-panel").forEach(p =>
            p.classList.toggle("active", p.id === "lw-" + name)
        );

        if (name === "cards") renderReview();
        if (name === "today") renderToday();
        if (name === "exam") $("lwExamArea").innerHTML = "";
        if (name === "mistakes") renderMistakes();
        if (name === "questions") renderQuestions();
        if (name === "notes") renderNotes();
        if (name === "stats") renderStats();
    }

    function allReviewCards() {
        const existing = cards().map(card => ({
            id: String(card.id),
            question: card.question || "",
            answer: card.answer || "",
            subjectId: card.subjectId || "",
            source: "existing",
            original: card
        }));

        const custom = store.questions.map(q => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            subjectId: q.subjectId || "",
            source: "custom",
            original: q
        }));

        return [...existing, ...custom];
    }

    function reviewMeta(card) {
        const meta = store.review?.[card.id] || {};
        return {
            repetitions: meta.repetitions || 0,
            interval: meta.interval || 0,
            due: meta.due || today(),
            ease: meta.ease || 2.5,
            last: meta.last || null
        };
    }

    function scheduleCard(card, rating) {
        store.review ||= {};
        const old = reviewMeta(card);
        let interval = old.interval;
        let repetitions = old.repetitions;
        let ease = old.ease;

        if (rating === "again") {
            repetitions = 0;
            interval = 0;
            ease = Math.max(1.3, ease - 0.2);
        } else {
            repetitions++;
            if (repetitions === 1) interval = rating === "hard" ? 1 : 1;
            else if (repetitions === 2) interval = rating === "hard" ? 2 : 3;
            else interval = Math.max(1, Math.round(old.interval * (rating === "hard" ? 1.2 : rating === "good" ? ease : ease + 0.5)));

            if (rating === "easy") ease = Math.min(3.2, ease + 0.15);
            if (rating === "hard") ease = Math.max(1.3, ease - 0.15);
        }

        store.review[card.id] = {
            repetitions,
            interval,
            ease,
            due: dueDate(interval),
            last: today()
        };

        store.history.push({
            date: today(),
            cardId: card.id,
            rating
        });

        if (store.history.length > 5000) store.history = store.history.slice(-5000);

        if (rating === "again") addMistake(card, "Bei der Wiederholung als nicht gewusst markiert.");
        save();
        renderReview();
    }

    function addMistake(card, reason = "") {
        const found = store.mistakes.find(m => m.cardId === card.id && !m.resolved);
        if (found) {
            found.count = (found.count || 1) + 1;
            found.updated = today();
            return;
        }

        store.mistakes.unshift({
            id: uid(),
            cardId: card.id,
            question: card.question,
            answer: card.answer,
            subjectId: card.subjectId,
            reason,
            count: 1,
            created: today(),
            resolved: false
        });
    }

    function renderReview() {
        const area = $("lwReviewArea");
        if (!area) return;

        const subject = $("lwCardSubject").value;
        const mode = $("lwCardSource").value;

        let list = allReviewCards().filter(c =>
            !subject || String(c.subjectId) === String(subject)
        );

        list = list.filter(c => {
            const meta = reviewMeta(c);
            if (mode === "due") return meta.due <= today();
            if (mode === "new") return meta.repetitions === 0;
            return true;
        });

        const due = list.filter(c => reviewMeta(c).due <= today());
        const selected = due[0] || list[0];

        if (!selected) {
            area.innerHTML = `<div class="lw-empty">Keine Karten in dieser Auswahl. Erstelle eigene Fragen oder füge Karteikarten hinzu.</div>`;
            return;
        }

        const meta = reviewMeta(selected);
        area.innerHTML = `
            <div class="lw-review-card">
                <div class="lw-review-meta">
                    <span>${esc(subjectName(selected.subjectId))}</span>
                    <span>${meta.repetitions === 0 ? "Neu" : `Wiederholung ${meta.repetitions}`}</span>
                </div>
                <div class="lw-review-question">${esc(selected.question)}</div>
                <button class="primary-button" id="lwReveal">Antwort anzeigen</button>
                <div id="lwAnswerArea" hidden>
                    <div class="lw-review-answer">${esc(selected.answer)}</div>
                    <p>Wie sicher konntest du die Antwort wiedergeben?</p>
                    <div class="lw-rating">
                        <button data-rating="again">Nicht gewusst</button>
                        <button data-rating="hard">Schwer</button>
                        <button data-rating="good">Gut</button>
                        <button data-rating="easy">Sehr sicher</button>
                    </div>
                </div>
            </div>
            <p class="muted lw-center">${list.length} Karten in dieser Auswahl · ${due.length} davon fällig</p>
        `;

        $("lwReveal").addEventListener("click", () => {
            $("lwAnswerArea").hidden = false;
            $("lwReveal").hidden = true;
        });

        area.querySelectorAll("[data-rating]").forEach(button => {
            button.addEventListener("click", () => scheduleCard(selected, button.dataset.rating));
        });
    }

    let examSession = null;

    function examQuestions() {
        const subject = $("lwExamSubject").value;
        return allReviewCards()
            .filter(c => c.question.trim() && c.answer.trim())
            .filter(c => !subject || String(c.subjectId) === String(subject))
            .sort(() => Math.random() - 0.5);
    }

    function startExam() {
        let list = examQuestions();
        const count = $("lwExamCount").value;
        if (count !== "all") list = list.slice(0, Number(count));

        if (!list.length) {
            $("lwExamArea").innerHTML = `<div class="lw-empty">Für diese Auswahl gibt es noch keine Fragen.</div>`;
            return;
        }

        examSession = { list, index: 0, correct: 0, answers: [] };
        showExamQuestion();
    }

    function showExamQuestion() {
        const s = examSession;
        if (!s) return;

        if (s.index >= s.list.length) {
            const percent = Math.round(s.correct / s.list.length * 100);
            store.history.push({
                date: today(),
                type: "exam",
                correct: s.correct,
                total: s.list.length,
                percent
            });
            save();

            $("lwExamArea").innerHTML = `
                <div class="lw-review-card lw-center">
                    <h2>Prüfung beendet</h2>
                    <div class="lw-score">${percent}%</div>
                    <p>${s.correct} von ${s.list.length} Fragen richtig bewertet.</p>
                    <p class="muted">Die Bewertung basiert auf deiner eigenen Einschätzung.</p>
                    <button class="primary-button" id="lwExamAgain">Neue Prüfung starten</button>
                </div>
            `;
            $("lwExamAgain").addEventListener("click", startExam);
            return;
        }

        const q = s.list[s.index];
        $("lwExamArea").innerHTML = `
            <div class="lw-review-card">
                <div class="lw-review-meta"><span>Frage ${s.index + 1} von ${s.list.length}</span><span>${esc(subjectName(q.subjectId))}</span></div>
                <div class="lw-exam-progress"><div style="width:${s.index / s.list.length * 100}%"></div></div>
                <div class="lw-review-question">${esc(q.question)}</div>
                <button class="primary-button" id="lwExamReveal">Musterantwort zeigen</button>
                <div id="lwExamAnswer" hidden>
                    <div class="lw-review-answer">${esc(q.answer)}</div>
                    <p>Hast du die Frage richtig beantwortet?</p>
                    <div class="lw-rating">
                        <button id="lwExamWrong">Nein</button>
                        <button id="lwExamRight">Ja</button>
                    </div>
                </div>
            </div>
        `;

        $("lwExamReveal").addEventListener("click", () => {
            $("lwExamAnswer").hidden = false;
            $("lwExamReveal").hidden = true;
        });

        $("lwExamWrong").addEventListener("click", () => examAnswer(false, q));
        $("lwExamRight").addEventListener("click", () => examAnswer(true, q));
    }

    function examAnswer(correct, card) {
        if (correct) examSession.correct++;
        else addMistake(card, "Im Prüfungsmodus falsch beantwortet.");

        examSession.answers.push({ cardId: card.id, correct });
        examSession.index++;
        save();
        showExamQuestion();
    }

    function renderMistakes() {
        const area = $("lwMistakeList");
        const list = store.mistakes.filter(m => !m.resolved);

        if (!list.length) {
            area.innerHTML = `<div class="lw-empty">Aktuell keine offenen Fehler. Sehr gut!</div>`;
            return;
        }

        area.innerHTML = list.map(m => `
            <div class="lw-list-card">
                <div>
                    <strong>${esc(m.question)}</strong>
                    <p>${esc(subjectName(m.subjectId))} · ${m.count}× als schwierig markiert</p>
                    <details><summary>Lösung ansehen</summary><p>${esc(m.answer)}</p></details>
                    <small>${esc(m.reason || "")}</small>
                </div>
                <button class="secondary-button" data-resolve="${esc(m.id)}">Beherrscht</button>
            </div>
        `).join("");

        area.querySelectorAll("[data-resolve]").forEach(b => b.addEventListener("click", () => {
            const m = store.mistakes.find(x => x.id === b.dataset.resolve);
            if (m) m.resolved = true;
            save();
            renderMistakes();
        }));
    }

    function renderQuestions() {
        const area = $("lwQuestionList");
        if (!area) return;

        const search = ($("lwQuestionSearch").value || "").toLowerCase();
        const subject = $("lwQuestionFilter").value;

        const list = store.questions.filter(q =>
            (!subject || String(q.subjectId) === String(subject)) &&
            `${q.question} ${q.answer} ${q.topic}`.toLowerCase().includes(search)
        );

        area.innerHTML = list.length ? list.map(q => `
            <div class="lw-list-card">
                <div>
                    <strong>${esc(q.question)}</strong>
                    <p>${esc(subjectName(q.subjectId))} · ${esc(q.topic || "Ohne Thema")} · ${["", "Leicht", "Mittel", "Schwer"][q.difficulty]}</p>
                    <details><summary>Antwort anzeigen</summary><p>${esc(q.answer)}</p></details>
                </div>
                <button class="small-button delete" data-delete-question="${esc(q.id)}">Löschen</button>
            </div>
        `).join("") : `<div class="lw-empty">Keine passenden Fragen gefunden.</div>`;

        area.querySelectorAll("[data-delete-question]").forEach(b => b.addEventListener("click", () => {
            store.questions = store.questions.filter(q => q.id !== b.dataset.deleteQuestion);
            save();
            renderQuestions();
        }));
    }

    function renderNotes() {
        const area = $("lwNoteList");
        if (!area) return;

        const search = ($("lwNoteSearch").value || "").toLowerCase();
        const list = store.notes.filter(n =>
            `${n.title} ${n.topic} ${n.content}`.toLowerCase().includes(search)
        );

        area.innerHTML = list.length ? list.map(n => `
            <div class="lw-list-card lw-note-card">
                <div>
                    <strong>${esc(n.title)}</strong>
                    <p>${esc(subjectName(n.subjectId))} · ${esc(n.topic || "Ohne Thema")}</p>
                    <details><summary>Notiz öffnen</summary><p class="lw-note-content">${esc(n.content)}</p></details>
                </div>
                <button class="small-button delete" data-delete-note="${esc(n.id)}">Löschen</button>
            </div>
        `).join("") : `<div class="lw-empty">Noch keine Notizen vorhanden.</div>`;

        area.querySelectorAll("[data-delete-note]").forEach(b => b.addEventListener("click", () => {
            store.notes = store.notes.filter(n => n.id !== b.dataset.deleteNote);
            save();
            renderNotes();
        }));
    }

    function getTodayMinutes() {
        return store.history
            .filter(h => h.date === today() && h.type !== "exam")
            .length;
    }

    function updateOverview() {
        if (!$("lwOverview")) return;

        const all = allReviewCards();
        const due = all.filter(c => reviewMeta(c).due <= today()).length;
        const done = store.history.filter(h => h.date === today() && h.type !== "exam").length;
        const mistakes = store.mistakes.filter(m => !m.resolved).length;

        $("lwOverview").innerHTML = `
            <div class="lw-stat-card"><span>Fällige Karten</span><strong>${due}</strong><small>Heute zu wiederholen</small></div>
            <div class="lw-stat-card"><span>Wiederholungen</span><strong>${done}</strong><small>Heute erledigt</small></div>
            <div class="lw-stat-card"><span>Offene Fehler</span><strong>${mistakes}</strong><small>Gezielt trainieren</small></div>
            <div class="lw-stat-card"><span>Eigene Fragen</span><strong>${store.questions.length}</strong><small>Im Fragenpool</small></div>
        `;

        if ($("lwDailyGoal")) $("lwDailyGoal").value = store.settings.dailyGoal || 30;
        if ($("lwGoalProgress")) {
            const goal = store.settings.dailyGoal || 30;
            const pct = Math.min(100, Math.round(done / goal * 100));
            $("lwGoalProgress").style.width = pct + "%";
            $("lwGoalText").textContent = `${done} von ${goal} Wiederholungen heute`;
        }
    }

    function renderToday() {
        const all = allReviewCards();
        const due = all.filter(c => reviewMeta(c).due <= today()).length;
        const openMistakes = store.mistakes.filter(m => !m.resolved).length;

        $("lwTodayContent").innerHTML = `
            <div class="lw-today-grid">
                <div class="lw-box"><span class="lw-big-number">${due}</span><strong>Fällige Karten</strong><button class="secondary-button" data-open-tab="cards">Jetzt wiederholen</button></div>
                <div class="lw-box"><span class="lw-big-number">${openMistakes}</span><strong>Offene Fehler</strong><button class="secondary-button" data-open-tab="mistakes">Fehler trainieren</button></div>
                <div class="lw-box"><span class="lw-big-number">${store.questions.length}</span><strong>Eigene Fragen</strong><button class="secondary-button" data-open-tab="exam">Prüfung simulieren</button></div>
            </div>
        `;
        updateOverview();
    }

    function renderStats() {
        const all = allReviewCards();
        const total = store.history.filter(h => h.type !== "exam").length;
        const exams = store.history.filter(h => h.type === "exam");
        const average = exams.length ? Math.round(exams.reduce((a, b) => a + b.percent, 0) / exams.length) : 0;
        const due = all.filter(c => reviewMeta(c).due <= today()).length;

        $("lwStatsContent").innerHTML = `
            <div class="lw-today-grid">
                <div class="lw-box"><span class="lw-big-number">${all.length}</span><strong>Karten und Fragen</strong></div>
                <div class="lw-box"><span class="lw-big-number">${total}</span><strong>Wiederholungen insgesamt</strong></div>
                <div class="lw-box"><span class="lw-big-number">${exams.length}</span><strong>Abgeschlossene Prüfungen</strong></div>
                <div class="lw-box"><span class="lw-big-number">${average}%</span><strong>Durchschnittliche Selbsteinschätzung</strong></div>
                <div class="lw-box"><span class="lw-big-number">${due}</span><strong>Aktuell fällige Karten</strong></div>
                <div class="lw-box"><span class="lw-big-number">${store.notes.length}</span><strong>Eigene Lernnotizen</strong></div>
            </div>
            <p class="muted">Die Prüfungsergebnisse beruhen auf deiner eigenen Bewertung und sind keine objektive Benotung.</p>
        `;
    }

    function renderAllWorkshop() {
        if (!$("page-workshop")) return;

        ["lwCardSubject", "lwExamSubject", "lwQuestionSubject", "lwNoteSubject", "lwQuestionFilter"].forEach(id => {
            const el = $(id);
            if (!el) return;
            const val = el.value;
            const first = id === "lwQuestionSubject" || id === "lwNoteSubject"
                ? `<option value="">Allgemein / kein Fach</option>`
                : `<option value="">Alle Fächer</option>`;
            el.innerHTML = first + subjects().map(s =>
                `<option value="${esc(s.id)}">${esc(s.name)}</option>`
            ).join("");
            el.value = val;
        });

        renderToday();
        renderReview();
        renderMistakes();
        renderQuestions();
        renderNotes();
        renderStats();
    }

    function bindEvents() {
        document.querySelectorAll(".lw-tab").forEach(b =>
            b.addEventListener("click", () => switchTab(b.dataset.tab))
        );

        document.addEventListener("click", event => {
            const tab = event.target.closest("[data-open-tab]");
            if (tab && $("page-workshop")?.classList.contains("active")) {
                switchTab(tab.dataset.openTab);
            }
        });

        $("lwCardSubject").addEventListener("change", renderReview);
        $("lwCardSource").addEventListener("change", renderReview);
        $("lwStartExam").addEventListener("click", startExam);

        $("lwQuestionForm").addEventListener("submit", event => {
            event.preventDefault();
            store.questions.unshift({
                id: uid(),
                question: $("lwQuestionText").value.trim(),
                answer: $("lwQuestionAnswer").value.trim(),
                subjectId: $("lwQuestionSubject").value,
                topic: $("lwQuestionTopic").value.trim(),
                difficulty: Number($("lwQuestionDifficulty").value),
                created: today()
            });
            save();
            event.target.reset();
            renderAllWorkshop();
        });

        $("lwNoteForm").addEventListener("submit", event => {
            event.preventDefault();
            store.notes.unshift({
                id: uid(),
                title: $("lwNoteTitle").value.trim(),
                subjectId: $("lwNoteSubject").value,
                topic: $("lwNoteTopic").value.trim(),
                content: $("lwNoteContent").value.trim(),
                created: today()
            });
            save();
            event.target.reset();
            renderNotes();
        });

        $("lwQuestionSearch").addEventListener("input", renderQuestions);
        $("lwQuestionFilter").addEventListener("change", renderQuestions);
        $("lwNoteSearch").addEventListener("input", renderNotes);

        $("lwSaveGoal").addEventListener("click", () => {
            store.settings.dailyGoal = Math.max(5, Math.min(600, Number($("lwDailyGoal").value) || 30));
            save();
        });

        $("lwExport").addEventListener("click", () => {
            const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "studyspace-lernwerkstatt-sicherung.json";
            a.click();
            URL.revokeObjectURL(url);
        });

        $("lwImport").addEventListener("change", async event => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const imported = JSON.parse(await file.text());
                if (!imported || !Array.isArray(imported.questions) || !Array.isArray(imported.notes)) {
                    throw new Error("Ungültige Sicherungsdatei.");
                }

                if (!confirm("Möchtest du deine aktuellen Lernwerkstatt-Daten wirklich durch diese Sicherung ersetzen?")) return;

                store = { ...emptyData, ...imported };
                save();
                renderAllWorkshop();
                alert("Import erfolgreich.");
            } catch (error) {
                alert("Import fehlgeschlagen: " + error.message);
            } finally {
                event.target.value = "";
            }
        });
    }

    // Bestehende Lernkarten- und Fachseiten bleiben unverändert.
    function start() {
        if (!$("page-workshop")) ensurePage();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

    console.log("StudySpace Lernwerkstatt 1.0 geladen.");
})();

/* ==========================================================
   STUDYSPACE – LERNCOCKPIT 1.0
   Lernzeit · Tagesziele · Aufgaben · Wochenplan · Statistik
   Eigenständiges Zusatzmodul
========================================================== */

(() => {
    "use strict";

    const KEY = "studySpaceLearningCockpit";
    const $ = id => document.getElementById(id);

    const today = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const uid = () =>
        "lc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);

    const defaultData = {
        goal: 60,
        tasks: [],
        sessions: [],
        timer: {
            running: false,
            startedAt: null,
            elapsedBeforePause: 0,
            taskId: ""
        }
    };

    let state = load();
    let tickInterval = null;

    function load() {
        try {
            const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
            return {
                ...defaultData,
                ...saved,
                tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
                sessions: Array.isArray(saved.sessions) ? saved.sessions : [],
                timer: { ...defaultData.timer, ...(saved.timer || {}) }
            };
        } catch {
            return JSON.parse(JSON.stringify(defaultData));
        }
    }

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
            return true;
        } catch (error) {
            console.error("Lerncockpit konnte nicht speichern:", error);
            alert("Speichern fehlgeschlagen. Möglicherweise ist dein Browserspeicher voll.");
            return false;
        }
    }

    function formatTime(milliseconds) {
        const seconds = Math.max(0, Math.floor(milliseconds / 1000));
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const rest = seconds % 60;

        return [hours, minutes, rest]
            .map(number => String(number).padStart(2, "0"))
            .join(":");
    }

    function formatDate(dateString) {
        if (!dateString) return "Ohne Termin";
        return new Date(dateString + "T12:00:00").toLocaleDateString("de-DE", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit"
        });
    }

    function getElapsed() {
        const timer = state.timer;
        if (!timer.running || !timer.startedAt) {
            return timer.elapsedBeforePause || 0;
        }

        return (timer.elapsedBeforePause || 0) +
            (Date.now() - timer.startedAt);
    }

    function minutesToday() {
        return state.sessions
            .filter(session => session.date === today())
            .reduce((sum, session) => sum + session.minutes, 0);
    }

    function minutesThisWeek() {
        const now = new Date();
        const monday = new Date(now);
        const day = (now.getDay() + 6) % 7;
        monday.setDate(now.getDate() - day);
        monday.setHours(0, 0, 0, 0);

        const start = monday.toISOString().slice(0, 10);

        return state.sessions
            .filter(session => session.date >= start)
            .reduce((sum, session) => sum + session.minutes, 0);
    }

    function createPage() {
        if ($("page-cockpit")) return;

        const nav = document.querySelector(".navigation");
        const main = document.querySelector(".main-content");

        if (!nav || !main) {
            console.error("Lerncockpit: Navigation oder Hauptbereich nicht gefunden.");
            return;
        }

        const button = document.createElement("button");
        button.className = "nav-item";
        button.dataset.page = "cockpit";
        button.innerHTML = `
            <span class="nav-icon">◷</span>
            <span class="nav-text">Lerncockpit</span>
        `;

        nav.appendChild(button);

        const page = document.createElement("section");
        page.className = "page";
        page.id = "page-cockpit";

        page.innerHTML = `
            <div class="page-intro">
                <h1>Lerncockpit</h1>
                <p>Plane deine Lernzeit, behalte Aufgaben im Blick und verfolge deinen Fortschritt.</p>
            </div>

            <div class="lc-stat-grid" id="lcStats"></div>

            <div class="lc-grid">
                <section class="panel lc-timer-panel">
                    <div class="lc-heading">
                        <div>
                            <h2>Fokus-Timer</h2>
                            <p class="muted">Miss deine tatsächliche Lernzeit.</p>
                        </div>
                        <span class="lc-live-indicator" id="lcTimerStatus">Bereit</span>
                    </div>

                    <div class="lc-timer-display" id="lcTimerDisplay">00:00:00</div>

                    <label class="lc-label" for="lcTimerTask">Woran möchtest du arbeiten?</label>
                    <select id="lcTimerTask">
                        <option value="">Freies Lernen</option>
                    </select>

                    <div class="lc-timer-actions">
                        <button class="primary-button" id="lcStart">Start</button>
                        <button class="secondary-button" id="lcPause" disabled>Pause</button>
                        <button class="secondary-button" id="lcStop" disabled>Beenden</button>
                    </div>

                    <p class="muted lc-small">
                        Die Zeit läuft auch weiter, wenn du die Seite wechselst.
                        Beim Beenden wird deine Lernzeit gespeichert.
                    </p>
                </section>

                <section class="panel">
                    <div class="lc-heading">
                        <div>
                            <h2>Dein Tagesziel</h2>
                            <p class="muted">Lege fest, wie lange du heute lernen möchtest.</p>
                        </div>
                    </div>

                    <div class="lc-goal-number">
                        <strong id="lcTodayMinutes">0</strong>
                        <span>von <b id="lcGoalNumber">60</b> Minuten</span>
                    </div>

                    <div class="lc-progress-track">
                        <div id="lcGoalBar"></div>
                    </div>

                    <p id="lcGoalMessage" class="muted"></p>

                    <div class="lc-goal-edit">
                        <input type="number" id="lcGoalInput" min="5" max="600" step="5">
                        <button class="secondary-button" id="lcSaveGoal">Ziel ändern</button>
                    </div>
                </section>
            </div>

            <section class="panel">
                <div class="lc-heading">
                    <div>
                        <h2>Aufgabenplanung</h2>
                        <p class="muted">Erstelle Lernaufgaben und setze dir Termine.</p>
                    </div>
                </div>

                <form id="lcTaskForm" class="lc-task-form">
                    <input id="lcTaskTitle" required maxlength="100"
                        placeholder="Was musst du lernen oder erledigen?">

                    <select id="lcTaskPriority">
                        <option value="normal">Normal</option>
                        <option value="high">Wichtig</option>
                        <option value="urgent">Sehr wichtig</option>
                    </select>

                    <input type="date" id="lcTaskDate">

                    <button class="primary-button" type="submit">Aufgabe hinzufügen</button>
                </form>

                <div class="lc-task-filters">
                    <button class="lc-filter active" data-filter="open">Offen</button>
                    <button class="lc-filter" data-filter="all">Alle</button>
                    <button class="lc-filter" data-filter="done">Erledigt</button>
                </div>

                <div id="lcTaskList"></div>
            </section>

            <div class="lc-grid">
                <section class="panel">
                    <div class="lc-heading">
                        <div>
                            <h2>Deine nächsten sieben Tage</h2>
                            <p class="muted">Anstehende Aufgaben auf einen Blick.</p>
                        </div>
                    </div>
                    <div id="lcWeek"></div>
                </section>

                <section class="panel">
                    <div class="lc-heading">
                        <div>
                            <h2>Deine Lernstatistik</h2>
                            <p class="muted">Wie viel Zeit hast du in dein Lernen investiert?</p>
                        </div>
                    </div>
                    <div id="lcWeeklyStats"></div>
                    <div id="lcHistory" class="lc-history"></div>
                </section>
            </div>

            <section class="panel">
                <div class="lc-heading">
                    <div>
                        <h2>Datensicherung</h2>
                        <p class="muted">Sichere deine Aufgaben und Lernzeiten als Datei.</p>
                    </div>
                </div>
                <button class="secondary-button" id="lcExport">Lerncockpit exportieren</button>
                <label class="lc-import-label">
                    Sicherung importieren
                    <input type="file" id="lcImport" accept=".json,application/json">
                </label>
            </section>
        `;

        main.appendChild(page);

        button.addEventListener("click", () => {
            document.querySelectorAll(".page").forEach(item =>
                item.classList.remove("active")
            );
            document.querySelectorAll(".nav-item").forEach(item =>
                item.classList.remove("active")
            );

            page.classList.add("active");
            button.classList.add("active");

            const title = $("pageTitle");
            if (title) title.textContent = "Lerncockpit";

            renderAll();
        });

        bindEvents();
        renderAll();
        startTicker();
    }

    let taskFilter = "open";

    function bindEvents() {
        $("lcStart").addEventListener("click", startTimer);
        $("lcPause").addEventListener("click", pauseTimer);
        $("lcStop").addEventListener("click", stopTimer);

        $("lcSaveGoal").addEventListener("click", () => {
            const value = Number($("lcGoalInput").value);

            if (!Number.isFinite(value) || value < 5 || value > 600) {
                alert("Bitte gib ein Tagesziel zwischen 5 und 600 Minuten ein.");
                return;
            }

            state.goal = value;
            save();
            renderAll();
        });

        $("lcTaskForm").addEventListener("submit", event => {
            event.preventDefault();

            const title = $("lcTaskTitle").value.trim();
            if (!title) return;

            state.tasks.unshift({
                id: uid(),
                title,
                priority: $("lcTaskPriority").value,
                date: $("lcTaskDate").value || "",
                done: false,
                createdAt: today()
            });

            save();
            event.target.reset();
            renderAll();
        });

        document.querySelectorAll(".lc-filter").forEach(button => {
            button.addEventListener("click", () => {
                taskFilter = button.dataset.filter;

                document.querySelectorAll(".lc-filter").forEach(item =>
                    item.classList.toggle("active", item === button)
                );

                renderTasks();
            });
        });

        $("lcTaskList").addEventListener("click", event => {
            const doneButton = event.target.closest("[data-task-done]");
            const deleteButton = event.target.closest("[data-task-delete]");

            if (doneButton) {
                const task = state.tasks.find(item =>
                    item.id === doneButton.dataset.taskDone
                );

                if (task) task.done = !task.done;
                save();
                renderAll();
            }

            if (deleteButton) {
                const id = deleteButton.dataset.taskDelete;

                if (!confirm("Möchtest du diese Aufgabe löschen?")) return;

                state.tasks = state.tasks.filter(item => item.id !== id);
                save();
                renderAll();
            }
        });

        $("lcExport").addEventListener("click", exportData);

        $("lcImport").addEventListener("change", importData);
    }

    function startTimer() {
        if (state.timer.running) return;

        state.timer.running = true;
        state.timer.startedAt = Date.now();

        save();
        updateTimerButtons();
        startTicker();
    }

    function pauseTimer() {
        if (!state.timer.running) return;

        state.timer.elapsedBeforePause = getElapsed();
        state.timer.running = false;
        state.timer.startedAt = null;

        save();
        updateTimerButtons();
        renderTimer();
    }

    function stopTimer() {
        const elapsed = getElapsed();
        const minutes = Math.floor(elapsed / 60000);

        if (minutes < 1) {
            if (!confirm("Die Lernzeit beträgt weniger als eine Minute. Trotzdem beenden?")) {
                return;
            }
        }

        if (minutes > 0) {
            const task = state.tasks.find(item =>
                item.id === state.timer.taskId
            );

            state.sessions.unshift({
                id: uid(),
                date: today(),
                minutes,
                taskTitle: task?.title || "Freies Lernen",
                createdAt: new Date().toISOString()
            });
        }

        state.timer = {
            running: false,
            startedAt: null,
            elapsedBeforePause: 0,
            taskId: ""
        };

        save();
        renderAll();
        updateTimerButtons();
    }

    function startTicker() {
        if (tickInterval) clearInterval(tickInterval);

        tickInterval = setInterval(() => {
            renderTimer();
            renderGoal();
        }, 1000);
    }

    function updateTimerButtons() {
        const running = state.timer.running;
        const hasTime = getElapsed() > 0;

        $("lcStart").disabled = running;
        $("lcPause").disabled = !running;
        $("lcStop").disabled = !running && !hasTime;

        $("lcTimerStatus").textContent = running
            ? "Läuft"
            : hasTime ? "Pausiert" : "Bereit";
    }

    function renderTimer() {
        if (!$("lcTimerDisplay")) return;
        $("lcTimerDisplay").textContent = formatTime(getElapsed());
        updateTimerButtons();
    }

    function renderGoal() {
        const minutes = minutesToday() +
            (state.timer.running ? Math.floor(getElapsed() / 60000) : 0);

        const goal = Number(state.goal) || 60;
        const percentage = Math.min(100, Math.round(minutes / goal * 100));

        $("lcTodayMinutes").textContent = minutes;
        $("lcGoalNumber").textContent = goal;
        $("lcGoalBar").style.width = percentage + "%";
        $("lcGoalInput").value = goal;

        $("lcGoalMessage").textContent = minutes >= goal
            ? "Tagesziel erreicht. Gute Arbeit!"
            : `Noch ${Math.max(0, goal - minutes)} Minuten bis zu deinem Tagesziel.`;
    }

    function renderStats() {
        const todayMinutesValue = minutesToday();
        const weekMinutes = minutesThisWeek();
        const completed = state.tasks.filter(task => task.done).length;
        const open = state.tasks.filter(task => !task.done).length;

        $("lcStats").innerHTML = `
            <div class="lc-stat">
                <span>Heute gelernt</span>
                <strong>${todayMinutesValue} min</strong>
            </div>
            <div class="lc-stat">
                <span>Diese Woche</span>
                <strong>${weekMinutes} min</strong>
            </div>
            <div class="lc-stat">
                <span>Offene Aufgaben</span>
                <strong>${open}</strong>
            </div>
            <div class="lc-stat">
                <span>Erledigte Aufgaben</span>
                <strong>${completed}</strong>
            </div>
        `;

        $("lcWeeklyStats").innerHTML = `
            <div class="lc-week-total">
                <strong>${Math.floor(weekMinutes / 60)} h ${weekMinutes % 60} min</strong>
                <span>gelernte Zeit in dieser Woche</span>
            </div>
        `;

        const history = state.sessions.slice(0, 8);

        $("lcHistory").innerHTML = history.length
            ? history.map(session => `
                <div class="lc-history-item">
                    <span>${esc(formatDate(session.date))}</span>
                    <strong>${session.minutes} min</strong>
                    <small>${esc(session.taskTitle)}</small>
                </div>
            `).join("")
            : `<p class="muted">Noch keine Lernzeiten gespeichert.</p>`;
    }

    function renderTasks() {
        const list = state.tasks.filter(task => {
            if (taskFilter === "open") return !task.done;
            if (taskFilter === "done") return task.done;
            return true;
        });

        if (!list.length) {
            $("lcTaskList").innerHTML =
                `<div class="lc-empty">Hier gibt es momentan keine Aufgaben.</div>`;
            return;
        }

        $("lcTaskList").innerHTML = list.map(task => `
            <article class="lc-task ${task.done ? "is-done" : ""}">
                <button class="lc-task-check" data-task-done="${esc(task.id)}"
                    aria-label="${task.done ? "Als offen markieren" : "Als erledigt markieren"}">
                    ${task.done ? "✓" : ""}
                </button>
                <div class="lc-task-info">
                    <strong>${esc(task.title)}</strong>
                    <small>
                        ${task.date ? esc(formatDate(task.date)) : "Kein Termin"}
                        · ${task.priority === "urgent" ? "Sehr wichtig" :
                            task.priority === "high" ? "Wichtig" : "Normal"}
                    </small>
                </div>
                <button class="lc-delete" data-task-delete="${esc(task.id)}"
                    aria-label="Aufgabe löschen">×</button>
            </article>
        `).join("");
    }

    function renderWeek() {
        const start = new Date();
        start.setHours(12, 0, 0, 0);

        const days = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);

            const key = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
            ].join("-");

            const tasks = state.tasks.filter(task =>
                task.date === key && !task.done
            );

            days.push(`
                <div class="lc-day">
                    <div class="lc-day-date">
                        <strong>${i === 0 ? "Heute" : esc(formatDate(key))}</strong>
                        <span>${tasks.length} ${tasks.length === 1 ? "Aufgabe" : "Aufgaben"}</span>
                    </div>
                    <div class="lc-day-tasks">
                        ${tasks.length
                            ? tasks.map(task => `<span>${esc(task.title)}</span>`).join("")
                            : `<small class="muted">Keine Aufgaben</small>`}
                    </div>
                </div>
            `);
        }

        $("lcWeek").innerHTML = days.join("");
    }

    function renderTaskSelect() {
        const select = $("lcTimerTask");
        const previous = state.timer.taskId;

        select.innerHTML = `<option value="">Freies Lernen</option>` +
            state.tasks.filter(task => !task.done).map(task => `
                <option value="${esc(task.id)}">${esc(task.title)}</option>
            `).join("");

        select.value = previous;

        select.onchange = () => {
            state.timer.taskId = select.value;
            save();
        };
    }

    function renderAll() {
        if (!$("page-cockpit")) return;

        renderStats();
        renderGoal();
        renderTimer();
        renderTasks();
        renderWeek();
        renderTaskSelect();
        updateTimerButtons();
    }

    function exportData() {
        const blob = new Blob(
            [JSON.stringify(state, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "studyspace-lern cockpit.json".replace(" ", "");
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function importData(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const imported = JSON.parse(await file.text());

            if (
                !imported ||
                !Array.isArray(imported.tasks) ||
                !Array.isArray(imported.sessions)
            ) {
                throw new Error("Die Datei hat nicht das erwartete Format.");
            }

            if (!confirm("Möchtest du die aktuellen Lerncockpit-Daten ersetzen?")) {
                return;
            }

            state = {
                ...defaultData,
                ...imported,
                timer: { ...defaultData.timer, ...(imported.timer || {}) }
            };

            save();
            renderAll();
            alert("Import erfolgreich.");
        } catch (error) {
            alert("Import fehlgeschlagen: " + error.message);
        } finally {
            event.target.value = "";
        }
    }

    function start() {
        createPage();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

    console.log("StudySpace Lerncockpit 1.0 geladen.");
})();




// ======================================================
// VERBINDUNG ZUM DIGITALEN HEFTER (material-reader.js)
// ======================================================
(() => {
    document.addEventListener("click", event => {
        const button = event.target.closest("[data-material-open]");
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        window.dispatchEvent(new CustomEvent("studyspace:open-material", {
            detail: { id: button.getAttribute("data-material-open") }
        }));
    }, true);
})();
