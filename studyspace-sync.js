/* StudySpace – vollständige Gerätesicherung und Aufgabenmigration */
(() => {
  "use strict";
  const DB_NAME = "StudySpaceFilesDB";
  const STORE_NAME = "files";
  const COCKPIT_KEY = "studySpaceLearningCockpit";
  const $ = id => document.getElementById(id);

  function setStatus(message, error=false) {
    const el=$("backupStatus");
    if(el){el.textContent=message;el.style.color=error?"#fca5a5":"";}
  }
  function readLocalStorage() {
    const result={};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key!==null) result[key]=localStorage.getItem(key);
    }
    return result;
  }
  function openDB() {
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=event=>{
        const db=event.target.result;
        if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:"id"});
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
      request.onblocked=()=>reject(new Error("Die lokale Dateidatenbank ist gerade blockiert."));
    });
  }
  function getAllFiles() {
    return openDB().then(db=>new Promise((resolve,reject)=>{
      if(!db.objectStoreNames.contains(STORE_NAME)){db.close();resolve([]);return;}
      const tx=db.transaction(STORE_NAME,"readonly");
      const request=tx.objectStore(STORE_NAME).getAll();
      request.onsuccess=()=>{const rows=request.result||[];db.close();resolve(rows);};
      request.onerror=()=>{db.close();reject(request.error);};
    }));
  }
  async function blobToBase64(blob) {
    const bytes=new Uint8Array(await blob.arrayBuffer());
    let binary="";
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    return btoa(binary);
  }
  function base64ToBlob(base64,type) {
    const binary=atob(base64);const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return new Blob([bytes],{type:type||"application/octet-stream"});
  }
  async function createBackup() {
    const records=await getAllFiles();
    const files=[];
    for(const row of records){
      const blob=row.file instanceof Blob?row.file:(row.file?.blob instanceof Blob?row.file.blob:null);
      files.push({
        id:row.id,
        savedAt:row.savedAt||null,
        name:row.file?.name||row.name||"",
        type:blob?.type||"application/octet-stream",
        lastModified:row.file?.lastModified||null,
        content:blob?await blobToBase64(blob):null
      });
    }
    return {
      format:"studyspace-full-backup",
      version:1,
      createdAt:new Date().toISOString(),
      localStorage:readLocalStorage(),
      indexedDB:{database:DB_NAME,store:STORE_NAME,files}
    };
  }
  function download(data) {
    const blob=new Blob([JSON.stringify(data)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download="studyspace-komplettsicherung-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  async function restoreFiles(files) {
    const db=await openDB();
    if(!db.objectStoreNames.contains(STORE_NAME)){db.close();throw new Error("Die Dateidatenbank ist nicht vorhanden.");}
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE_NAME,"readwrite");const store=tx.objectStore(STORE_NAME);
      store.clear();
      for(const item of files||[]){
        if(!item.content)continue;
        const blob=base64ToBlob(item.content,item.type);
        let file=blob;
        if(item.name){try{file=new File([blob],item.name,{type:item.type,lastModified:item.lastModified||Date.now()});}catch{}}
        store.put({id:item.id,file,savedAt:item.savedAt||new Date().toISOString()});
      }
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
    db.close();
  }
  async function importBackup(file) {
    const backup=JSON.parse(await file.text());
    if(!backup||backup.format!=="studyspace-full-backup"||backup.version!==1||!backup.localStorage||typeof backup.localStorage!=="object"){
      throw new Error("Das ist keine gültige StudySpace-Komplettsicherung.");
    }
    const files=backup.indexedDB?.files||[];
    const count=Object.keys(backup.localStorage).length;
    if(!confirm("Die Sicherung enthält "+count+" Speicherbereiche und "+files.length+" Dateien. Die vorhandenen StudySpace-Daten auf diesem Gerät werden ersetzt. Fortfahren?"))return false;
    setStatus("Sicherung wird wiederhergestellt …");
    await restoreFiles(files);
    const existing=[];
    for(let i=0;i<localStorage.length;i++)existing.push(localStorage.key(i));
    existing.forEach(key=>localStorage.removeItem(key));
    Object.entries(backup.localStorage).forEach(([key,value])=>localStorage.setItem(key,String(value)));
    setStatus("Wiederherstellung abgeschlossen. StudySpace wird neu geladen.");
    location.reload();
    return true;
  }
  async function exportAll() {
    try{setStatus("Erstelle Komplettsicherung …");const backup=await createBackup();download(backup);setStatus("Komplettsicherung erstellt: "+Object.keys(backup.localStorage).length+" Speicherbereiche und "+backup.indexedDB.files.length+" Dateien.");}
    catch(error){console.error(error);setStatus("Sicherung fehlgeschlagen: "+error.message,true);}
  }

  function migrateLegacyTasks() {
    try{
      const raw=localStorage.getItem(COCKPIT_KEY);
      const state=raw?JSON.parse(raw):{goal:60,tasks:[],sessions:[],timer:{running:false,startedAt:null,elapsedBeforePause:0,taskId:""}};
      state.tasks=Array.isArray(state.tasks)?state.tasks:[];
      if(state.legacyTasksMigrated)return;
      const legacy=JSON.parse(localStorage.getItem("studyspaceData")||"{}");
      const oldTasks=Array.isArray(legacy.tasks)?legacy.tasks:[];
      oldTasks.forEach(task=>{
        const title=String(task.name||task.title||"").trim();
        if(!title)return;
        const duplicate=state.tasks.some(existing=>
          String(existing.title||"").trim().toLowerCase()===title.toLowerCase()&&
          (existing.date||"")===(task.date||"")
        );
        if(!duplicate)state.tasks.push({
          id:task.id||("migrated_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7)),
          title,priority:"normal",date:task.date||"",done:!!task.completed,
          createdAt:task.created||new Date().toISOString().slice(0,10),
          subjectId:task.subjectId||""
        });
      });
      state.legacyTasksMigrated=true;
      localStorage.setItem(COCKPIT_KEY,JSON.stringify(state));
    }catch(error){console.warn("StudySpace: Aufgabenmigration übersprungen.",error);}
  }

  function init() {
    migrateLegacyTasks();
    $("exportButton")?.addEventListener("click",exportAll);
    $("backupImportInput")?.addEventListener("change",async event=>{
      const file=event.target.files?.[0];if(!file)return;
      try{await importBackup(file);}catch(error){console.error(error);setStatus("Import fehlgeschlagen: "+error.message,true);}
      finally{event.target.value="";}
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();