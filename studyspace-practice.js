/* StudySpace – Prüfungstrainer und adaptive Wiederholungen */
(() => {
  "use strict";
  if (window.__studySpacePracticeLoaded) return;
  window.__studySpacePracticeLoaded = true;

  const STORE_KEY = "studyspacePracticeSettingsV1";
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = () => "rev_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const localISO = date => {
    const d = new Date(date);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  };
  const subjectName = id => (data.subjects||[]).find(s=>s.id===id)?.name || "Allgemein";
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem(STORE_KEY)||"{}") || {}; } catch {}
  settings = {dailyLimit: settings.dailyLimit || 20, targetRetention: 0.9, ...settings};
  let quiz = {cards:[], index:0, correct:0, revealed:false};

  function persistSettings(){ localStorage.setItem(STORE_KEY,JSON.stringify(settings)); }
  function ensureReviewTask(card) {
    const schedule = card.studySchedule;
    if (!schedule || !schedule.dueDate) return;
    if (!Array.isArray(data.tasks)) data.tasks=[];
    let task=data.tasks.find(t=>t.studyspaceReviewCardId===card.id);
    const title="Wiederholen: "+String(card.question||"Lernkarte").slice(0,65);
    if(!task){
      task={id:uid(),name:title,subjectId:card.subjectId||"",date:schedule.dueDate,completed:false,studyspaceReviewCardId:card.id,studyspaceReview:true};
      data.tasks.push(task);
    } else {
      task.name=title; task.subjectId=card.subjectId||""; task.date=schedule.dueDate; task.completed=false;
    }
  }
  function review(card, knew) {
    const now=Date.now();
    const old=card.studySchedule||{};
    const elapsed=old.lastReview ? Math.max(0,(now-old.lastReview)/86400000) : 0;
    const stability=Number(old.stability)||0.7;
    const difficulty=Number(old.difficulty)||5;
    const retrievability=old.lastReview ? Math.pow(0.9,elapsed/Math.max(0.1,stability)) : 1;
    let nextStability;
    let nextDifficulty;
    if(knew){
      nextStability=Math.min(365,Math.max(0.8,stability*(1.22+(6-difficulty)*0.025)+(1-retrievability)*0.25));
      nextDifficulty=Math.max(1, difficulty-0.18);
    } else {
      nextStability=Math.max(0.12,stability*0.32);
      nextDifficulty=Math.min(10,difficulty+1.05);
    }
    const intervalDays=knew ? nextStability : 0.04;
    const due=new Date(now+intervalDays*86400000);
    card.studySchedule={
      stability:nextStability,
      difficulty:nextDifficulty,
      lastReview:now,
      dueDate:localISO(due),
      intervalDays,
      retrievabilityAtReview:retrievability,
      reviews:(Number(old.reviews)||0)+1,
      lapses:(Number(old.lapses)||0)+(knew?0:1),
      algorithm:"studyspace-forgetting-curve-v1"
    };
    ensureReviewTask(card);
    saveData();
  }
  window.StudySpaceScheduler={review};

  function styles(){
    if($("studyPracticeStyles"))return;
    const style=document.createElement("style");style.id="studyPracticeStyles";
    style.textContent=`
      .spx-wrap{display:flex;flex-direction:column;gap:16px}
      .spx-panel{background:var(--panel-bg,#151823);border:1px solid var(--border-color,#30394a);border-radius:14px;padding:20px}
      .spx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .spx-panel h2,.spx-panel h3{margin:0 0 8px}
      .spx-muted{color:var(--text-secondary,#9ba8ba);font-size:13px;line-height:1.5}
      .spx-panel label{display:flex;flex-direction:column;gap:7px;font-size:13px;color:var(--text-secondary,#aab5c5)}
      .spx-panel select,.spx-panel input{width:100%;box-sizing:border-box;padding:11px;border-radius:9px;border:1px solid #39465a;background:#101722;color:#f1f4f8;font:inherit}
      .spx-materials{min-height:100px}
      .spx-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .spx-btn{border:1px solid #39465a;border-radius:9px;background:#202b3b;color:#f1f4f8;padding:10px 14px;cursor:pointer;font:inherit}
      .spx-btn.primary{background:#315f9b;border-color:#477fc0}
      .spx-btn:disabled{opacity:.45;cursor:not-allowed}
      .spx-question{font-size:20px;line-height:1.5;padding:24px 0;white-space:pre-wrap}
      .spx-answer{border-top:1px solid #39465a;padding:16px 0;white-space:pre-wrap;line-height:1.55}
      .spx-progress{height:8px;background:#273143;border-radius:20px;overflow:hidden;margin:10px 0}
      .spx-progress>span{display:block;height:100%;background:var(--accent,#8197ff);width:0}
      .spx-list{display:flex;flex-direction:column;gap:8px}
      .spx-item{padding:12px;border:1px solid #30394a;border-radius:10px;display:flex;justify-content:space-between;gap:12px;align-items:center}
      .spx-item small{display:block;color:#9ba8ba;margin-top:4px}
      @media(max-width:720px){.spx-grid{grid-template-columns:1fr}.spx-panel{padding:15px}}
    `;
    document.head.appendChild(style);
  }

  function addPage(){
    if($("page-practice"))return;
    const nav=document.querySelector(".navigation"),main=document.querySelector(".main-content");
    if(!nav||!main)return;
    const button=document.createElement("button");button.className="nav-item";button.dataset.page="practice";
    button.innerHTML='<span class="nav-icon">🎓</span><span class="nav-text">Prüfungstrainer</span>';
    nav.appendChild(button);button.addEventListener("click",()=>openPage("practice"));
    pageTitles.practice="Prüfungstrainer";
    const page=document.createElement("section");page.className="page";page.id="page-practice";
    page.innerHTML=`
      <div class="page-intro"><h1>Prüfungstrainer</h1><p>Übe gezielt mit deinen Karteikarten und verfolge, was du schon sicher kannst.</p></div>
      <div class="spx-wrap">
        <section class="spx-panel">
          <h2>Deinen Test zusammenstellen</h2>
          <p class="spx-muted">Wähle zuerst ein Fach. Du kannst anschließend einzelne Materialien eingrenzen. Ohne Materialauswahl werden alle passenden Karteikarten des Fachs verwendet.</p>
          <div class="spx-grid">
            <label>Fach auswählen<select id="spx-subject"></select></label>
            <label>Aufgabenanzahl<select id="spx-count"><option value="5">5 Fragen</option><option value="10" selected>10 Fragen</option><option value="15">15 Fragen</option><option value="20">20 Fragen</option></select></label>
            <label style="grid-column:1/-1">Material auswählen (optional)<select id="spx-materials" class="spx-materials" multiple></select></label>
          </div>
          <p class="spx-muted" id="spx-source-note">Die Materialauswahl filtert Karten, die im Karteikartensystem diesem Material zugeordnet wurden.</p>
          <div class="spx-actions"><button class="spx-btn primary" id="spx-start">Test starten</button></div>
        </section>
        <section class="spx-panel" id="spx-quiz">
          <h2>Dein Test</h2><p class="spx-muted">Wähle dein Fach und starte einen Test.</p>
        </section>
        <section class="spx-panel">
          <h2>Deine Wiederholungen</h2>
          <p class="spx-muted">StudySpace plant nach jeder Bewertung den nächsten Termin anhand einer Vergessenskurve. Die Termine erscheinen im vorhandenen Kalender als Aufgaben.</p>
          <div class="spx-grid">
            <label>Tägliches Wiederholungslimit in Minuten<input id="spx-limit" type="number" min="5" max="180" step="5"></label>
            <label>Gewünschte Erinnerungs-Sicherheit<select id="spx-retention" disabled><option value="0.9">90 % – empfohlen</option></select></label>
          </div>
          <div class="spx-actions"><button class="spx-btn" id="spx-save-settings">Einstellungen speichern</button></div>
          <div id="spx-schedule-list" class="spx-list" style="margin-top:14px"></div>
        </section>
      </div>`;
    main.appendChild(page);
    $("spx-limit").value=settings.dailyLimit;
    $("spx-subject").addEventListener("change",renderMaterials);
    $("spx-start").addEventListener("click",startQuiz);
    $("spx-save-settings").addEventListener("click",()=>{
      settings.dailyLimit=Math.max(5,Math.min(180,Number($("spx-limit").value)||20));
      persistSettings();renderSchedule();
    });
    renderSubjects();renderMaterials();renderSchedule();
  }

  function renderSubjects(){
    const select=$("spx-subject");if(!select)return;
    const previous=select.value;
    select.innerHTML=(data.subjects||[]).map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join("");
    if(previous&&(data.subjects||[]).some(s=>s.id===previous))select.value=previous;
    renderMaterials();
  }
  function renderMaterials(){
    const select=$("spx-materials");if(!select)return;
    const subjectId=$("spx-subject").value;
    const selected=new Set(Array.from(select.selectedOptions||[]).map(o=>o.value));
    const materials=(data.materials||[]).filter(m=>m.subjectId===subjectId);
    select.innerHTML=materials.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name||m.fileName||"Material")+'</option>').join("");
    Array.from(select.options).forEach(o=>o.selected=selected.has(o.value));
    $("spx-source-note").textContent=materials.length
      ?"Optional: Wähle ein oder mehrere Materialien. Es werden dann nur Karten genutzt, die diesen Materialien zugeordnet sind."
      :"Für dieses Fach sind noch keine Materialien hinterlegt.";
  }

  function startQuiz(){
    const subjectId=$("spx-subject").value;
    if(!subjectId){$("spx-quiz").innerHTML="<h2>Dein Test</h2><p>Lege zuerst ein Fach an.</p>";return;}
    const selectedMaterials=Array.from($("spx-materials").selectedOptions).map(o=>o.value);
    let pool=(data.flashcards||[]).filter(c=>c.subjectId===subjectId&&c.question&&c.answer);
    if(selectedMaterials.length)pool=pool.filter(c=>selectedMaterials.includes(c.materialId));
    if(!pool.length){
      $("spx-quiz").innerHTML='<h2>Dein Test</h2><p class="spx-muted">'+(selectedMaterials.length?'Für die ausgewählten Materialien gibt es noch keine zugeordneten Karteikarten. Öffne „Karteikarten“ und wähle dort das Material beim Erstellen oder Importieren der Karten aus.':'In diesem Fach gibt es noch keine Karteikarten. Erstelle zuerst welche im Bereich „Karteikarten“.')+'</p>';
      return;
    }
    pool=pool.slice().sort(()=>Math.random()-.5).slice(0,Math.min(Number($("spx-count").value)||10,pool.length));
    quiz={cards:pool,index:0,correct:0,revealed:false};
    renderQuestion();
  }
  function renderQuestion(){
    const area=$("spx-quiz"),card=quiz.cards[quiz.index];
    if(!card){
      const pct=Math.round(quiz.correct/quiz.cards.length*100);
      window.dispatchEvent(new CustomEvent("studyspace:empire-trainer-complete",{detail:{count:1,correct:quiz.correct,total:quiz.cards.length}}));
      area.innerHTML='<h2>Test abgeschlossen</h2><p class="spx-muted">'+quiz.correct+' von '+quiz.cards.length+' Fragen richtig · '+pct+' %</p><div class="spx-progress"><span style="width:'+pct+'%"></span></div><button class="spx-btn primary" id="spx-again">Neuen Test starten</button>';
      $("spx-again").addEventListener("click",startQuiz);renderSchedule();return;
    }
    const progress=Math.round(quiz.index/quiz.cards.length*100);
    area.innerHTML='<h2>Frage '+(quiz.index+1)+' von '+quiz.cards.length+'</h2><div class="spx-progress"><span style="width:'+progress+'%"></span></div><div class="spx-question">'+esc(card.answer)+'</div><div id="spx-answer" hidden class="spx-answer"><strong>Französische Übersetzung</strong><p>'+esc(card.question)+'</p></div><div class="spx-actions"><button class="spx-btn primary" id="spx-reveal">Antwort anzeigen</button></div><div id="spx-grade" hidden><p class="spx-muted">Wie sicher war deine Antwort?</p><div class="spx-actions"><button class="spx-btn primary" id="spx-good">Gewusst</button><button class="spx-btn" id="spx-again-grade">Nicht gewusst</button></div></div>';
    $("spx-reveal").addEventListener("click",()=>{
      $("spx-answer").hidden=false;$("spx-grade").hidden=false;$("spx-reveal").hidden=true;
    });
    $("spx-good").addEventListener("click",()=>grade(true,card));
    $("spx-again-grade").addEventListener("click",()=>grade(false,card));
  }
  function grade(knew,card){
    if(!card.studyStats)card.studyStats={attempts:0,correct:0,wrong:0,streak:0,history:[]};
    const st=card.studyStats;st.attempts++;window.dispatchEvent(new CustomEvent("studyspace:empire-card-reviewed",{detail:{cardId:card.id,knew:!!knew}}));if(knew){st.correct++;st.streak++;quiz.correct++;}else{st.wrong++;st.streak=0;}
    st.history.push(!!knew);if(st.history.length>20)st.history=st.history.slice(-20);st.lastReviewed=Date.now();
    review(card,knew);quiz.index++;renderQuestion();
  }

  function renderSchedule(){
    const area=$("spx-schedule-list");if(!area)return;
    const cards=(data.flashcards||[]).filter(c=>c.studySchedule?.dueDate).sort((a,b)=>a.studySchedule.dueDate.localeCompare(b.studySchedule.dueDate));
    if(!cards.length){area.innerHTML='<p class="spx-muted">Noch keine Wiederholungen geplant. Bewerte zuerst Karten im Prüfungstrainer oder Karteikartenbereich.</p>';return;}
    area.innerHTML=cards.map(card=>{
      const date=new Date(card.studySchedule.dueDate+"T12:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"});
      const task=data.tasks.find(t=>t.studyspaceReviewCardId===card.id);
      return '<div class="spx-item"><div><strong>'+esc(card.question)+'</strong><small>'+esc(subjectName(card.subjectId))+' · '+date+' · '+(task?.completed?"Erledigt":"Geplant")+'</small></div><button class="spx-btn" data-spx-done="'+esc(card.id)+'">Erledigt</button></div>';
    }).join("");
    area.querySelectorAll("[data-spx-done]").forEach(button=>button.addEventListener("click",()=>{
      const card=(data.flashcards||[]).find(c=>c.id===button.dataset.spxDone);if(!card)return;
      const task=data.tasks.find(t=>t.studyspaceReviewCardId===card.id);if(task)task.completed=true;
      saveData();renderSchedule();
    }));
  }

  function attachCalendarPanel(){
    const page=$("page-calendar");if(!page||$("spx-calendar-panel"))return;
    const panel=document.createElement("div");panel.className="panel";panel.id="spx-calendar-panel";
    panel.innerHTML='<h3>Automatisch geplante Wiederholungen</h3><p class="spx-muted">Diese Termine werden aus deinen Lernbewertungen berechnet und direkt im Kalender als Aufgaben angezeigt.</p><div id="spx-calendar-upcoming" class="spx-list"></div>';
    page.appendChild(panel);
    renderCalendarUpcoming();
  }
  function renderCalendarUpcoming(){
    const area=$("spx-calendar-upcoming");if(!area)return;
    const upcoming=(data.flashcards||[]).filter(c=>c.studySchedule?.dueDate).sort((a,b)=>a.studySchedule.dueDate.localeCompare(b.studySchedule.dueDate)).slice(0,12);
    area.innerHTML=upcoming.length?upcoming.map(c=>'<div class="spx-item"><div><strong>'+esc(c.question)+'</strong><small>'+esc(subjectName(c.subjectId))+' · '+new Date(c.studySchedule.dueDate+"T12:00:00").toLocaleDateString("de-DE")+'</small></div></div>').join(""):'<p class="spx-muted">Noch keine Wiederholungen geplant.</p>';
  }
  function refresh(){
    renderSubjects();renderSchedule();renderCalendarUpcoming();
  }
  function init(){
    styles();addPage();attachCalendarPanel();
    document.addEventListener("click",event=>{
      if(event.target.closest('[data-page="practice"]'))setTimeout(refresh,0);
      if(event.target.closest('[data-page="calendar"]'))setTimeout(renderCalendarUpcoming,0);
    });
    window.addEventListener("focus",refresh);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();