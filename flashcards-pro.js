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
  let currentCardId = null;
  let directionCardId = null;
  let answerShown = false;
  let reviewDirection = "reverse";
  let currentDirection = "forward";
  let difficultOnly = false;
  let recentCardIds = [];

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
          <label class="fcx-field" style="margin-top:12px">Material für neue Karten / Importe (optional)
            <select id="fcx-material"><option value="">Kein bestimmtes Material</option></select>
          </label>
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
              <label class="fcx-field">Französisch<input id="fcx-question" required placeholder="z. B. maison"></label>
              <label class="fcx-field">Deutsch<textarea id="fcx-answer" rows="3" required placeholder="z. B. Haus"></textarea></label>
              <button class="fcx-btn fcx-primary" type="submit">Karte speichern</button>
            </form>
          </section>
        </div>
        <section class="fcx-panel">
          <div class="fcx-panel-head"><div><h2>Adaptives Training</h2><p id="fcx-review-subtitle">Wähle deine Trainingsrichtung.</p></div><span class="fcx-chip" id="fcx-review-count">0 Karten</span></div>
          <div class="fcx-training-settings">
            <label class="fcx-field">Trainingsrichtung
              <select id="fcx-direction" disabled><option value="reverse" selected>Deutsch → Französisch</option></select>
            </label>
            <div class="fcx-progress-box"><div><span>Beherrschung dieses Sets</span><strong id="fcx-mastery-percent">0 %</strong></div><div class="fcx-progress-track"><div id="fcx-mastery-bar"></div></div><small id="fcx-mastery-detail">Noch keine Antworten bewertet.</small></div>
          </div>
          <div class="fcx-review-card"><span id="fcx-review-label">FRANZÖSISCH</span><div id="fcx-review-question">Noch keine Karte in diesem Set.</div><div id="fcx-review-answer" hidden></div></div>
          <div class="fcx-review-actions"><button class="fcx-btn fcx-primary" id="fcx-show-answer" type="button">Antwort zeigen</button></div>
          <div class="fcx-feedback" id="fcx-feedback" hidden><p>Wie gut konntest du die Antwort?</p><button class="fcx-btn fcx-success" id="fcx-knew" type="button">✓ Gewusst</button><button class="fcx-btn fcx-danger" id="fcx-didnt-know" type="button">↻ Nicht gewusst</button></div>
          <p class="fcx-status" id="fcx-feedback-status" aria-live="polite">Nach jeder Antwort bitte ehrlich einschätzen.</p>
        </section>
        <section class="fcx-panel">
          <div class="fcx-panel-head"><div><h2>Deine Karten</h2><p>Schwierige Karten werden automatisch gesammelt und nach sicherem Lernen wieder entfernt.</p></div><span class="fcx-chip" id="fcx-list-count">0 Karten</span></div>
          <div class="fcx-list-tabs"><button class="fcx-btn fcx-primary" id="fcx-all-cards" type="button">Alle Karten</button><button class="fcx-btn" id="fcx-difficult-cards" type="button">⚑ Schwierige Karten <span id="fcx-difficult-count">0</span></button></div>
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
      cards().push({id:makeId(),subjectId,setId,materialId:$("fcx-material").value||"",question:$("fcx-question").value.trim(),answer:$("fcx-answer").value.trim(),known:false});
      save(); e.target.reset(); currentIndex=activeCards().length-1; render();
    });
    // Import-Button wird zentral über den Seiten-Listener behandelt.
    $("fcx-show-answer").addEventListener("click", showAnswer);
    $("fcx-direction").addEventListener("change", e => { reviewDirection=e.target.value; directionCardId=null; answerShown=false; renderReview(activeCards()); });
    $("fcx-knew").addEventListener("click", () => rateCurrent(true));
    $("fcx-didnt-know").addEventListener("click", () => rateCurrent(false));
    $("fcx-all-cards").addEventListener("click", () => { difficultOnly=false; render(); });
    $("fcx-difficult-cards").addEventListener("click", () => { difficultOnly=true; render(); });
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
    const lines=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    const pairs=[];
    let pending=null;
    const clean=value=>value
      .replace(/^\s*(?:[-*•‣▪]|\d+[.)])\s*/,"")
      .replace(/\s+/g," ")
      .trim();

    for(const original of lines) {
      const line=clean(original);
      if(!line) continue;

      // ChatGPT-/Listenformat: „Vokabel … Deutsch: Übersetzung“
      const germanMatch=line.match(/^(.*?)\s*(?:…|\.{2,}|—|–)\s*(?:deutsch|german)\s*[:：]\s*(.+)$/i);
      if(germanMatch) {
        const question=clean(germanMatch[1]);
        const answer=clean(germanMatch[2]);
        if(question&&answer) pairs.push([question,answer]);
        continue;
      }

      // Allgemeine Paare mit expliziten Sprachlabels auf einer Zeile.
      const inline=line.match(/^(?:französisch|français|francais|french)\s*[:：]\s*(.+?)\s+(?:deutsch|german)\s*[:：]\s*(.+)$/i);
      if(inline) {
        pairs.push([clean(inline[1]),clean(inline[2])]);
        continue;
      }

      // Zwei Zeilen mit Sprachlabels.
      const labelled=line.match(/^(französisch|franzosisch|français|francais|deutsch|englisch|english|french|german|vokabel|übersetzung|uebersetzung|wort|begriff)\s*[:：]\s*(.+)$/i);
      if(labelled) {
        const label=labelled[1].toLocaleLowerCase();
        const value=clean(labelled[2]);
        if(!pending) pending={label,value};
        else if(label!==pending.label) { pairs.push([pending.value,value]); pending=null; }
        else pending={label,value};
        continue;
      }

      if(pending) { pairs.push([pending.value,line]); pending=null; continue; }

      // Tabulator, Gedankenstrich, Gleichheitszeichen oder senkrechter Strich.
      const parts=line.split(/\s*(?:\t|\s+[–—=|]\s+|\s+-\s+)\s*/).filter(Boolean);
      if(parts.length===2) pairs.push([clean(parts[0]),clean(parts[1])]);
    }
    return pairs.filter(pair=>pair[0]&&pair[1]);
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
      cards().push({id:makeId(),subjectId,setId,materialId:$("fcx-material").value||"",question,answer,known:false});
      added++;
    });
    save(); $("fcx-bulk-text").value="";
    $("fcx-import-status").textContent=added+" Karteikarte(n) hinzugefügt"+(duplicates?", "+duplicates+" Duplikat(e) übersprungen":"")+".";
    currentIndex=0; currentCardId=null; render();
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
    const materialSelect=$("fcx-material");
    const previousMaterial=materialSelect.value;
    const availableMaterials=(data.materials||[]).filter(m=>m.subjectId===subjectId);
    materialSelect.innerHTML='<option value="">Kein bestimmtes Material</option>'+availableMaterials.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name||m.fileName||"Material")+'</option>').join("");
    materialSelect.value=availableMaterials.some(m=>m.id===previousMaterial)?previousMaterial:"";
    const set=activeSet(),list=activeCards();
    if(currentCardId && !list.some(c=>c.id===currentCardId))currentCardId=null;
    $("fcx-set-info").innerHTML=set?'<strong>'+esc(set.name)+'</strong><span>'+list.length+' Karte(n) · Fach: '+esc(subjects().find(s=>s.id===subjectId)?.name||"")+'</span>':'<span>Erstelle ein Lernset für das ausgewählte Fach.</span>';
    $("fcx-rename-set").disabled=!set; $("fcx-delete-set").disabled=!set;
    const difficult=list.filter(isDifficultCard);
    const attempted=list.filter(c=>statsFor(c).attempts>0);
    const mastered=list.filter(isMasteredCard);
    const mastery=list.length?Math.round(list.reduce((sum,card)=>{const st=statsFor(card);if(isMasteredCard(card))return sum+100;const accuracy=st.attempts?st.correct/st.attempts:0;return sum+(st.attempts?Math.min(95,Math.round((Math.min(st.streak,3)/3)*85+accuracy*10)):0);},0)/list.length):0;
    $("fcx-review-count").textContent=list.length+" Karten";
    $("fcx-list-count").textContent=(difficultOnly?difficult.length:list.length)+" Karten";
    $("fcx-difficult-count").textContent=difficult.length;
    $("fcx-mastery-percent").textContent=mastery+" %";
    $("fcx-mastery-bar").style.setProperty("width",mastery+"%","important");
    $("fcx-mastery-bar").setAttribute("aria-valuenow",String(mastery));
    $("fcx-mastery-detail").textContent=attempted.length?mastered.length+" von "+list.length+" Karten sicher gelernt · "+difficult.length+" noch schwierig":"Noch keine Antworten bewertet.";
    $("fcx-review-subtitle").textContent=set?esc(subjects().find(s=>s.id===subjectId)?.name||"")+" · "+esc(set.name):"Wähle ein Fach und erstelle ein Lernset.";
    $("fcx-direction").value=reviewDirection;
    $("fcx-all-cards").classList.toggle("fcx-primary",!difficultOnly);
    $("fcx-difficult-cards").classList.toggle("fcx-primary",difficultOnly);
    renderReview(list);
    const shown=difficultOnly?difficult:list;
    $("fcx-card-list").innerHTML=shown.length?shown.map(c=>{const st=statsFor(c);const pct=st.attempts?Math.round(st.correct/st.attempts*100):0;return '<div class="fcx-list-item"><div><strong>'+esc(c.question)+'</strong><small>'+esc(c.answer)+'</small><small>'+ (st.attempts?pct+' % richtig · '+st.attempts+' Versuche':'Noch nicht trainiert')+(isDifficultCard(c)?' · ⚑ Noch unsicher':isMasteredCard(c)?' · ✓ Beherrscht':'')+'</small></div><div class="fcx-list-buttons"><button class="fcx-btn" data-edit="'+esc(c.id)+'">Bearbeiten</button><button class="fcx-btn fcx-danger" data-delete="'+esc(c.id)+'">Löschen</button></div></div>';}).join(""):'<div class="fcx-empty">'+(difficultOnly?'Aktuell keine schwierigen Karten. Sehr gut!':'In diesem Set sind noch keine Karten.')+'</div>';
    $("fcx-card-list").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editCard(b.dataset.edit)));
    $("fcx-card-list").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteCard(b.dataset.delete)));
    $("fcx-subject").disabled=!subjects().length;
    $("fcx-new-set").disabled=!subjects().length;
  }
  function statsFor(card) {
    if(!card.studyStats) card.studyStats={attempts:0,correct:0,wrong:0,streak:0,history:[]};
    const st=card.studyStats;
    if(!Array.isArray(st.history))st.history=[];
    return st;
  }
  function recentAccuracy(card) {
    const history=statsFor(card).history.slice(-5);
    return history.length?history.filter(Boolean).length/history.length:0;
  }
  function isMasteredCard(card) {
    const st=statsFor(card);
    return st.attempts>=4 && st.streak>=3 && recentAccuracy(card)>=0.8;
  }
  function isDifficultCard(card) {
    const st=statsFor(card);
    return st.attempts>=2 && !isMasteredCard(card) && (recentAccuracy(card)<0.7 || st.streak===0);
  }
  function chooseNextCard(list) {
    if(!list.length)return null;
    let pool=list.filter(c=>!recentCardIds.slice(-2).includes(c.id));
    if(!pool.length)pool=list;
    const weights=pool.map(c=>{const st=statsFor(c);const accuracy=st.attempts?st.correct/st.attempts:0.5;return 1+(1-accuracy)*4+Math.min(st.wrong,8)*0.25+(st.streak===0&&st.attempts?1:0);});
    const total=weights.reduce((a,b)=>a+b,0);let pick=Math.random()*total;
    for(let i=0;i<pool.length;i++){pick-=weights[i];if(pick<=0)return pool[i];}
    return pool[0];
  }
  function renderReview(list) {
    if(!list.length){$("fcx-review-question").textContent="Noch keine Karte in diesem Set.";$("fcx-review-answer").hidden=true;$("fcx-review-answer").textContent="";$("fcx-feedback").hidden=true;answerShown=false;return;}
    if(!currentCardId || !list.some(c=>c.id===currentCardId)) currentCardId=chooseNextCard(list)?.id;
    const card=list.find(c=>c.id===currentCardId)||list[0];
    if(directionCardId!==card.id){currentDirection=reviewDirection==="mixed"?(Math.random()<0.5?"forward":"reverse"):reviewDirection;directionCardId=card.id;}
    const question=card.answer;
    const answer=card.question;
    $("fcx-review-label").textContent="DEUTSCH → FRANZÖSISCH";
    $("fcx-review-question").textContent=question;
    $("fcx-review-answer").textContent=answer;
    $("fcx-review-answer").hidden=!answerShown;
    $("fcx-feedback").hidden=!answerShown;
    $("fcx-show-answer").hidden=answerShown;
  }
  function showAnswer() { const list=activeCards();if(!list.length)return;answerShown=true;renderReview(list); }
  function rateCurrent(knew) {
    const list=activeCards();const card=list.find(c=>c.id===currentCardId);if(!card||!answerShown)return;
    const st=statsFor(card);st.attempts++;if(knew){st.correct++;st.streak++;}else{st.wrong++;st.streak=0;}
    st.history.push(!!knew);if(st.history.length>20)st.history=st.history.slice(-20);
    st.lastReviewed=Date.now();
    if(window.StudySpaceScheduler) window.StudySpaceScheduler.review(card,knew);
    recentCardIds.push(card.id);if(recentCardIds.length>3)recentCardIds.shift();
    save();
    const rate=st.attempts?Math.round(st.correct/st.attempts*100):0;
    $("fcx-feedback-status").textContent=knew?"Gespeichert: "+rate+" % richtig · "+(isMasteredCard(card)?"Karte jetzt sicher beherrscht.":"Diese Karte kommt später wieder."):"Gespeichert: "+rate+" % richtig · Diese Karte wird häufiger wiederholt.";
    currentCardId=chooseNextCard(list.filter(c=>c.id!==card.id))?.id||chooseNextCard(list)?.id;
    directionCardId=null;
    answerShown=false;render();
  }
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

  // Robuster Import-Klick: funktioniert auch dann, wenn andere App-Skripte
  // einzelne Elemente neu rendern oder Event-Listener überschreiben.
  page.addEventListener("click", event => {
    const button = event.target.closest("#fcx-import-text");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const status = $("fcx-import-status");
    try {
      importText();
    } catch (error) {
      console.error("StudySpace Textimport fehlgeschlagen:", error);
      if (status) status.textContent = "Beim Import ist ein Fehler aufgetreten. Bitte prüfe, ob ein Fach und ein Lernset ausgewählt sind.";
    }
  }, true);

  build();
  render();
  console.log("StudySpace Karteikarten: Textimport aktiv.");
})();
