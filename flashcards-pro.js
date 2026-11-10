/* StudySpace – einheitliche Karteikartenoberfläche + Foto-OCR */
(() => {
  "use strict";
  const page = document.getElementById("page-flashcards");
  if (!page) return;

  const KEY = "studySpaceFlashcards2";
  const $ = id => document.getElementById(id);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch {}
  const state = {
    sets: Array.isArray(saved.sets) ? saved.sets : [],
    meta: saved.meta && typeof saved.meta === "object" ? saved.meta : {},
    selectedSetId: saved.selectedSetId || null,
    history: Array.isArray(saved.history) ? saved.history : []
  };
  let currentCardId = null;
  let answerShown = false;
  let uploads = [];
  let candidates = [];
  let cropTarget = null;
  let cropStart = null;
  let cropRect = null;
  let workerPromise = null;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[c]);
  const id = () => "fc_" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const cards = () => Array.isArray(data.flashcards) ? data.flashcards : [];
  const subjects = () => Array.isArray(data.subjects) ? data.subjects : [];
  const subjectName = sid => subjects().find(s => s.id === sid)?.name || "Allgemein";
  const selectedSet = () => state.sets.find(s => s.id === state.selectedSetId) || null;
  const cardsInSet = sid => cards().filter(c => state.meta[c.id]?.setId === sid);
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      saveData();
      return true;
    } catch (e) { console.error(e); alert("Speichern fehlgeschlagen. Bitte prüfe deinen Browserspeicher."); return false; }
  };

  function ensureSets() {
    subjects().forEach(subject => {
      let set = state.sets.find(s => s.subjectId === subject.id && s.isDefault);
      if (!set) {
        set = { id:id(), name:"Allgemein", subjectId:subject.id, isDefault:true, createdAt:Date.now() };
        state.sets.push(set);
      }
    });
    cards().forEach(card => {
      if (!state.meta[card.id]) {
        let set = state.sets.find(s => s.subjectId === card.subjectId && s.isDefault);
        if (!set) {
          set = { id:id(), name:"Allgemein", subjectId:card.subjectId || "", isDefault:true, createdAt:Date.now() };
          state.sets.push(set);
        }
        state.meta[card.id] = { setId:set.id, interval:0, repetitions:0, ease:2.5, dueAt:0, lastReviewed:null };
      }
    });
    if (!state.sets.some(s => s.id === state.selectedSetId)) state.selectedSetId = state.sets[0]?.id || null;
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function build() {
    page.innerHTML = '<div class="fcx-wrap">' +
      '<section class="fcx-hero"><div><span class="fcx-kicker">DEIN LERNBEREICH</span><h1>Karteikarten</h1><p>Sets auswählen, Material hochladen und daraus überprüfbare Lernkarten erstellen.</p></div><div class="fcx-hero-icon">▣</div></section>' +
      '<section class="fcx-stats"><div><span>Lernsets</span><strong id="fcx-set-count">0</strong></div><div><span>Karten im Set</span><strong id="fcx-card-count">0</strong></div><div><span>Heute fällig</span><strong id="fcx-due-count">0</strong></div></section>' +
      '<section class="fcx-panel"><div class="fcx-panel-head"><div><h2>Deine Lernsets</h2><p>Wähle ein Set oder erstelle ein neues für ein bestimmtes Thema.</p></div></div>' +
      '<div class="fcx-set-row"><label class="fcx-field">Aktives Lernset<select id="fcx-set-select"></select></label><button class="fcx-btn fcx-primary" id="fcx-new-set">+ Neues Set</button></div>' +
      '<div id="fcx-set-detail" class="fcx-set-detail"></div></section>' +
      '<div class="fcx-columns"><section class="fcx-panel"><div class="fcx-panel-head"><div><h2>Material in Karten umwandeln</h2><p>Fotos, Screenshots oder Bildausschnitte hinzufügen.</p></div><span class="fcx-chip">OCR im Browser</span></div>' +
      '<label class="fcx-drop" id="fcx-drop"><input id="fcx-files" type="file" accept="image/jpeg,image/png,image/webp,image/bmp" multiple><span class="fcx-upload-icon">＋</span><strong>Bilder hier ablegen oder auswählen</strong><small>JPG, PNG, WEBP · mehrere Bilder gleichzeitig</small></label>' +
      '<div id="fcx-upload-list" class="fcx-upload-list"></div>' +
      '<div class="fcx-ocr-options"><label class="fcx-field">Sprache erkennen<select id="fcx-language"><option value="auto">Automatisch: Deutsch oder Englisch</option><option value="deu">Deutsch</option><option value="eng">Englisch</option><option value="fra">Französisch</option></select></label><p>Die Texterkennung läuft lokal in deinem Browser. Beim ersten Start werden die Sprachdaten geladen. Handschrift kann Fehler enthalten.</p></div>' +
      '<button class="fcx-btn fcx-primary fcx-block" id="fcx-run-ocr" disabled>Text aus Bildern erkennen</button><div id="fcx-ocr-status" class="fcx-status" aria-live="polite"></div>' +
      '<div id="fcx-text-review" class="fcx-text-review" hidden><label class="fcx-field">Erkannter Text – bitte Fehler korrigieren<textarea id="fcx-recognized-text" rows="8"></textarea></label><button class="fcx-btn" id="fcx-make-cards">Lernkarten vorschlagen</button></div>' +
      '</section><section class="fcx-panel"><div class="fcx-panel-head"><div><h2>Karte manuell erstellen</h2><p>Ergänze oder korrigiere Karten selbst.</p></div></div>' +
      '<form id="fcx-card-form" class="fcx-form"><label class="fcx-field">Frage<input id="fcx-question" required placeholder="Was möchtest du wissen?"></label><label class="fcx-field">Antwort<textarea id="fcx-answer" rows="4" required placeholder="Kurze, verständliche Antwort"></textarea></label><button class="fcx-btn fcx-primary" type="submit">Karte speichern</button></form>' +
      '<div class="fcx-note"><strong>Wichtig:</strong> Erkannte Vorschläge werden nicht ungeprüft gespeichert. Du kannst jede Frage und Antwort vorher bearbeiten.</div></section></div>' +
      '<section class="fcx-panel"><div class="fcx-panel-head"><div><h2>Wiederholen</h2><p id="fcx-review-subtitle">Karten des ausgewählten Sets lernen.</p></div><span class="fcx-chip" id="fcx-review-count">0 Karten</span></div>' +
      '<div class="fcx-review-card"><span>FRAGE</span><div id="fcx-review-question">Wähle ein Lernset mit Karten aus.</div><div id="fcx-review-answer" hidden></div></div>' +
      '<div class="fcx-review-actions"><button class="fcx-btn" id="fcx-show-answer">Antwort zeigen</button><div id="fcx-ratings" hidden><button class="fcx-btn fcx-again" data-rate="again">Nochmal</button><button class="fcx-btn" data-rate="hard">Schwer</button><button class="fcx-btn" data-rate="good">Gut</button><button class="fcx-btn fcx-easy" data-rate="easy">Einfach</button></div></div>' +
      '</section><section class="fcx-panel"><div class="fcx-panel-head"><div><h2>Karten in diesem Set</h2><p>Bearbeite oder entferne einzelne Karten.</p></div><span class="fcx-chip" id="fcx-list-count">0</span></div><div id="fcx-card-list" class="fcx-card-list"></div></section>' +
      '<div id="fcx-crop-modal" class="fcx-modal" hidden><div class="fcx-modal-card"><div class="fcx-panel-head"><div><h2>Bildausschnitt wählen</h2><p>Ziehe mit der Maus oder dem Finger einen Rahmen um den relevanten Text.</p></div><button class="fcx-btn" id="fcx-crop-close">Schließen</button></div><div id="fcx-crop-stage"><img id="fcx-crop-image" alt="Bild zum Zuschneiden"><div id="fcx-crop-selection"></div></div><div class="fcx-modal-actions"><button class="fcx-btn" id="fcx-crop-reset">Gesamtes Bild</button><button class="fcx-btn fcx-primary" id="fcx-crop-save">Ausschnitt übernehmen</button></div></div></div>' +
      '<section id="fcx-candidates" class="fcx-panel" hidden><div class="fcx-panel-head"><div><h2>Vorgeschlagene Karteikarten</h2><p>Prüfe jede Karte. Nicht passende Vorschläge kannst du abwählen.</p></div><span class="fcx-chip" id="fcx-candidate-count"></span></div><div id="fcx-candidate-list"></div><button class="fcx-btn fcx-primary fcx-block" id="fcx-save-candidates">Ausgewählte Karten ins Set übernehmen</button></section>' +
      '</div>';

    $("fcx-set-select").addEventListener("change", e => { state.selectedSetId=e.target.value; currentCardId=null; save(); render(); });
    $("fcx-new-set").addEventListener("click", createSet);
    $("fcx-files").addEventListener("change", e => addFiles(e.target.files));
    $("fcx-drop").addEventListener("dragover", e => { e.preventDefault(); $("fcx-drop").classList.add("dragging"); });
    $("fcx-drop").addEventListener("dragleave", () => $("fcx-drop").classList.remove("dragging"));
    $("fcx-drop").addEventListener("drop", e => { e.preventDefault(); $("fcx-drop").classList.remove("dragging"); addFiles(e.dataTransfer.files); });
    $("fcx-run-ocr").addEventListener("click", runOCR);
    $("fcx-make-cards").addEventListener("click", () => proposeCards($("fcx-recognized-text").value));
    $("fcx-card-form").addEventListener("submit", e => {
      e.preventDefault(); const set=selectedSet(); if(!set){alert("Bitte zuerst ein Lernset auswählen.");return;}
      addCard($("fcx-question").value.trim(), $("fcx-answer").value.trim(), set.id);
      e.target.reset(); render();
    });
    $("fcx-show-answer").addEventListener("click", () => { const card=cards().find(c=>c.id===currentCardId); if(!card)return; $("fcx-review-answer").textContent=card.answer; $("fcx-review-answer").hidden=false; $("fcx-ratings").hidden=false; $("fcx-show-answer").hidden=true; answerShown=true; });
    $("fcx-ratings").addEventListener("click", e => { const btn=e.target.closest("[data-rate]"); if(btn) rateCard(btn.dataset.rate); });
    $("fcx-card-list").addEventListener("click", e => {
      const btn=e.target.closest("[data-card-action]"); if(!btn)return;
      const card=cards().find(c=>c.id===btn.dataset.id); if(!card)return;
      if(btn.dataset.cardAction==="delete"){ if(!confirm("Diese Karte wirklich löschen?"))return; data.flashcards=data.flashcards.filter(c=>c.id!==card.id); delete state.meta[card.id]; save(); render(); }
      if(btn.dataset.cardAction==="edit"){ const q=prompt("Frage bearbeiten:",card.question); if(q===null)return; const a=prompt("Antwort bearbeiten:",card.answer); if(a===null)return; if(!q.trim()||!a.trim())return alert("Beide Felder müssen ausgefüllt sein."); card.question=q.trim(); card.answer=a.trim(); save(); render(); }
    });
    $("fcx-candidate-list").addEventListener("click", e => {
      if(e.target.matches("[data-remove-candidate]")) { candidates.splice(Number(e.target.dataset.removeCandidate),1); renderCandidates(); }
    });
    $("fcx-save-candidates").addEventListener("click", saveCandidates);
    $("fcx-crop-close").addEventListener("click", closeCrop);
    $("fcx-crop-reset").addEventListener("click", () => { cropRect=null; drawCropSelection(); });
    $("fcx-crop-save").addEventListener("click", saveCrop);
    const stage=$("fcx-crop-stage");
    stage.addEventListener("pointerdown", cropDown);
    stage.addEventListener("pointermove", cropMove);
    stage.addEventListener("pointerup", cropUp);
    stage.addEventListener("pointercancel", cropUp);
    render();
  }

  function createSet() {
    if(!subjects().length){alert("Lege zuerst unter „Meine Fächer“ ein Fach an.");return;}
    const name=prompt("Wie soll das Lernset heißen?"); if(!name?.trim())return;
    const subjectOptions=subjects().map((s,i)=>(i+1)+". "+s.name).join("\n");
    const choice=prompt("Zu welchem Fach gehört das Set?\n"+subjectOptions,"1");
    const subject=subjects()[Number(choice)-1]; if(!subject){alert("Bitte eine gültige Nummer eingeben.");return;}
    const set={id:id(),name:name.trim(),subjectId:subject.id,isDefault:false,createdAt:Date.now()};
    state.sets.push(set); state.selectedSetId=set.id; save(); render();
  }

  function addCard(question,answer,setId) {
    if(!question||!answer)return;
    const set=state.sets.find(s=>s.id===setId); if(!set)return;
    const card={id:id(),question,answer,subjectId:set.subjectId,known:false};
    data.flashcards.push(card);
    state.meta[card.id]={setId,interval:0,repetitions:0,ease:2.5,dueAt:0,lastReviewed:null};
    save();
  }

  function render() {
    const select=$("fcx-set-select"); if(!select)return;
    select.innerHTML=state.sets.map(s=>'<option value="'+esc(s.id)+'">'+esc(subjectName(s.subjectId))+' · '+esc(s.name)+'</option>').join("");
    if(!state.sets.length) select.innerHTML='<option value="">Noch keine Sets</option>';
    select.value=state.selectedSetId||"";
    const set=selectedSet(); const list=set?cardsInSet(set.id):[];
    const due=list.filter(c=>(state.meta[c.id]?.dueAt||0)<=Date.now());
    $("fcx-set-count").textContent=state.sets.length;
    $("fcx-card-count").textContent=list.length;
    $("fcx-due-count").textContent=due.length;
    $("fcx-set-detail").innerHTML=set?'<strong>'+esc(set.name)+'</strong><span>'+esc(subjectName(set.subjectId))+' · '+list.length+' Karten</span>':'<span>Lege zuerst ein Fach und ein Lernset an.</span>';
    $("fcx-review-subtitle").textContent=set?"Aktives Set: "+set.name:"Kein Lernset ausgewählt";
    $("fcx-review-count").textContent=list.length+" Karten";
    $("fcx-list-count").textContent=list.length;
    renderList(list);
    if(!list.some(c=>c.id===currentCardId))currentCardId=(due[0]||list[0])?.id||null;
    showCard();
    $("fcx-run-ocr").disabled=!set||!uploads.length;
    $("fcx-new-set").disabled=!subjects().length;
  }

  function renderList(list) {
    $("fcx-card-list").innerHTML=list.length?list.map(c=>'<div class="fcx-list-item"><div><strong>'+esc(c.question)+'</strong><small>'+esc(c.answer.slice(0,120))+'</small></div><div class="fcx-list-buttons"><button class="fcx-btn" data-card-action="edit" data-id="'+esc(c.id)+'">Bearbeiten</button><button class="fcx-btn fcx-danger" data-card-action="delete" data-id="'+esc(c.id)+'">Löschen</button></div></div>').join(""):'<div class="fcx-empty">In diesem Set sind noch keine Karten.</div>';
  }
  function showCard() {
    const c=cards().find(x=>x.id===currentCardId);
    $("fcx-review-question").textContent=c?c.question:"Noch keine Karte in diesem Set.";
    $("fcx-review-answer").textContent=c?.answer||"";
    $("fcx-review-answer").hidden=true; $("fcx-ratings").hidden=true; $("fcx-show-answer").hidden=!c; answerShown=false;
  }
  function rateCard(rating) {
    const c=cards().find(x=>x.id===currentCardId); if(!c)return;
    const m=state.meta[c.id]||(state.meta[c.id]={setId:state.selectedSetId,interval:0,repetitions:0,ease:2.5,dueAt:0});
    const days={again:0,hard:1,good:m.repetitions===0?1:m.repetitions===1?3:Math.max(4,Math.round((m.interval||1)*m.ease)),easy:m.repetitions===0?3:Math.max(5,Math.round((m.interval||1)*m.ease*1.3))};
    m.interval=days[rating]; m.repetitions=rating==="again"?0:m.repetitions+1; m.ease=Math.max(1.3,m.ease+(rating==="easy"?0.15:rating==="hard"?-0.15:rating==="again"?-0.2:0)); m.dueAt=Date.now()+days[rating]*86400000; m.lastReviewed=Date.now(); m.lastRating=rating;
    c.known=rating!=="again"; save();
    const list=cardsInSet(state.selectedSetId); const due=list.filter(x=>(state.meta[x.id]?.dueAt||0)<=Date.now()&&x.id!==c.id);
    currentCardId=(due[0]||list.find(x=>x.id!==c.id)||null)?.id||null; render();
  }

  function addFiles(fileList) {
    const files=Array.from(fileList||[]).filter(f=>/^image\/(jpeg|png|webp|bmp)$/.test(f.type));
    if(!files.length){alert("Bitte JPG-, PNG-, WEBP- oder BMP-Bilder auswählen.");return;}
    files.forEach(file=>{const url=URL.createObjectURL(file);uploads.push({id:id(),file,url,blob:file,name:file.name,crop:null});});
    $("fcx-files").value=""; renderUploads(); $("fcx-run-ocr").disabled=!selectedSet();
  }
  function renderUploads() {
    $("fcx-upload-list").innerHTML=uploads.map((u,i)=>'<div class="fcx-upload-item"><img src="'+u.url+'" alt=""><div><strong>'+esc(u.name)+'</strong><small>'+(u.crop?"Ausschnitt ausgewählt":"Ganzes Bild")+'</small><div><button class="fcx-btn" data-crop="'+i+'">Ausschnitt wählen</button><button class="fcx-btn fcx-danger" data-remove-upload="'+i+'">Entfernen</button></div></div></div>').join("");
    $("fcx-upload-list").querySelectorAll("[data-crop]").forEach(b=>b.addEventListener("click",()=>openCrop(Number(b.dataset.crop))));
    $("fcx-upload-list").querySelectorAll("[data-remove-upload]").forEach(b=>b.addEventListener("click",()=>{const u=uploads.splice(Number(b.dataset.removeUpload),1)[0];URL.revokeObjectURL(u.url);renderUploads();$("fcx-run-ocr").disabled=!uploads.length||!selectedSet();}));
  }

  async function loadTesseract() {
    if(window.Tesseract)return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";s.onload=resolve;s.onerror=()=>reject(new Error("OCR-Bibliothek konnte nicht geladen werden."));document.head.appendChild(s);
    });
  }
  async function getWorker(lang,logger) {
    await loadTesseract();
    return window.Tesseract.createWorker(lang,1,{logger});
  }
  async function runOCR() {
    if(!selectedSet())return alert("Bitte zuerst ein Lernset auswählen.");
    if(!uploads.length)return;
    const status=$("fcx-ocr-status"); const button=$("fcx-run-ocr"); button.disabled=true;
    status.textContent="Texterkennung wird vorbereitet …";
    try {
      const mode=$("fcx-language").value; let textOut="";
      const langs=mode==="auto"?["deu","eng"]:[mode];
      for(let i=0;i<uploads.length;i++){
        const u=uploads[i]; status.textContent="Bild "+(i+1)+" von "+uploads.length+" wird erkannt …";
        const source=u.crop||u.blob;
        let best={text:"",confidence:-1};
        for(const lang of langs){
          const worker=await getWorker(lang,m=>{if(m.status==="recognizing text")status.textContent="Erkenne "+(lang==="deu"?"Deutsch":lang==="eng"?"Englisch":"Französisch")+" · "+Math.round((m.progress||0)*100)+" %";});
          try {const result=await worker.recognize(source); if((result.data.confidence||0)>best.confidence)best={text:result.data.text||"",confidence:result.data.confidence||0,lang};}
          finally {await worker.terminate();}
        }
        textOut+="\n\n--- "+u.name+" · "+(best.lang||mode)+" · "+Math.round(best.confidence)+" % Sicherheit ---\n"+best.text;
      }
      $("fcx-recognized-text").value=textOut.trim(); $("fcx-text-review").hidden=false;
      status.textContent="Erkennung abgeschlossen. Bitte korrigiere den Text, bevor du Karten vorschlägst.";
    } catch(e) {console.error(e);status.textContent="Fehler: "+e.message;}
    finally {button.disabled=!uploads.length||!selectedSet();}
  }

  function proposeCards(raw) {
    const text=String(raw||"").replace(/\r/g,"").trim(); if(text.length<15){alert("Es wurde zu wenig Text erkannt. Ergänze oder korrigiere ihn zuerst.");return;}
    const lines=text.split("\n").map(x=>x.trim()).filter(x=>x.length>2&&!/^---/.test(x));
    const found=[]; const seen=new Set();
    const add=(q,a)=>{
      q=q.replace(/^[\s•\-–:]+|[\s:]+$/g,"").trim();a=a.replace(/^[\s•\-–:]+|[\s:]+$/g,"").trim();
      if(q.length<4||a.length<3||q.length>180||a.length>350)return;
      const key=(q+"|"+a).toLowerCase();if(seen.has(key))return;seen.add(key);found.push({question:q,answer:a,checked:true});
    };
    lines.forEach((line,i)=>{
      const colon=line.match(/^(.{4,90}?):\s*(.{5,250})$/);
      if(colon)add("Was bedeutet "+colon[1]+"?",colon[2]);
      const def=line.match(/^(.{3,70}?)\s+(ist|sind|bezeichnet|nennt man|bedeutet)\s+(.{5,220})[.!]?$/i);
      if(def)add("Was "+def[2]==="ist"?"ist "+def[1]+"?":"bedeutet "+def[1]+"?",def[3]);
      if(/^(definition|begriff|merkmale|ursachen|folgen|aufgaben|funktion|ziel|vorteile|nachteile)\b/i.test(line)&&lines[i+1])add("Was steht zu: "+line+"?",lines[i+1]);
    });
    if(found.length<3){
      const chunks=text.split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=35&&x.length<=300);
      chunks.slice(0,12).forEach((sentence,i)=>add("Was ist wichtig über diesen Inhalt? ("+(i+1)+")",sentence));
    }
    candidates=found.slice(0,30); renderCandidates();
    $("fcx-candidates").hidden=false;
    $("fcx-candidates").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function renderCandidates() {
    $("fcx-candidate-count").textContent=candidates.length+" Vorschläge";
    $("fcx-candidate-list").innerHTML=candidates.length?candidates.map((c,i)=>'<article class="fcx-candidate"><label class="fcx-check"><input type="checkbox" data-candidate-check="'+i+'" '+(c.checked?"checked":"")+'> Übernehmen</label><label class="fcx-field">Frage<textarea data-candidate-q="'+i+'" rows="2">'+esc(c.question)+'</textarea></label><label class="fcx-field">Antwort<textarea data-candidate-a="'+i+'" rows="3">'+esc(c.answer)+'</textarea></label></article>').join(""):'<div class="fcx-empty">Aus dem erkannten Text konnten keine sicheren Vorschläge gebildet werden. Du kannst Karten rechts manuell erstellen.</div>';
    candidates.forEach((c,i)=>{
      const q=$("[data-candidate-q='"+i+"']");const a=$("[data-candidate-a='"+i+"']");const check=$("[data-candidate-check='"+i+"']");
      if(q)q.addEventListener("input",()=>c.question=q.value);if(a)a.addEventListener("input",()=>c.answer=a.value);if(check)check.addEventListener("change",()=>c.checked=check.checked);
    });
  }
  function saveCandidates() {
    const set=selectedSet();if(!set)return alert("Bitte zuerst ein Set auswählen.");
    const chosen=candidates.filter(c=>c.checked&&c.question.trim()&&c.answer.trim());
    if(!chosen.length)return alert("Wähle mindestens einen gültigen Vorschlag aus.");
    chosen.forEach(c=>addCard(c.question.trim(),c.answer.trim(),set.id));
    candidates=[];$("fcx-candidates").hidden=true;render();
    alert(chosen.length+" Karteikarten wurden dem Set hinzugefügt.");
  }

  function openCrop(index) {
    cropTarget=uploads[index];cropRect=null;
    const modal=$("fcx-crop-modal");const img=$("fcx-crop-image");
    img.src=cropTarget.url;modal.hidden=false;
    $("fcx-crop-selection").style.display="none";
  }
  function closeCrop() {$("fcx-crop-modal").hidden=true;cropTarget=null;cropRect=null;}
  function cropPoint(e) {const r=$("fcx-crop-stage").getBoundingClientRect();return{x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top))};}
  function cropDown(e) {if($("fcx-crop-modal").hidden||!cropTarget)return;cropStart=cropPoint(e);cropRect={x:cropStart.x,y:cropStart.y,w:0,h:0};$("fcx-crop-stage").setPointerCapture(e.pointerId);drawCropSelection();}
  function cropMove(e) {if(!cropStart)return;const p=cropPoint(e);cropRect={x:Math.min(p.x,cropStart.x),y:Math.min(p.y,cropStart.y),w:Math.abs(p.x-cropStart.x),h:Math.abs(p.y-cropStart.y)};drawCropSelection();}
  function cropUp() {cropStart=null;}
  function drawCropSelection() {const el=$("fcx-crop-selection");if(!cropRect||cropRect.w<4||cropRect.h<4){el.style.display="none";return;}Object.assign(el.style,{display:"block",left:cropRect.x+"px",top:cropRect.y+"px",width:cropRect.w+"px",height:cropRect.h+"px"});}
  async function saveCrop() {
    if(!cropTarget)return;
    if(!cropRect||cropRect.w<8||cropRect.h<8){cropTarget.crop=null;closeCrop();renderUploads();return;}
    const img=$("fcx-crop-image");const stage=$("fcx-crop-stage");const rect=stage.getBoundingClientRect();
    const scaleX=img.naturalWidth/rect.width,scaleY=img.naturalHeight/rect.height;
    const canvas=document.createElement("canvas");canvas.width=Math.round(cropRect.w*scaleX);canvas.height=Math.round(cropRect.h*scaleY);
    const ctx=canvas.getContext("2d");ctx.drawImage(img,cropRect.x*scaleX,cropRect.y*scaleY,cropRect.w*scaleX,cropRect.h*scaleY,0,0,canvas.width,canvas.height);
    cropTarget.crop=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
    closeCrop();renderUploads();
  }

  ensureSets();
  build();
  window.addEventListener("beforeunload",()=>uploads.forEach(u=>URL.revokeObjectURL(u.url)));
  console.log("StudySpace: einheitliche Karteikartenoberfläche geladen.");
})();