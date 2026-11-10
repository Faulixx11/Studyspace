/* StudySpace – Karteikarten mit Fächern, Lernsets und Texteingabe */
(() => {
  "use strict";
  const page = document.getElementById("page-flashcards");
  if (!page) return;
  const KEY = "studySpaceFlashcardsTextSets_v1";
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const makeId = () => "fc_" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch {}
  let sets = Array.isArray(saved.sets) ? saved.sets : [];
  let subjectId = "";
  let setId = "";
  let currentIndex = 0;
  let answerShown = false;

  const subjects = () => Array.isArray(data.subjects) ? data.subjects : [];
  const cards = () => Array.isArray(data.flashcards) ? data.flashcards : [];
  const subjectSets = () => sets.filter(s => s.subjectId === subjectId);
  const activeSet = () => sets.find(s => s.id === setId && s.subjectId === subjectId);
  const activeCards = () => cards().filter(c => c.setId === setId);
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({sets}));
      saveData();
      return true;
    } catch (error) {
      console.error(error);
      alert("Speichern fehlgeschlagen. Bitte prüfe den Browserspeicher.");
      return false;
    }
  };

  function build() {
    page.innerHTML = `
      <div class="fcx-wrap">
        <section class="fcx-hero"><div><span class="fcx-kicker">DEIN LERNBEREICH</span><h1>Karteikarten</h1><p>Erstelle Fächer-Sets, trage Karten selbst ein oder füge eine ganze Vokabelliste als Text ein.</p></div><div class="fcx-hero-icon">▣</div></section>
        <section class="fcx-panel">
          <div class="fcx-panel-head"><div><h2>Fach und Lernset</h2><p>Jedes Set gehört zu genau einem Fach und kann frei benannt werden.</p></div></div>
          <div class="fcx-set-row">
            <label class="fcx-field">Fach auswählen<select id="fcx-subject"></select></label>
            <label class="fcx-field">Lernset auswählen<select id="fcx-set"></select></label>
            <button class="fcx-btn fcx-primary" id="fcx-new-set" type="button">+ Set erstellen</button>
          </div>
          <div class="fcx-set-detail" id="fcx-set-info"></div>
          <div class="fcx-set-actions"><button class="fcx-btn" id="fcx-rename-set" type="button">Set umbenennen</button><button class="fcx-btn fcx-danger" id="fcx-delete-set" type="button">Set löschen</button></div>
        </section>
        <div class="fcx-columns">
          <section class="fcx-panel">
            <div class="fcx-panel-head"><div><h2>Mehrere Vokabeln auf einmal</h2><p>Füge einen Text ein. StudySpace erkennt die zusammengehörigen Begriffe.</p></div></div>
            <label class="fcx-field">Vokabelliste einfügen<textarea id="fcx-bulk-text" rows="10" placeholder="Französisch: maison&#10;Deutsch: Haus&#10;&#10;Französisch: chien&#10;Deutsch: Hund&#10;&#10;Oder: maison – Haus"></textarea></label>
            <p class="fcx-help">Unterstützt zum Beispiel „Französisch: maison / Deutsch: Haus“, zwei beschriftete Zeilen pro Paar, Tabulatoren oder „maison – Haus“.</p>
            <button class="fcx-btn fcx-primary fcx-block" id="fcx-import-text" type="button">Vokabeln erkennen und hinzufügen</button>
            <div id="fcx-import-status" class="fcx-status" aria-live="polite"></div>
          </section>
          <section class="fcx-panel">
            <div class="fcx-panel-head"><div><h2>Einzelne Karte erstellen</h2><p>Für eigene Fragen, Antworten oder einzelne Vokabeln.</p></div></div>
            <form id="fcx-card-form" class="fcx-form">
              <label class="fcx-field">Vorderseite / Begriff<input id="fcx-question" required placeholder="z. B. maison"></label>
              <label class="fcx-field">Rückseite / Übersetzung<textarea id="fcx-answer" rows="3" required placeholder="z. B. Haus"></textarea></label>
              <button class="fcx-btn fcx-primary" type="submit">Karte speichern</button>
            </form>
          </section>
        </div>
        <section class="fcx-panel">
          <div class="fcx-panel-head"><div><h2>Wiederholen</h2><p id="fcx-review-subtitle">Wähle ein Fach und ein Set aus.</p></div><span class="fcx-chip" id="fcx-review-count">0 Karten</span></div>
          <div class="fcx-review-card"><span>VORDERSEITE</span><div id="fcx-review-question">Noch keine Karte in diesem Set.</div><div id="fcx-review-answer" hidden></div></div>
          <div class="fcx-review-actions"><button class="fcx-btn" id="fcx-show-answer" type="button">Antwort zeigen</button><button class="fcx-btn fcx-primary" id="fcx-next-card" type="button">Nächste Karte →</button></div>
        </section>
        <section class="fcx-panel">
          <div class="fcx-panel-head"><div><h2>Karten in diesem Set</h2><p>Du kannst jeden Eintrag bearbeiten oder löschen.</p></div><span class="fcx-chip" id="fcx-list-count">0 Karten</span></div>
          <div id="fcx-card-list" class="fcx-card-list"></div>
        </section>
      </div>`;

    $("fcx-subject").addEventListener("change", e => {
      subjectId = e.target.value;
      setId = subjectSets()[0]?.id || "";
      render();
    });
    $("fcx-set").addEventListener("change", e => { setId=e.target.value; currentIndex=0; render(); });
    $("fcx-new-set").addEventListener("click", createSet);
    $("fcx-rename-set").addEventListener("click", renameSet);
    $("fcx-delete-set").addEventListener("click", deleteSet);
    $("fcx-card-form").addEventListener("submit", e => {
      e.preventDefault();
      if (!requireSet()) return;
      cards().push({id:makeId(),subjectId,setId,question:$("fcx-question").value.trim(),answer:$("fcx-answer").value.trim(),known:false});
      save(); e.target.reset(); currentIndex=activeCards().length-1; render();
    });
    $("fcx-import-text").addEventListener("click", importText);
    $("fcx-show-answer").addEventListener("click", showAnswer);
    $("fcx-next-card").addEventListener("click", nextCard);
  }

  function requireSet() {
    if (!subjectId || !activeSet()) { alert("Wähle zuerst ein Fach und erstelle ein Lernset."); return false; }
    return true;
  }
  function createSet() {
    if (!subjects().length) { alert("Lege zuerst unter „Meine Fächer“ ein Fach an."); return; }
    if (!subjectId) subjectId=subjects()[0].id;
    const name=prompt("Wie soll dein neues Lernset heißen?", "Neue Vokabeln");
    if (name===null) return;
    if (!name.trim()) { alert("Bitte gib einen Namen ein."); return; }
    const set={id:makeId(),subjectId,name:name.trim(),createdAt:Date.now()};
    sets.push(set); setId=set.id; save(); render();
  }
  function renameSet() {
    const set=activeSet(); if(!set)return;
    const name=prompt("Neuer Name für das Lernset:",set.name);
    if(name===null)return;
    if(!name.trim()){alert("Bitte gib einen Namen ein.");return;}
    set.name=name.trim(); save(); render();
  }
  function deleteSet() {
    const set=activeSet(); if(!set)return;
    const count=activeCards().length;
    if(!confirm("Lernset „"+set.name+"“ und "+count+" Karte(n) wirklich löschen?"))return;
    const ids=new Set(activeCards().map(c=>c.id));
    data.flashcards=cards().filter(c=>!ids.has(c.id));
    sets=sets.filter(s=>s.id!==set.id);
    setId=subjectSets()[0]?.id||""; currentIndex=0; save(); render();
  }

  function parseText(raw) {
    const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const pairs=[];
    const labelPattern=/^(?:französisch|franzosisch|français|francais|deutsch|englisch|english|french|german|vokabel|übersetzung|uebersetzung|wort|begriff)\s*[:：]\s*(.+)$/i;
    let pending=null;
    for(const line of lines) {
      const labelled=line.match(labelPattern);
      if(labelled) {
        const label=line.slice(0,line.indexOf(":")>=0?line.indexOf(":"):line.indexOf("：")).toLowerCase();
        const value=labelled[1].trim();
        if(!pending) pending={label,value};
        else if(label!==pending.label) { pairs.push([pending.value,value]); pending=null; }
        else { pending={label,value}; }
        continue;
      }
      if(pending) { pairs.push([pending.value,line]); pending=null; continue; }
      let parts=line.split(/\s*(?:\t|\s+[–—=|]\s+|\s+-\s+)\s*/).filter(Boolean);
      if(parts.length===2) pairs.push([parts[0].trim(),parts[1].trim()]);
      else if(line.includes("\t")) { parts=line.split("\t").map(x=>x.trim()).filter(Boolean); if(parts.length>=2)pairs.push([parts[0],parts.slice(1).join(" ") ]); }
    }
    return pairs.filter(p=>p[0]&&p[1]);
  }

  function importText() {
    if(!requireSet())return;
    const raw=$("fcx-bulk-text").value.trim();
    if(!raw){$("fcx-import-status").textContent="Füge zuerst eine Vokabelliste ein.";return;}
    const pairs=parseText(raw);
    if(!pairs.length){$("fcx-import-status").textContent="Ich konnte keine Paare erkennen. Nutze z. B. „Französisch: maison“ und darunter „Deutsch: Haus“ oder „maison – Haus“.";return;}
    const existing=new Set(activeCards().map(c=>c.question.toLocaleLowerCase()+"|"+c.answer.toLocaleLowerCase()));
    let added=0,duplicates=0;
    pairs.forEach(([question,answer])=>{
      const key=question.toLocaleLowerCase()+"|"+answer.toLocaleLowerCase();
      if(existing.has(key)){duplicates++;return;}
      existing.add(key);
      cards().push({id:makeId(),subjectId,setId,question,answer,known:false});
      added++;
    });
    save(); $("fcx-bulk-text").value="";
    $("fcx-import-status").textContent=added+" Karteikarte(n) hinzugefügt"+(duplicates?", "+duplicates+" Duplikat(e) übersprungen":"")+".";
    currentIndex=0; render();
  }

  function render() {
    const subjectSelect=$("fcx-subject"),setSelect=$("fcx-set");
    subjectSelect.innerHTML=subjects().map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join("");
    if(!subjects().some(s=>s.id===subjectId)) subjectId=subjects()[0]?.id||"";
    subjectSelect.value=subjectId;
    const available=subjectSets();
    if(!available.some(s=>s.id===setId)) setId=available[0]?.id||"";
    setSelect.innerHTML=available.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join("") || '<option value="">Noch kein Lernset</option>';
    setSelect.value=setId;
    const set=activeSet(),list=activeCards();
    $("fcx-set-info").innerHTML=set?'<strong>'+esc(set.name)+'</strong><span>'+list.length+' Karte(n) · Fach: '+esc(subjects().find(s=>s.id===subjectId)?.name||"")+'</span>':'<span>Erstelle ein Lernset für das ausgewählte Fach.</span>';
    $("fcx-rename-set").disabled=!set; $("fcx-delete-set").disabled=!set;
    $("fcx-review-count").textContent=list.length+" Karten";
    $("fcx-list-count").textContent=list.length+" Karten";
    $("fcx-review-subtitle").textContent=set?esc(subjects().find(s=>s.id===subjectId)?.name||"")+" · "+esc(set.name):"Wähle ein Fach und erstelle ein Lernset.";
    renderReview(list);
    $("fcx-card-list").innerHTML=list.length?list.map((c,i)=>'<div class="fcx-list-item"><div><strong>'+esc(c.question)+'</strong><small>'+esc(c.answer)+'</small></div><div class="fcx-list-buttons"><button class="fcx-btn" data-edit="'+esc(c.id)+'">Bearbeiten</button><button class="fcx-btn fcx-danger" data-delete="'+esc(c.id)+'">Löschen</button></div></div>').join(""):'<div class="fcx-empty">In diesem Set sind noch keine Karten.</div>';
    $("fcx-card-list").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editCard(b.dataset.edit)));
    $("fcx-card-list").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteCard(b.dataset.delete)));
    $("fcx-subject").disabled=!subjects().length;
    $("fcx-new-set").disabled=!subjects().length;
  }
  function renderReview(list) {
    if(!list.length){$("fcx-review-question").textContent="Noch keine Karte in diesem Set."; $("fcx-review-answer").hidden=true; $("fcx-review-answer").textContent=""; answerShown=false; return;}
    if(currentIndex>=list.length)currentIndex=0;
    const card=list[currentIndex];
    $("fcx-review-question").textContent=card.question;
    $("fcx-review-answer").textContent=card.answer;
    $("fcx-review-answer").hidden=!answerShown;
  }
  function showAnswer() { const list=activeCards(); if(!list.length)return; answerShown=true; renderReview(list); }
  function nextCard() { const list=activeCards(); if(!list.length)return; currentIndex=(currentIndex+1)%list.length; answerShown=false; renderReview(list); }
  function editCard(id) {
    const card=cards().find(c=>c.id===id); if(!card)return;
    const q=prompt("Vorderseite bearbeiten:",card.question); if(q===null)return;
    const a=prompt("Rückseite bearbeiten:",card.answer); if(a===null)return;
    if(!q.trim()||!a.trim()){alert("Beide Seiten müssen ausgefüllt sein.");return;}
    card.question=q.trim();card.answer=a.trim();save();render();
  }
  function deleteCard(id) {
    if(!confirm("Diese Karteikarte wirklich löschen?"))return;
    data.flashcards=cards().filter(c=>c.id!==id);save();render();
  }

  build();
  render();
  console.log("StudySpace Karteikarten: Textimport aktiv.");
})();
