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
 img.loading="lazy";img.classList.add("binder-fullscreen-trigger");img.title="Zum Vergrößern anklicken";img.tabIndex=0;img.setAttribute("role","button");
 img.addEventListener("click",()=>openImageFullscreen(img.src,img.alt,page.section.querySelector(".sp-ink")));
 img.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openImageFullscreen(img.src,img.alt);}});
 page.content.appendChild(img);
 const full=document.createElement("button");full.type="button";full.className="binder-image-fullscreen";full.textContent="⛶ Vollbild";
 full.addEventListener("click",()=>openImageFullscreen(img.src,img.alt,page.section.querySelector(".sp-ink")));
 const edit=document.createElement("button");edit.type="button";edit.className="binder-image-edit";edit.textContent="✂ Bild zuschneiden";
 edit.addEventListener("click",()=>openImageCropEditor(item,file,img));
 page.section.querySelector(".binder-sheet-heading").append(full,edit);
 scroll.appendChild(page.section);
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
  .sort((a,b)=>(a.materialOrder??0)-(b.materialOrder??0));
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
 style.textContent="#studyBinder{position:fixed;inset:0;z-index:10060;background:#0b0e14;color:#f1f4f8;display:none;overflow:hidden}\n#studyBinder.open{display:block}\n#studyBinder .binder-window{height:100%;display:flex;flex-direction:column;min-height:0}\n#studyBinder .binder-head{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 22px;background:#121925;border-bottom:1px solid #293243}\n#studyBinder .binder-head-copy{display:flex;flex-direction:column;gap:4px}\n#studyBinder .binder-head-copy strong{font-size:17px}\n#studyBinder .binder-head-copy small,#studyBinder #binderPageCount{color:#9ba8ba;font-size:12px}\n#studyBinder .binder-head-actions{display:flex;align-items:center;gap:14px}\n#studyBinder button{border:1px solid #39465a;background:#202b3b;color:#f1f4f8;border-radius:9px;padding:10px 13px;cursor:pointer}\n#studyBinder .binder-scroll{overflow-y:auto;overscroll-behavior:contain;padding:24px max(14px,calc((100vw - 1180px)/2)) 60px}\n#studyBinder .binder-sheet{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(230px,.65fr);gap:16px;padding:16px;margin:0 auto 24px;max-width:1180px;background:#151d29;border:1px solid #2a3546;border-radius:14px;align-items:start}\n#studyBinder .binder-sheet-heading{grid-column:1/-1;display:flex;justify-content:space-between;gap:10px;color:#aab6c7;font-size:12px}\n#studyBinder .binder-sheet-heading strong{font-size:14px;color:#f1f4f8}\n#studyBinder .binder-sheet-content{min-width:0;background:#0d131d;border-radius:9px;overflow:hidden;display:flex;justify-content:center}\n#studyBinder .binder-sheet-content img{width:100%;height:auto;object-fit:contain;display:block}\n#studyBinder .binder-sheet-content canvas{width:100%;height:auto;display:block;background:white}\n#studyBinder .sp-annotation-wrap{position:relative!important;display:block!important;width:100%;line-height:0;overflow:hidden}\n#studyBinder .sp-annotation-wrap>img{display:block;width:100%;height:auto}\n#studyBinder .sp-annotation-wrap>canvas.sp-ink{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;background:transparent!important;display:block;pointer-events:none;z-index:3}\n#studyBinder .binder-page-notes{position:sticky;top:8px;display:flex;flex-direction:column;gap:8px}\n#studyBinder .binder-page-notes label{font-size:13px;font-weight:650}\n#studyBinder .binder-page-notes p,#studyBinder .binder-page-notes small{font-size:11px;color:#9ba8ba;margin:0}\n#studyBinder .binder-page-notes textarea{box-sizing:border-box;width:100%;min-height:190px;resize:vertical;border:1px solid #39465a;border-radius:9px;background:#0d131d;color:#f1f4f8;padding:12px;font:inherit;font-size:13px;line-height:1.55}\n#studyBinder .binder-page-notes textarea:focus{outline:2px solid #4689d6;outline-offset:1px}\n#studyBinder .binder-loading,#studyBinder .binder-load-error{padding:24px;margin:20px auto;max-width:900px;background:#151d29;border-radius:12px;color:#c4cede}\n@media(max-width:760px){#studyBinder .binder-head{padding:11px 12px}#studyBinder .binder-head-copy strong{font-size:14px}#studyBinder .binder-head-actions{gap:7px}#studyBinder #binderPageCount{display:none}#studyBinder .binder-scroll{padding:12px 9px 36px}#studyBinder .binder-sheet{grid-template-columns:1fr;padding:10px;gap:11px;margin-bottom:16px}#studyBinder .binder-sheet-heading{grid-column:1;flex-direction:column;gap:4px}#studyBinder .binder-page-notes{position:static}#studyBinder .binder-page-notes textarea{min-height:110px}}";
 document.head.appendChild(style);
 if(!$("studyImageFullscreenStyles")){const fsStyle=document.createElement("style");fsStyle.id="studyImageFullscreenStyles";fsStyle.textContent="\n#studyBinder .binder-image-fullscreen{margin-left:auto;white-space:nowrap;font-size:12px;padding:7px 10px}\n#studyBinder .binder-image-edit{margin-left:0}\n#studyBinder .binder-fullscreen-trigger{cursor:zoom-in}\n#studyBinder .binder-fullscreen-trigger:focus-visible{outline:3px solid #65a9ff;outline-offset:3px}\n.study-image-fullscreen{position:fixed;inset:0;z-index:10200;background:rgba(3,6,11,.97);display:flex;align-items:center;justify-content:center;padding:56px 18px 38px;box-sizing:border-box}\n.study-image-fullscreen img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}\n.study-image-fullscreen button{position:absolute;top:14px;right:16px;border:1px solid #536176;border-radius:9px;background:#202b3b;color:#fff;padding:10px 14px;font:inherit;cursor:pointer}\n.study-image-fullscreen span{position:absolute;bottom:10px;left:0;right:0;text-align:center;color:#aab6c7;font-size:11px}\n@media(max-width:650px){#studyBinder .binder-image-fullscreen{font-size:11px;padding:7px}.study-image-fullscreen{padding:52px 8px 38px}}\n";document.head.appendChild(fsStyle);}
 if(!$("studyCropEditorStyles")){const cropStyle=document.createElement("style");cropStyle.id="studyCropEditorStyles";cropStyle.textContent="\n#studyBinder .binder-image-edit{margin-left:auto;white-space:nowrap;font-size:12px;padding:7px 10px}\n.study-crop-modal{position:fixed;inset:0;z-index:10100;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}\n.study-crop-dialog{width:min(100%,1000px);max-height:95vh;display:flex;flex-direction:column;background:#151d29;color:#f1f4f8;border:1px solid #39465a;border-radius:15px;overflow:hidden;box-shadow:0 25px 80px #0009}\n.study-crop-dialog header,.study-crop-dialog footer{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#121925}\n.study-crop-dialog header{justify-content:space-between;border-bottom:1px solid #293243}\n.study-crop-dialog header div{display:flex;flex-direction:column;gap:4px}.study-crop-dialog header small,.study-crop-status{color:#9ba8ba;font-size:12px}\n.study-crop-dialog button{border:1px solid #39465a;background:#202b3b;color:#f1f4f8;border-radius:9px;padding:9px 13px;cursor:pointer}\n.study-crop-dialog button:disabled{opacity:.5;cursor:wait}\n.study-crop-stage{min-height:180px;max-height:calc(95vh - 150px);padding:14px;display:flex;justify-content:center;overflow:hidden;background:#090d14}\n.study-crop-stage img{display:block;max-width:100%;max-height:calc(95vh - 190px)}\n.study-crop-spacer{flex:1}.study-crop-status{padding:0 18px;margin:0 0 10px;min-height:15px}\n@media(max-width:650px){#studyBinder .binder-image-edit{font-size:11px;padding:7px}.study-crop-modal{padding:6px}.study-crop-dialog footer{padding:10px;flex-wrap:wrap}.study-crop-stage{padding:6px}}\n";document.head.appendChild(cropStyle);}
}

function openImageFullscreen(src,alt,annotationCanvas){
 const previous=$("studyImageFullscreen");
 if(previous)previous.remove();
 const viewer=document.createElement("div");
 viewer.id="studyImageFullscreen";
 Object.assign(viewer.style,{
  position:"fixed",inset:"0",zIndex:"2147483000",background:"#05070b",
  display:"flex",alignItems:"center",justifyContent:"center",
  padding:"58px 12px 42px",boxSizing:"border-box",width:"100vw",height:"100dvh"
 });
 const image=document.createElement("img");
 image.alt=alt||"Materialbild";
 image.src=src;
 if(annotationCanvas){
  image.addEventListener("load",()=>{
   try{
    const composite=document.createElement("canvas");
    composite.width=annotationCanvas.width||image.naturalWidth;
    composite.height=annotationCanvas.height||image.naturalHeight;
    const cx=composite.getContext("2d");
    cx.drawImage(image,0,0,composite.width,composite.height);
    cx.drawImage(annotationCanvas,0,0,composite.width,composite.height);
    image.src=composite.toDataURL("image/png");
   }catch(error){console.warn("Annotationen konnten nicht in die Vollbildansicht übernommen werden.",error);}
  },{once:true});
 }

 Object.assign(image.style,{display:"block",maxWidth:"100%",maxHeight:"100%",width:"auto",height:"auto",objectFit:"contain",touchAction:"pinch-zoom"});
 const closeButton=document.createElement("button");
 closeButton.type="button";closeButton.textContent="✕ Schließen";
 Object.assign(closeButton.style,{position:"absolute",top:"12px",right:"12px",zIndex:"2",padding:"11px 15px",border:"1px solid #667085",borderRadius:"10px",background:"#202b3b",color:"#fff",fontSize:"14px",cursor:"pointer"});
 const hint=document.createElement("div");
 hint.textContent="Tippe außerhalb des Bildes oder auf Schließen";
 Object.assign(hint.style,{position:"absolute",bottom:"12px",left:"8px",right:"8px",textAlign:"center",color:"#c4cede",fontSize:"12px",pointerEvents:"none"});
 const close=()=>{
  if(document.fullscreenElement===viewer&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  viewer.remove();document.removeEventListener("keydown",onKey);
 };
 const onKey=event=>{if(event.key==="Escape")close();};
 closeButton.addEventListener("click",close);
 viewer.addEventListener("click",event=>{if(event.target===viewer||event.target===hint)close();});
 viewer.append(image,closeButton,hint);
 document.addEventListener("keydown",onKey);
 document.body.appendChild(viewer);
 // Native fullscreen where supported; fixed full-window overlay remains the fallback.
 const enter=viewer.requestFullscreen||viewer.webkitRequestFullscreen;
 if(enter){try{const result=enter.call(viewer);if(result&&typeof result.catch==="function")result.catch(()=>{});}catch(error){/* fallback overlay stays visible */}}
}

async function loadCropper(){
 if(window.Cropper)return window.Cropper;
 if(!$("studyCropperCss")){
  const link=document.createElement("link");link.id="studyCropperCss";link.rel="stylesheet";
  link.href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css";document.head.appendChild(link);
 }
 await new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js";
  script.onload=resolve;script.onerror=()=>reject(new Error("Bildeditor konnte nicht geladen werden."));
  document.head.appendChild(script);
 });
 return window.Cropper;
}
async function saveCroppedImage(item,blob){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite"),store=tx.objectStore(STORE),req=store.get(item.id);
  req.onsuccess=()=>{
   if(!req.result){tx.abort();return;}
   const old=req.result.file;
   const file=new File([blob],(item.fileName||"Material").replace(/\.[^.]+$/,"")+"_zugeschnitten.png",{type:"image/png",lastModified:Date.now()});
   store.put({...req.result,file});
  };
  tx.oncomplete=()=>{db.close();resolve(true);};
  tx.onerror=()=>{db.close();reject(tx.error);};
  tx.onabort=()=>{db.close();reject(tx.error||new Error("Speichern fehlgeschlagen."));};
 });
}
async function openImageCropEditor(item,file,currentImage){
 let CropperClass;
 try{CropperClass=await loadCropper();}catch(error){alert(error.message);return;}
 const modal=document.createElement("div");modal.className="study-crop-modal";
 modal.innerHTML='<div class="study-crop-dialog"><header><div><strong>Bild zuschneiden</strong><small>Ziehe den Rahmen auf den gewünschten Bildausschnitt.</small></div><button type="button" data-crop-close>Schließen</button></header><div class="study-crop-stage"><img alt="Bild zum Zuschneiden"></div><footer><button type="button" data-crop-reset>Zurücksetzen</button><span class="study-crop-spacer"></span><button type="button" data-crop-save>Zuschnitt speichern</button></footer><p class="study-crop-status" aria-live="polite"></p></div>';
 document.body.appendChild(modal);
 const image=modal.querySelector("img"),url=URL.createObjectURL(file);image.src=url;
 let cropper=null,closed=false;
 const cleanup=()=>{if(closed)return;closed=true;if(cropper)cropper.destroy();URL.revokeObjectURL(url);modal.remove();};
 modal.querySelector("[data-crop-close]").addEventListener("click",cleanup);
 modal.addEventListener("click",e=>{if(e.target===modal)cleanup();});
 image.onload=()=>{cropper=new CropperClass(image,{viewMode:1,dragMode:"crop",autoCropArea:.85,background:false,responsive:true,restore:false,checkOrientation:true});};
 modal.querySelector("[data-crop-reset]").addEventListener("click",()=>cropper?.reset());
 modal.querySelector("[data-crop-save]").addEventListener("click",()=>{
  if(!cropper)return;
  const button=modal.querySelector("[data-crop-save]"),status=modal.querySelector(".study-crop-status");
  button.disabled=true;status.textContent="Speichert den Bildausschnitt …";
  cropper.getCroppedCanvas({maxWidth:4000,maxHeight:4000,imageSmoothingQuality:"high"}).toBlob(async blob=>{
   try{
    if(!blob)throw new Error("Der Bildausschnitt konnte nicht erstellt werden.");
    await saveCroppedImage(item,blob);
    const updated=await getFile(item.id);
    if(updated){
     const newUrl=URL.createObjectURL(updated);objectUrls.push(newUrl);
     currentImage.src=newUrl;
     currentImage.dataset.edited="true";
    }
    item.fileType="image/png";
    item.fileName=(item.fileName||"Material").replace(/\.[^.]+$/,"")+"_zugeschnitten.png";
    status.textContent="Gespeichert!";
    setTimeout(cleanup,450);
   }catch(error){status.textContent=error.message;button.disabled=false;}
  },"image/png");
 });
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