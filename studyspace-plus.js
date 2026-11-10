/* StudySpace Plus – Hefter-Anmerkungen, Lesezeichen und zusätzliche Lernwerkzeuge */
(() => {
"use strict";
const KEY="studySpacePlusV1", $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch{return {};}}
let state=Object.assign({annotations:{},bookmarks:[],formulas:[],summaries:[],mistakes:[],gaps:[],goals:{minutes:45,done:0}},load());
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const cards=()=>Array.isArray(data.flashcards)?data.flashcards:[];
function styles(){if($("studyPlusStyles"))return;const s=document.createElement("style");s.id="studyPlusStyles";s.textContent=
"#studyPlusPage{display:flex;flex-direction:column;gap:16px}.sp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.sp-panel{padding:18px;border:1px solid var(--border-color,#30394a);border-radius:14px;background:var(--panel-bg,#151823);min-width:0}.sp-panel h3{margin:0 0 7px;font-size:16px}.sp-panel p,.sp-muted{color:var(--text-secondary,#9ba8ba);font-size:12px;line-height:1.5}.sp-form{display:flex;flex-direction:column;gap:9px}.sp-form input,.sp-form textarea,.sp-form select,#sp-search{box-sizing:border-box;width:100%;padding:11px;border:1px solid #39465a;border-radius:9px;background:#101722;color:#f1f4f8;font:inherit}.sp-form textarea{min-height:95px;resize:vertical}.sp-btn{border:1px solid #39465a;border-radius:9px;background:#202b3b;color:#f1f4f8;padding:9px 12px;cursor:pointer;font:inherit;font-size:12px}.sp-btn.primary{background:#315f9b;border-color:#477fc0}.sp-list{display:flex;flex-direction:column;gap:8px}.sp-item{padding:10px;border:1px solid #30394a;border-radius:9px;display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.sp-item small{display:block;color:#9ba8ba;margin-top:4px}.sp-item button{flex-shrink:0}.sp-results{max-height:320px;overflow:auto}#studyBinder .binder-sheet{position:relative}.sp-page-tools{grid-column:1/-1;display:flex;gap:7px;flex-wrap:wrap;align-items:center}.sp-page-tools button{font-size:11px;padding:7px 10px}.sp-annotation-wrap{position:relative;width:100%;line-height:0;touch-action:pan-y}.sp-annotation-wrap>img,.sp-annotation-wrap>canvas:not(.sp-ink){display:block;width:100%;height:auto}.sp-ink{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair}.sp-thumbbar{position:sticky;top:0;z-index:5;display:flex;gap:8px;overflow-x:auto;padding:9px;background:#111925;border-bottom:1px solid #30394a}.sp-thumb{flex:0 0 100px;min-width:100px;padding:7px!important;font-size:10px!important;white-space:normal}.sp-thumb.active{border-color:#7bb7ff!important;background:#24466c!important}.sp-bookmarked{outline:2px solid #e8bd65!important}.sp-tool-active{background:#315f9b!important;border-color:#78baff!important}@media(max-width:720px){.sp-grid{grid-template-columns:1fr}.sp-panel{padding:14px}.sp-page-tools button{min-height:38px}}";
document.head.appendChild(s);}
function addPage(){
 let page=$("page-learning-lab");if(!page){page=document.createElement("section");page.className="page";page.id="page-learning-lab";document.querySelector(".main-content")?.appendChild(page);}
 page.innerHTML='<div class="page-intro"><h1>Lernwerkstatt</h1><p>Übe mit deinen Inhalten, sammle Wissen und erkenne, was du noch wiederholen solltest.</p></div><div id="studyPlusPage"><section class="sp-panel"><h3>Suche in StudySpace</h3><p>Durchsuche Fächer, Materialtitel, Karteikarten, Formeln, Lernzettel und Fehlernotizen.</p><input id="sp-search" placeholder="Suchbegriff eingeben …"><div id="sp-search-results" class="sp-results sp-list"></div></section><div class="sp-grid"><section class="sp-panel"><h3>Prüfungstrainer</h3><p>Erstellt einen Test aus deinen vorhandenen Karteikarten. Du bewertest anschließend selbst, ob deine Antwort richtig war.</p><div id="sp-quiz-area"><button class="sp-btn primary" id="sp-quiz-start">Test starten</button></div></section><section class="sp-panel"><h3>Tagesziel</h3><p>Trage dein Lernziel und deine bisherige Lernzeit ein.</p><form id="sp-goal-form" class="sp-form"><label class="sp-muted">Tagesziel in Minuten<input id="sp-goal-minutes" type="number" min="5" max="600"></label><label class="sp-muted">Heute gelernt<input id="sp-done-minutes" type="number" min="0" max="600"></label><button class="sp-btn primary">Ziel speichern</button></form><p id="sp-goal-status"></p></section><section class="sp-panel"><h3>Formelsammlung</h3><p>Speichere Formeln mit Fach, Thema und Erklärung.</p><form id="sp-formula-form" class="sp-form"><input id="sp-formula-subject" placeholder="Fach" required><input id="sp-formula-title" placeholder="Thema / Name" required><textarea id="sp-formula-value" placeholder="Formel und Variablen erklären" required></textarea><button class="sp-btn primary">Formel speichern</button></form><div id="sp-formula-list" class="sp-list"></div></section><section class="sp-panel"><h3>Lernzettel & Zusammenfassungen</h3><p>Erstelle eigene Zusammenfassungen zu einem Thema.</p><form id="sp-summary-form" class="sp-form"><input id="sp-summary-title" placeholder="Titel / Thema" required><textarea id="sp-summary-text" placeholder="Deine Zusammenfassung …" required></textarea><button class="sp-btn primary">Zusammenfassung speichern</button></form><div id="sp-summary-list" class="sp-list"></div></section><section class="sp-panel"><h3>Fehlerprotokoll</h3><p>Notiere Aufgaben oder Fragen, bei denen du noch unsicher bist.</p><form id="sp-mistake-form" class="sp-form"><input id="sp-mistake-subject" placeholder="Fach / Thema" required><textarea id="sp-mistake-text" placeholder="Was war schwierig? Was muss ich noch verstehen?" required></textarea><button class="sp-btn primary">Lernlücke speichern</button></form><div id="sp-mistake-list" class="sp-list"></div></section><section class="sp-panel"><h3>Wissenslücken</h3><p>Hier landen Fragen aus dem Prüfungstrainer, die du noch nicht sicher konntest.</p><div id="sp-gap-list" class="sp-list"></div></section></div></div>';
 $("sp-search").addEventListener("input",search);
 $("sp-quiz-start").addEventListener("click",startQuiz);
 $("sp-goal-minutes").value=state.goals.minutes;$("sp-done-minutes").value=state.goals.done;
 $("sp-goal-form").addEventListener("submit",e=>{e.preventDefault();state.goals.minutes=Math.max(5,Number($("sp-goal-minutes").value)||45);state.goals.done=Math.max(0,Number($("sp-done-minutes").value)||0);save();goal();});
 $("sp-formula-form").addEventListener("submit",e=>{e.preventDefault();state.formulas.unshift({id:uid(),subject:$("sp-formula-subject").value.trim(),title:$("sp-formula-title").value.trim(),body:$("sp-formula-value").value.trim()});save();e.target.reset();lists();});
 $("sp-summary-form").addEventListener("submit",e=>{e.preventDefault();state.summaries.unshift({id:uid(),title:$("sp-summary-title").value.trim(),body:$("sp-summary-text").value.trim()});save();e.target.reset();lists();});
 $("sp-mistake-form").addEventListener("submit",e=>{e.preventDefault();state.mistakes.unshift({id:uid(),subject:$("sp-mistake-subject").value.trim(),body:$("sp-mistake-text").value.trim()});save();e.target.reset();lists();});
 lists();goal();search();}
function goal(){$("sp-goal-status").textContent=state.goals.done+" / "+state.goals.minutes+" Minuten · "+Math.min(100,Math.round(state.goals.done/state.goals.minutes*100))+"% erreicht";}
function lists(){
 const html=(arr,kind,fn)=>arr.length?arr.map(x=>{const v=fn(x);return '<div class="sp-item"><div><strong>'+esc(v[0])+'</strong><small>'+esc(v[1])+'</small><div>'+esc(v[2])+'</div></div><button class="sp-btn" data-sp-del="'+esc(x.id)+'" data-kind="'+kind+'">Löschen</button></div>';}).join(""):'<p class="sp-muted">Noch keine Einträge.</p>';
 $("sp-formula-list").innerHTML=html(state.formulas,"formulas",x=>[x.title,x.subject,x.body]);
 $("sp-summary-list").innerHTML=html(state.summaries,"summaries",x=>[x.title,"Zusammenfassung",x.body]);
 $("sp-mistake-list").innerHTML=html(state.mistakes,"mistakes",x=>[x.subject,"Fehlerprotokoll",x.body]);
 $("sp-gap-list").innerHTML=html(state.gaps,"gaps",x=>[x.question,x.subject,x.answer]);
 document.querySelectorAll("[data-sp-del]").forEach(b=>b.addEventListener("click",()=>{state[b.dataset.kind]=state[b.dataset.kind].filter(x=>x.id!==b.dataset.spDel);save();lists();}));
}
function search(){
 const q=$("sp-search")?.value.trim().toLowerCase(),out=$("sp-search-results");if(!out)return;if(!q){out.innerHTML='<p class="sp-muted">Deine Treffer erscheinen hier.</p>';return;}
 const rows=[];(data.subjects||[]).forEach(x=>rows.push(["Fach",x.name,""]));(data.materials||[]).forEach(x=>rows.push(["Material",x.name,x.fileName||""]));cards().forEach(x=>rows.push(["Karteikarte",x.question,x.answer]));
 state.formulas.forEach(x=>rows.push(["Formel",x.title,x.subject+" · "+x.body]));state.summaries.forEach(x=>rows.push(["Lernzettel",x.title,x.body]));state.mistakes.forEach(x=>rows.push(["Lernlücke",x.subject,x.body]));
 const hits=rows.filter(r=>r.join(" ").toLowerCase().includes(q)).slice(0,40);out.innerHTML=hits.length?hits.map(r=>'<div class="sp-item"><div><strong>'+esc(r[1])+'</strong><small>'+esc(r[0])+'</small><div>'+esc(String(r[2]).slice(0,220))+'</div></div></div>').join(""):'<p class="sp-muted">Keine Treffer.</p>';
}
let quiz={items:[],index:0,correct:0};
function startQuiz(){const all=cards().filter(c=>c.question&&c.answer);if(!all.length){$("sp-quiz-area").innerHTML='<p class="sp-muted">Erstelle zuerst Karteikarten.</p>';return;}quiz={items:all.sort(()=>Math.random()-.5).slice(0,Math.min(10,all.length)),index:0,correct:0};quizCard();}
function quizCard(){const area=$("sp-quiz-area"),c=quiz.items[quiz.index];if(!c){area.innerHTML='<h3>Test beendet</h3><p>'+quiz.correct+' von '+quiz.items.length+' richtig.</p><button class="sp-btn primary" id="sp-quiz-start">Neuen Test starten</button>';$("sp-quiz-start").addEventListener("click",startQuiz);return;}
 area.innerHTML='<p class="sp-muted">Frage '+(quiz.index+1)+' von '+quiz.items.length+'</p><h3>'+esc(c.answer)+'</h3><form id="sp-answer-form" class="sp-form"><textarea id="sp-user-answer" placeholder="Deine Antwort …" required></textarea><button class="sp-btn primary">Antwort prüfen</button></form><div id="sp-answer-feedback"></div>';
 $("sp-answer-form").addEventListener("submit",e=>{e.preventDefault();$("sp-answer-feedback").innerHTML='<p><strong>Französische Übersetzung:</strong> '+esc(c.question)+'</p><p>War deine Antwort richtig?</p><button class="sp-btn primary" id="sp-yes">Ja</button> <button class="sp-btn" id="sp-no">Noch nicht</button>';$("sp-yes").addEventListener("click",()=>grade(true,c));$("sp-no").addEventListener("click",()=>grade(false,c));});}
function grade(ok,c){if(ok)quiz.correct++;else if(!state.gaps.some(x=>x.question===c.question)){state.gaps.unshift({id:uid(),question:c.question,answer:c.answer,subject:(data.subjects||[]).find(s=>s.id===c.subjectId)?.name||"Allgemein"});save();}quiz.index++;lists();quizCard();}

function enhanceBinder(){
 const binder=$("studyBinder"),scroll=$("binderScroll");if(!binder||!scroll)return;
 let bar=$("sp-thumbbar");if(!bar){bar=document.createElement("nav");bar.id="sp-thumbbar";bar.className="sp-thumbbar";scroll.before(bar);}
 const sheets=[...scroll.querySelectorAll(".binder-sheet")];if(sheets.length&&sheets.every(sheet=>sheet.dataset.spEnhanced==="1")&&bar.children.length===sheets.length)return;bar.innerHTML="";
 sheets.forEach((sheet,i)=>{
  const heading=sheet.querySelector(".binder-sheet-heading"),meta=heading?.querySelector("strong")?.textContent||"Hefterseite",number=heading?.querySelector("span")?.textContent||"";
  const key=sheet.dataset.spKey||(sheet.dataset.spKey="page_"+i+"_"+String(number).replace(/\W/g,"")+"_"+meta.replace(/\W/g,"").slice(0,12));
  const thumb=document.createElement("button");thumb.type="button";thumb.className="sp-btn sp-thumb";thumb.textContent=(i+1)+". "+meta.slice(0,20);thumb.addEventListener("click",()=>sheet.scrollIntoView({behavior:"smooth",block:"start"}));bar.appendChild(thumb);
  if(sheet.dataset.spEnhanced==="1")return;sheet.dataset.spEnhanced="1";
  const tools=document.createElement("div");tools.className="sp-page-tools";
  const mark=document.createElement("button");mark.type="button";mark.className="sp-btn";mark.textContent=state.bookmarks.includes(key)?"★ Lesezeichen":"☆ Lesezeichen";
  if(state.bookmarks.includes(key))sheet.classList.add("sp-bookmarked");
  mark.addEventListener("click",()=>{state.bookmarks=state.bookmarks.includes(key)?state.bookmarks.filter(x=>x!==key):state.bookmarks.concat(key);save();mark.textContent=state.bookmarks.includes(key)?"★ Lesezeichen":"☆ Lesezeichen";sheet.classList.toggle("sp-bookmarked",state.bookmarks.includes(key));});tools.appendChild(mark);
  const content=sheet.querySelector(".binder-sheet-content"),original=content?.querySelector("img,canvas");
  if(original){
   const wrap=document.createElement("div");wrap.className="sp-annotation-wrap";original.parentNode.insertBefore(wrap,original);wrap.appendChild(original);
   const ink=document.createElement("canvas");ink.className="sp-ink";const baseW=original.naturalWidth||original.width||1200,baseH=original.naturalHeight||original.height||1600;ink.width=baseW;ink.height=baseH;Object.assign(ink.style,{position:"absolute",inset:"0",width:"100%",height:"100%",background:"transparent",pointerEvents:"none",zIndex:"3"});wrap.style.position="relative";wrap.style.display="block";wrap.appendChild(ink);
   const ctx=ink.getContext("2d"),strokes=state.annotations[key]||[];
   const redraw=()=>{ctx.clearRect(0,0,ink.width,ink.height);strokes.forEach(st=>{ctx.strokeStyle=st.color;ctx.lineWidth=st.width;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();st.points.forEach((p,j)=>{const x=p[0]*ink.width,y=p[1]*ink.height;j?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();});};redraw();
   let active=null;
   ink.addEventListener("pointerdown",e=>{if(ink.dataset.draw!=="on")return;ink.setPointerCapture(e.pointerId);active={color:ink.dataset.color||"#ffcf5a",width:Number(ink.dataset.width)||4,points:[]};const r=ink.getBoundingClientRect();active.points.push([(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]);strokes.push(active);});
   ink.addEventListener("pointermove",e=>{if(!active)return;const r=ink.getBoundingClientRect();active.points.push([(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]);redraw();});
   const end=()=>{if(active){state.annotations[key]=strokes;save();active=null;}};ink.addEventListener("pointerup",end);ink.addEventListener("pointercancel",end);
   const pen=document.createElement("button");pen.type="button";pen.className="sp-btn";pen.textContent="✎ Stift";pen.addEventListener("click",()=>{ink.dataset.draw=ink.dataset.draw==="on"?"off":"on";ink.style.pointerEvents=ink.dataset.draw==="on"?"auto":"none";pen.classList.toggle("sp-tool-active",ink.dataset.draw==="on");});
   const color=document.createElement("input");color.type="color";color.value="#ffcf5a";color.title="Stiftfarbe";color.style.width="38px";color.addEventListener("input",()=>ink.dataset.color=color.value);
   const size=document.createElement("select");size.className="sp-btn";size.innerHTML='<option value="2">Fein</option><option value="4" selected>Normal</option><option value="8">Breit</option>';size.addEventListener("change",()=>ink.dataset.width=size.value);
   const undo=document.createElement("button");undo.type="button";undo.className="sp-btn";undo.textContent="↶ Letzten Strich löschen";undo.addEventListener("click",()=>{strokes.pop();state.annotations[key]=strokes;save();redraw();});
   tools.append(pen,color,size,undo);
  }
  heading?.after(tools);
 });
}
function init(){
 styles();const nav=document.querySelector(".navigation");
 if(nav&&!document.querySelector('[data-page="learning-lab"]')){const b=document.createElement("button");b.className="nav-item";b.dataset.page="learning-lab";b.innerHTML='<span class="nav-icon">✧</span><span class="nav-text">Lernwerkstatt</span>';nav.appendChild(b);b.addEventListener("click",()=>{openPage("learning-lab");});}
 if(typeof pageTitles!=="undefined")pageTitles["learning-lab"]="Lernwerkstatt";
 addPage();
 document.addEventListener("click",e=>{if(e.target.closest('[data-page="learning-lab"]'))setTimeout(addPage,0);});
 const observer=new MutationObserver(()=>{if($("studyBinder")?.classList.contains("open"))enhanceBinder();});
 observer.observe(document.body,{childList:true,subtree:true});
 if($("studyBinder")?.classList.contains("open"))enhanceBinder();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();