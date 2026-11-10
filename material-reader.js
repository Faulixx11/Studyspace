/* StudySpace – durchscrollbarer digitaler Hefter mit Notizen pro Seite */
(() => {
"use strict";
const DB="StudySpaceFilesDB", STORE="files", NOTES="studyspaceMaterialPageNotesV1";
const $=id=>document.getElementById(id);
let objectUrls=[];
function readData(){try{return JSON.parse(localStorage.getItem("studyspaceData")||"{}");}catch{return {};}}
function readNotes(){try{return JSON.parse(localStorage.getItem(NOTES)||"{}");}catch{return {};}}
function writeNote(key,value,status){
 const all=readNotes();
 if(String(value||"").trim())all[key]=value;else delete all[key];
 localStorage.setItem(NOTES,JSON.stringify(all));
 if(status)status.textContent="Gespeichert";
}
function openDB(){return new Promise((resolve,reject)=>{
 const req=indexedDB.open(DB,1);
 req.onsuccess=()=>resolve(req.result);
 req.onerror=()=>reject(req.error);
});}
async function getFile(id){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  if(!db.objectStoreNames.contains(STORE)){db.close();resolve(null);return;}
  const tx=db.transaction(STORE,"readonly"),req=tx.objectStore(STORE).get(id);
  req.onsuccess=()=>{const row=req.result;db.close();resolve(row?.file||null);};
  req.onerror=()=>{db.close();reject(req.error);};
 });
}
function isSupported(item){
 const type=(item.fileType||"").toLowerCase(),name=(item.fileName||"").toLowerCase();
 return type.startsWith("image/")||type==="application/pdf"||name.endsWith(".pdf");
}
function makeViewer(){
 let root=$("studyBinder");if(root)return root;
 root=document.createElement("div");root.id="studyBinder";root.className="binder-modal";
 root.innerHTML=[
 '<div class="binder-window">',
 '<header class="binder-head"><div class="binder-head-copy"><strong id="binderTitle">Dein digitaler Hefter</strong><small id="binderSubtitle"></small></div><div class="binder-head-actions"><span id="binderPageCount"></span><button id="binderClose" type="button">Zurück zu Materialien</button></div></header>',
 '<div class="binder-scroll" id="binderScroll"><div class="binder-loading">Dein Hefter wird geladen …</div></div>',
 '</div>'
 ].join("");
 document.body.appendChild(root);
 $("binderClose").addEventListener("click",close);
 root.addEventListener("click",e=>{if(e.target===root)close();});
 return root;
}
function close(){
 const root=$("studyBinder");if(root)root.classList.remove("open");
 objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls=[];
}
function makeNote(itemId,pageNo){
 const wrap=document.createElement("aside");wrap.className="binder-page-notes";
 const label=document.createElement("label");label.textContent="Meine Notizen";
 const hint=document.createElement("p");hint.textContent="Nur zu dieser Seite gespeichert";
 const area=document.createElement("textarea");area.placeholder="Ergänzungen, Erklärungen oder Fragen …";
 const status=document.createElement("small");status.textContent="Wird automatisch gespeichert";
 const key=itemId+":"+pageNo;
 area.value=readNotes()[key]||"";
 let timer=null;
 area.addEventListener("input",()=>{
  status.textContent="Speichert …";clearTimeout(timer);
  const value=area.value;
  timer=setTimeout(()=>writeNote(key,value,status),300);
 });
 area.addEventListener("blur",()=>{clearTimeout(timer);writeNote(key,area.value,status);});
 wrap.append(label,hint,area,status);
 return wrap;
}
function makePage(item,pageNo,totalPages){
 const section=document.createElement("section");section.className="binder-sheet";
 const top=document.createElement("div");top.className="binder-sheet-heading";
 const title=document.createElement("strong");title.textContent=item.name||item.fileName||"Hefterseite";
 const number=document.createElement("span");number.textContent=totalPages>1?"Seite "+pageNo+" von "+totalPages:"Hefterseite";
 top.append(title,number);
 const content=document.createElement("div");content.className="binder-sheet-content";
 const note=makeNote(item.id,pageNo);
 section.append(top,content,note);
 return {section,content};
}
async function loadPdfLibrary(){
 if(window.pdfjsLib)return window.pdfjsLib;
 await new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  script.onload=resolve;script.onerror=()=>reject(new Error("PDF-Anzeige konnte nicht geladen werden."));
  document.head.appendChild(script);
 });
 window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
 return window.pdfjsLib;
}
async function appendImage(item,file,scroll){
 const page=makePage(item,1,1),url=URL.createObjectURL(file);objectUrls.push(url);
 const img=document.createElement("img");img.src=url;img.alt=item.name||item.fileName||"Hefterseite";
 img.loading="lazy";page.content.appendChild(img);scroll.appendChild(page.section);
}
async function appendPdf(item,file,scroll,pdfjs){
 const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
 for(let n=1;n<=pdf.numPages;n++){
  const page=makePage(item,n,pdf.numPages);
  const pdfPage=await pdf.getPage(n);
  const base=pdfPage.getViewport({scale:1});
  const scale=Math.min(1.5,Math.max(.55,1100/base.width));
  const viewport=pdfPage.getViewport({scale});
  const canvas=document.createElement("canvas");
  canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
  canvas.setAttribute("aria-label","PDF-Seite "+n);
  page.content.appendChild(canvas);scroll.appendChild(page.section);
  await pdfPage.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
 }
}
async function open(id){
 const data=readData(),selected=(data.materials||[]).find(x=>x.id===id);
 if(!selected)return;
 const items=(data.materials||[])
  .filter(x=>x.subjectId===selected.subjectId&&isSupported(x))
  .sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
 const root=makeViewer(),scroll=$("binderScroll");
 objectUrls.forEach(url=>URL.revokeObjectURL(url));objectUrls=[];
 scroll.replaceChildren();
 $("binderTitle").textContent=(data.subjects||[]).find(s=>s.id===selected.subjectId)?.name||"Dein Hefter";
 $("binderSubtitle").textContent=items.length+" Materialien · Scrolle durch deine Unterlagen und ergänze Notizen direkt daneben";
 $("binderPageCount").textContent="Lernansicht";
 root.classList.add("open");
 let pdfjs=null,shown=0;
 for(const item of items){
  try{
   const file=await getFile(item.id);
   if(!file)throw new Error("Datei nicht gefunden");
   const type=(item.fileType||file.type||"").toLowerCase();
   const isPdf=type==="application/pdf"||(item.fileName||"").toLowerCase().endsWith(".pdf");
   if(isPdf){pdfjs=pdfjs||await loadPdfLibrary();await appendPdf(item,file,scroll,pdfjs);}
   else await appendImage(item,file,scroll);
   shown++;
  }catch(error){
   const section=document.createElement("section");section.className="binder-load-error";
   section.textContent=(item.fileName||item.name)+": "+error.message;
   scroll.appendChild(section);
  }
 }
 if(!shown){const empty=document.createElement("div");empty.className="binder-loading";empty.textContent="Keine lesbaren Bilder oder PDFs gefunden.";scroll.appendChild(empty);}
 scroll.scrollTop=0;
}

function ensureStyles(){
 if($("studyBinderStyles"))return;
 const style=document.createElement("style");style.id="studyBinderStyles";
 style.textContent="#studyBinder{position:fixed;inset:0;z-index:10060;background:#0b0e14;color:#f1f4f8;display:none;overflow:hidden}\n#studyBinder.open{display:block}\n#studyBinder .binder-window{height:100%;display:flex;flex-direction:column;min-height:0}\n#studyBinder .binder-head{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 22px;background:#121925;border-bottom:1px solid #293243}\n#studyBinder .binder-head-copy{display:flex;flex-direction:column;gap:4px}\n#studyBinder .binder-head-copy strong{font-size:17px}\n#studyBinder .binder-head-copy small,#studyBinder #binderPageCount{color:#9ba8ba;font-size:12px}\n#studyBinder .binder-head-actions{display:flex;align-items:center;gap:14px}\n#studyBinder button{border:1px solid #39465a;background:#202b3b;color:#f1f4f8;border-radius:9px;padding:10px 13px;cursor:pointer}\n#studyBinder .binder-scroll{overflow-y:auto;overscroll-behavior:contain;padding:24px max(14px,calc((100vw - 1180px)/2)) 60px}\n#studyBinder .binder-sheet{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(230px,.65fr);gap:16px;padding:16px;margin:0 auto 24px;max-width:1180px;background:#151d29;border:1px solid #2a3546;border-radius:14px;align-items:start}\n#studyBinder .binder-sheet-heading{grid-column:1/-1;display:flex;justify-content:space-between;gap:10px;color:#aab6c7;font-size:12px}\n#studyBinder .binder-sheet-heading strong{font-size:14px;color:#f1f4f8}\n#studyBinder .binder-sheet-content{min-width:0;background:#0d131d;border-radius:9px;overflow:hidden;display:flex;justify-content:center}\n#studyBinder .binder-sheet-content img{width:100%;height:auto;object-fit:contain;display:block}\n#studyBinder .binder-sheet-content canvas{width:100%;height:auto;display:block;background:white}\n#studyBinder .binder-page-notes{position:sticky;top:8px;display:flex;flex-direction:column;gap:8px}\n#studyBinder .binder-page-notes label{font-size:13px;font-weight:650}\n#studyBinder .binder-page-notes p,#studyBinder .binder-page-notes small{font-size:11px;color:#9ba8ba;margin:0}\n#studyBinder .binder-page-notes textarea{box-sizing:border-box;width:100%;min-height:190px;resize:vertical;border:1px solid #39465a;border-radius:9px;background:#0d131d;color:#f1f4f8;padding:12px;font:inherit;font-size:13px;line-height:1.55}\n#studyBinder .binder-page-notes textarea:focus{outline:2px solid #4689d6;outline-offset:1px}\n#studyBinder .binder-loading,#studyBinder .binder-load-error{padding:24px;margin:20px auto;max-width:900px;background:#151d29;border-radius:12px;color:#c4cede}\n@media(max-width:760px){#studyBinder .binder-head{padding:11px 12px}#studyBinder .binder-head-copy strong{font-size:14px}#studyBinder .binder-head-actions{gap:7px}#studyBinder #binderPageCount{display:none}#studyBinder .binder-scroll{padding:12px 9px 36px}#studyBinder .binder-sheet{grid-template-columns:1fr;padding:10px;gap:11px;margin-bottom:16px}#studyBinder .binder-sheet-heading{grid-column:1;flex-direction:column;gap:4px}#studyBinder .binder-page-notes{position:static}#studyBinder .binder-page-notes textarea{min-height:110px}}";
 document.head.appendChild(style);
}
function init(){
 ensureStyles();
 const input=$("materialFile");
 if(input){input.multiple=true;}
 window.addEventListener("studyspace:open-material",event=>open(event.detail.id));
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$("studyBinder")?.classList.contains("open"))close();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();