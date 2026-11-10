/* StudySpace digital binder reader */
(() => {
"use strict";
const DB="StudySpaceFilesDB", STORE="files", NOTES="studyspaceMaterialPageNotesV1";
let items=[], index=0, pageNo=1, pdf=null, saveTimer=null, currentUrl=null;
const $=id=>document.getElementById(id);
function readData(){try{return JSON.parse(localStorage.getItem("studyspaceData")||"{}");}catch{return {};}}
function notes(){try{return JSON.parse(localStorage.getItem(NOTES)||"{}");}catch{return {};}}
function saveNote(){
 const item=items[index], field=$("binderNote");if(!item||!field)return;
 const all=notes(),key=item.id+":"+pageNo,value=field.value;
 if(value.trim())all[key]=value;else delete all[key];
 localStorage.setItem(NOTES,JSON.stringify(all));
 $("binderNoteStatus").textContent="Gespeichert";
}
function dbFile(id){return new Promise((resolve,reject)=>{
 const req=indexedDB.open(DB);
 req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE)){db.close();resolve(null);return;}
 const tx=db.transaction(STORE,"readonly"),r=tx.objectStore(STORE).get(id);
 r.onsuccess=()=>{const f=r.result?.file||null;db.close();resolve(f);};
 r.onerror=()=>{db.close();reject(r.error);};};
 req.onerror=()=>reject(req.error);
});}
function supported(x){const t=(x.fileType||"").toLowerCase(),n=(x.fileName||"").toLowerCase();return t.startsWith("image/")||t==="application/pdf"||n.endsWith(".pdf");}
function modal(){
 let m=$("studyBinder");if(m)return m;
 m=document.createElement("div");m.id="studyBinder";m.className="binder-modal";
 m.innerHTML='<div class="binder-window"><header class="binder-head"><div><strong id="binderTitle">Digitaler Hefter</strong><small id="binderSubtitle"></small></div><button id="binderClose" type="button">Schließen ✕</button></header><nav class="binder-nav"><button id="binderPrev" type="button">← Zurück</button><span id="binderPosition"></span><button id="binderNext" type="button">Weiter →</button></nav><div class="binder-body"><main id="binderPage" class="binder-page">Lade Seite …</main><aside class="binder-notes"><strong>Notizen zu dieser Seite</strong><p>Diese Notiz bleibt genau dieser Hefterseite zugeordnet.</p><textarea id="binderNote" placeholder="Eigene Notizen …"></textarea><small id="binderNoteStatus">Wird automatisch gespeichert</small></aside></div></div>';
 document.body.appendChild(m);
 $("binderClose").onclick=close;
 $("binderPrev").onclick=()=>move(-1);$("binderNext").onclick=()=>move(1);
 $("binderNote").addEventListener("input",()=>{ $("binderNoteStatus").textContent="Speichert …";clearTimeout(saveTimer);saveTimer=setTimeout(saveNote,350);});
 $("binderNote").addEventListener("blur",()=>{clearTimeout(saveTimer);saveNote();});
 m.addEventListener("click",e=>{if(e.target===m)close();});
 return m;
}
function close(){clearTimeout(saveTimer);saveNote();$("studyBinder")?.classList.remove("open");pdf=null;if(currentUrl){URL.revokeObjectURL(currentUrl);currentUrl=null;}}
async function pdfLib(){
 if(window.pdfjsLib)return window.pdfjsLib;
 await new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=ok;s.onerror=()=>no(Error("PDF-Vorschau konnte nicht geladen werden."));document.head.appendChild(s);});
 window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";return window.pdfjsLib;
}
async function render(){
 const item=items[index];if(!item)return;
 const m=modal(),target=$("binderPage"),all=notes();
 $("binderTitle").textContent=item.name||item.fileName||"Hefter";
 $("binderSubtitle").textContent=item.fileName||"";
 $("binderNote").value=all[item.id+":"+pageNo]||"";
 $("binderNoteStatus").textContent="Wird automatisch gespeichert";
 target.textContent="Seite wird geladen …";
 try{
  const file=await dbFile(item.id);if(!file)throw Error("Datei nicht gefunden. Bitte erneut hochladen.");
  const isPdf=(item.fileType||file.type||"").toLowerCase()==="application/pdf"||(item.fileName||"").toLowerCase().endsWith(".pdf");
  if(isPdf){
   const lib=await pdfLib();if(!pdf||pdf._studySpaceId!==item.id){pdf=await lib.getDocument({data:await file.arrayBuffer()}).promise;pdf._studySpaceId=item.id;}
   const page=await pdf.getPage(pageNo),base=page.getViewport({scale:1}),scale=Math.min(1.7,Math.max(.5,(target.clientWidth-40)/base.width)),vp=page.getViewport({scale});
   const canvas=document.createElement("canvas");canvas.width=vp.width;canvas.height=vp.height;canvas.style.width="100%";canvas.style.height="auto";target.replaceChildren(canvas);
   await page.render({canvasContext:canvas.getContext("2d"),viewport:vp}).promise;
   $("binderPosition").textContent="Datei "+(index+1)+"/"+items.length+" · Seite "+pageNo+"/"+pdf.numPages;
   $("binderPrev").disabled=index===0&&pageNo===1;$("binderNext").disabled=index===items.length-1&&pageNo===pdf.numPages;
  }else{
   if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(file);
   const img=document.createElement("img");img.src=currentUrl;img.alt=item.name||"Hefterseite";target.replaceChildren(img);
   $("binderPosition").textContent="Datei "+(index+1)+"/"+items.length+" · Bildseite 1/1";
   $("binderPrev").disabled=index===0;$("binderNext").disabled=index===items.length-1;
  }
 }catch(e){target.textContent=e.message;$("binderPosition").textContent="Vorschau nicht verfügbar";}
}
async function move(delta){
 const item=items[index];if(!item)return;
 const isPdf=(item.fileType||"").toLowerCase()==="application/pdf"||(item.fileName||"").toLowerCase().endsWith(".pdf");
 if(isPdf&&pdf&&((delta>0&&pageNo<pdf.numPages)||(delta<0&&pageNo>1)))pageNo+=delta;
 else{index+=delta;if(index<0||index>=items.length){index=Math.max(0,Math.min(items.length-1,index));return;}pageNo=1;pdf=null;}
 await render();
}
async function open(id){
 const data=readData(),material=(data.materials||[]).find(x=>x.id===id);if(!material)return;
 items=(data.materials||[]).filter(x=>x.subjectId===material.subjectId&&supported(x)).sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
 index=Math.max(0,items.findIndex(x=>x.id===id));pageNo=1;pdf=null;
 modal().classList.add("open");await render();
}
function init(){
 const input=$("materialFile");if(input){input.multiple=true;const label=input.closest("label");if(label)label.firstChild.textContent="Mehrere Dateien oder Fotos";}
 window.addEventListener("studyspace:open-material",e=>open(e.detail.id));
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("studyBinder")?.classList.contains("open"))close();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();