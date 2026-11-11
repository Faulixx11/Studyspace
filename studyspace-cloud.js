/* StudySpace Cloud Sync – private account-based sync across devices */
(() => {
"use strict";
const CONFIG_KEY="studyspaceCloudConfig", META_KEY="studyspaceCloudMeta", TABLE="studyspace_backups", BUCKET="studyspace-files", DB_NAME="StudySpaceFilesDB", STORE="files";
const $=id=>document.getElementById(id);
let client=null,user=null,busy=false,restoring=false,dirty=false,debounce=null,initializing=false,syncPaused=false;
const excluded=k=>k===CONFIG_KEY||k===META_KEY||k.startsWith("sb-");
const appKey=k=>!excluded(k);
const status=(message,error=false)=>{const el=$("ss-cloud-status");if(el){el.textContent=message;el.style.color=error?"#fca5a5":"";}};
const readConfig=()=>{try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||"{}");}catch{return {};}};
const readMeta=()=>{try{return JSON.parse(localStorage.getItem(META_KEY)||"{}");}catch{return {};}};
const saveMeta=value=>localStorage.setItem(META_KEY,JSON.stringify(value));
function addStyles(){
 if($("ss-cloud-styles"))return;
 const s=document.createElement("style");s.id="ss-cloud-styles";
 s.textContent="#ss-cloud-panel{margin-top:18px;position:relative;z-index:20;pointer-events:auto}#ss-cloud-panel button,#ss-cloud-panel input{pointer-events:auto;position:relative;z-index:21}#ss-cloud-panel .ss-cloud-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#ss-cloud-panel input{box-sizing:border-box;width:100%;padding:11px;border:1px solid #39465a;border-radius:9px;background:#101722;color:#f1f4f8;font:inherit}#ss-cloud-panel .ss-field{display:flex;flex-direction:column;gap:6px;margin:9px 0;font-size:13px}#ss-cloud-panel .ss-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#ss-cloud-panel .ss-actions button{border:1px solid #39465a;border-radius:9px;background:#202b3b;color:#f1f4f8;padding:10px 13px;cursor:pointer;font:inherit;font-size:12px}#ss-cloud-panel .ss-actions .ss-primary{background:#315f9b;border-color:#477fc0}#ss-cloud-panel .ss-muted{font-size:12px;color:#9ba8ba;line-height:1.5}#ss-cloud-panel .ss-state{padding:10px;border-radius:9px;background:#101722;border:1px solid #30394a;margin-top:12px;font-size:12px;line-height:1.5}@media(max-width:650px){#ss-cloud-panel .ss-cloud-grid{grid-template-columns:1fr}}";
 document.head.appendChild(s);
}
function addPanel(){
 const page=$("page-settings");if(!page||$("ss-cloud-panel"))return;
 const panel=document.createElement("div");panel.className="panel";panel.id="ss-cloud-panel";
 panel.innerHTML=[
 '<h3>Cloud-Synchronisierung</h3>',
 '<p class="ss-muted">Melde dich auf PC und Tablet mit demselben Konto an. StudySpace überträgt Fächer, Karteikarten, Lernstände, Notizen, Hefterseiten und hochgeladene Dateien über eine private Verbindung. Verwende ausschließlich die öffentliche Publishable Key – niemals einen Secret- oder Service-Role-Key.</p>',
 '<div class="ss-cloud-grid"><label class="ss-field">Supabase Project URL<input id="ss-cloud-url" type="url" placeholder="https://dein-projekt.supabase.co"></label><label class="ss-field">Publishable Key<input id="ss-cloud-key" type="text" placeholder="sb_publishable_…" autocomplete="off"></label></div>',
 '<div class="ss-actions"><button class="ss-primary" id="ss-cloud-config-save">Verbindung speichern</button><button id="ss-cloud-test">Verbindung prüfen</button></div>',
 '<hr style="border:0;border-top:1px solid #30394a;margin:16px 0">',
 '<div class="ss-cloud-grid"><label class="ss-field">E-Mail<input id="ss-cloud-email" type="email" placeholder="deine E-Mail-Adresse" autocomplete="email"></label><label class="ss-field">Passwort<input id="ss-cloud-password" type="password" placeholder="Mindestens 8 Zeichen" autocomplete="current-password"></label></div>',
 '<div class="ss-actions"><button class="ss-primary" id="ss-cloud-signup">Konto erstellen</button><button id="ss-cloud-login">Anmelden</button><button id="ss-cloud-reset">Passwort zurücksetzen</button><button id="ss-cloud-logout">Abmelden</button></div>',
 '<div class="ss-actions"><button class="ss-primary" id="ss-cloud-download">Cloud → dieses Gerät: Daten übernehmen</button><button id="ss-cloud-now">Dieses Gerät → Cloud: Daten übertragen</button></div>',
 '<div class="ss-state" id="ss-cloud-status" aria-live="polite">Noch nicht verbunden. Zuerst Projekt-URL und Publishable Key eintragen.</div>',
 '<p class="ss-muted">Bei unterschiedlichen Datenständen wird die Synchronisierung aus Sicherheitsgründen angehalten. Nutze „Cloud → dieses Gerät“, wenn die Cloud-Daten richtig sind. Nutze „Dieses Gerät → Cloud“ nur, wenn die lokalen Daten dieses Geräts die richtige Version sind; damit wird die bisherige Cloud-Sicherung ersetzt. Nach dieser Entscheidung synchronisiert StudySpace Änderungen automatisch in beide Richtungen. Das SQL-Schema aus cloud-sync-setup.sql muss einmal im Supabase SQL Editor ausgeführt werden.</p>'
 ].join("");
 page.appendChild(panel);
 const cfg=readConfig();$("ss-cloud-url").value=cfg.url||"";$("ss-cloud-key").value=cfg.key||"";
 panel.addEventListener("click",event=>{
  const button=event.target.closest("button");
  if(!button||!panel.contains(button))return;
  event.preventDefault();
  const actions={
   "ss-cloud-config-save":configure,
   "ss-cloud-test":testConnection,
   "ss-cloud-signup":signUp,
   "ss-cloud-login":signIn,
   "ss-cloud-reset":resetPassword,
   "ss-cloud-logout":signOut,
   "ss-cloud-now":()=>syncNow(true,true),
   "ss-cloud-download":()=>downloadCloud(true)
  };
  const action=actions[button.id];
  if(action){button.disabled=true;Promise.resolve().then(action).catch(error=>{console.error("StudySpace Cloud action",error);status("Aktion fehlgeschlagen: "+error.message,true);}).finally(()=>{button.disabled=false;});}
 },true);
}
function configure(){
 const url=$("ss-cloud-url").value.trim().replace(/\/+$/,""),key=$("ss-cloud-key").value.trim();
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)){
  status("Project URL ungültig: Erwartet wird https://DEIN-PROJEKT.supabase.co (ohne /dashboard oder weitere Pfade).",true);return;
 }
 if(!key){
  status("Publishable Key fehlt. Trage den Schlüssel ein, der mit sb_publishable_ beginnt.",true);return;
 }
 if(!key.startsWith("sb_publishable_")&&!/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)){
  status("Falscher Schlüsseltyp: Verwende den Publishable Key (sb_publishable_…). Keinen sb_secret_-Key verwenden.",true);return;
 }
 localStorage.setItem(CONFIG_KEY,JSON.stringify({url,key}));connect();status("Verbindungseinstellungen gespeichert. Jetzt Verbindung prüfen oder anmelden.");
}
function connect(){
 const cfg=readConfig();if(!cfg.url||!cfg.key)return false;
 if(!window.supabase?.createClient){
  status("Cloud-Bibliothek wird geladen …");
  if(!window.__studySpaceSupabaseFallbackStarted){
   window.__studySpaceSupabaseFallbackStarted=true;
   const script=document.createElement("script");
   script.src="https://unpkg.com/@supabase/supabase-js@2";
   script.onload=()=>{if(window.supabase?.createClient){window.__studySpaceSupabaseFallbackStarted=false;connect();}else status("Cloud-Bibliothek konnte auf diesem Gerät nicht gestartet werden.",true);};
   script.onerror=()=>status("Cloud-Bibliothek konnte nicht geladen werden. Prüfe die Internetverbindung oder den Browser-Inhaltsschutz.",true);
   document.head.appendChild(script);
  }
  return false;
 }
 client=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 client.auth.onAuthStateChange((event,session)=>{user=session?.user||null;if(user){status("Angemeldet als "+user.email+". Synchronisierung startet …");setTimeout(()=>initialSync(),0);}else status("Nicht angemeldet. Lokale Daten bleiben auf diesem Gerät erhalten.");});
 client.auth.getSession().then(({data,error})=>{if(error){status("Anmeldestatus konnte nicht geladen werden: "+error.message,true);return;}user=data.session?.user||null;if(user){status("Angemeldet als "+user.email+".");initialSync();}else status("Cloud-Verbindung bereit. Bitte anmelden oder Konto erstellen.");});
 return true;
}
async function testConnection(){
 if(!client&&!connect())return;
 try{
  const {data:sessionData,error:sessionError}=await client.auth.getSession();
  if(sessionError)throw new Error("Anmeldung bei Supabase: "+sessionError.message);
  const session=sessionData.session;
  if(!session){status("Supabase ist erreichbar, aber dieses Gerät ist nicht angemeldet. Bitte anmelden.",true);return;}
  user=session.user;
  const {data,error}=await client.from(TABLE).select("updated_at").eq("user_id",user.id).maybeSingle();
  if(error)throw new Error("Datenbankzugriff fehlgeschlagen: "+error.message+" Prüfe cloud-sync-setup.sql in Supabase.");
  let storageStatus="Cloud-Dateispeicher erreichbar";
  try{
   const {error:storageError}=await client.storage.from(BUCKET).list(user.id,{limit:1});
   if(storageError)throw storageError;
  }catch(storageError){storageStatus="Dateispeicher nicht erreichbar: "+storageError.message;}
  const fileState=await getFilesState();
  const localStatus=fileState.available?"lokaler Dateispeicher OK ("+fileState.rows.length+" Dateien)":"lokaler Dateispeicher blockiert: "+fileState.reason;
  status((data?"Cloud-Sicherung gefunden. ":"Noch keine Cloud-Sicherung. ")+"Anmeldung OK · Datenbank OK · "+storageStatus+" · "+localStatus,data===null&&false||!fileState.available||storageStatus.includes("nicht erreichbar"));
 }catch(e){
  console.error("StudySpace Cloud connection test",e);
  status("Verbindungstest fehlgeschlagen: "+e.message,true);
 }
}

async function signUp(){
 if(!client&&!connect())return;const email=$("ss-cloud-email").value.trim(),password=$("ss-cloud-password").value;
 if(!email||password.length<8){status("Bitte E-Mail und ein Passwort mit mindestens 8 Zeichen eingeben.",true);return;}
 try{status("Konto wird erstellt …");const {data,error}=await client.auth.signUp({email,password});if(error)throw error;if(data.session){user=data.user;status("Konto erstellt. Du bist angemeldet.");await initialSync();}else status("Konto erstellt. Bitte bestätige den Link in deiner E-Mail und melde dich danach an.");}catch(e){status("Konto konnte nicht erstellt werden: "+e.message,true);}
}
async function signIn(){
 if(!client&&!connect())return;const email=$("ss-cloud-email").value.trim(),password=$("ss-cloud-password").value;
 if(!email||!password){status("Bitte E-Mail und Passwort eingeben.",true);return;}
 try{status("Anmeldung läuft …");const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;user=data.user;status("Angemeldet. Synchronisierung startet …");await initialSync();}catch(e){status("Anmeldung fehlgeschlagen: "+e.message,true);}
}
async function resetPassword(){if(!client&&!connect())return;const email=$("ss-cloud-email").value.trim();if(!email){status("Bitte zuerst deine E-Mail-Adresse eingeben.",true);return;}try{const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;status("Falls ein Konto existiert, wurde ein Link zum Zurücksetzen versendet.");}catch(e){status("Zurücksetzen fehlgeschlagen: "+e.message,true);}}
async function signOut(){if(!client)return;try{const {error}=await client.auth.signOut();if(error)throw error;user=null;status("Abgemeldet. Deine lokalen Daten bleiben erhalten.");}catch(e){status("Abmeldung fehlgeschlagen: "+e.message,true);}}
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error("Dieser Browser erlaubt IndexedDB nicht."));return;}
  const open=(version)=>{
   let req;
   try{req=version?indexedDB.open(DB_NAME,version):indexedDB.open(DB_NAME);}
   catch(error){reject(error);return;}
   req.onupgradeneeded=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"id"});
   };
   req.onsuccess=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains(STORE)){
     const nextVersion=db.version+1;db.close();open(nextVersion);return;
    }
    resolve(db);
   };
   req.onerror=()=>reject(req.error||new Error("StudySpace-Dateispeicher konnte nicht geöffnet werden."));
   req.onblocked=()=>reject(new Error("Der Dateispeicher wird von einem anderen StudySpace-Tab blockiert. Schließe andere Tabs und lade neu."));
  };
  open();
 });
}
async function getFilesState(){
 let db=null;
 try{
  db=await openDB();
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,"readonly"),req=tx.objectStore(STORE).getAll();
   req.onsuccess=()=>resolve({available:true,rows:req.result||[],reason:""});
   req.onerror=()=>reject(req.error||new Error("Dateiliste konnte nicht gelesen werden."));
   tx.onabort=()=>reject(tx.error||new Error("Dateidatenbank wurde abgebrochen."));
  });
 }catch(error){
  return {available:false,rows:[],reason:error?.message||"Unbekannter IndexedDB-Fehler"};
 }finally{try{db?.close();}catch{}}
}
async function getFiles(){
 const result=await getFilesState();
 if(!result.available)throw new Error(result.reason);
 return result.rows;
}

async function replaceFiles(files){
 const db=await openDB();if(!db.objectStoreNames.contains(STORE)){db.close();throw new Error("Lokale Dateidatenbank fehlt.");}
 await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite"),store=tx.objectStore(STORE);store.clear();for(const item of files){if(!(item.blob instanceof Blob))continue;let file=item.blob;if(item.name){try{file=new File([item.blob],item.name,{type:item.type||item.blob.type,lastModified:item.lastModified||Date.now()});}catch{}}store.put({...item.metadata,id:item.id,file,savedAt:item.savedAt||new Date().toISOString()});}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});db.close();
}
function collectLocal(){const values={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&appKey(k))values[k]=localStorage.getItem(k);}return values;}
async function pushCloud(){
 if(!client||!user)return false;
 if(busy){status("Synchronisierung läuft bereits …");return false;}
 busy=true;
 try{
  status("Lernstände und Dateien werden in die Cloud übertragen …");
  const remoteBefore=await fetchRemote();
  const fileState=await getFilesState();
  const manifest=[...(remoteBefore?.payload?.files||[])];
  let fileUploadErrors=0;
  if(fileState.available){
   for(const row of fileState.rows){
    const blob=row.file instanceof Blob?row.file:(row.file?.blob instanceof Blob?row.file.blob:null);
    if(!blob||row.id===undefined||row.id===null)continue;
    const id=String(row.id).replace(/[^a-zA-Z0-9_-]/g,"_"),path=user.id+"/"+id;
    try{
     const {error}=await client.storage.from(BUCKET).upload(path,blob,{upsert:true,contentType:blob.type||"application/octet-stream"});
     if(error)throw error;
     const metadata={...row};delete metadata.file;
     const entry={id:row.id,path,name:row.file?.name||row.name||"",type:blob.type||"application/octet-stream",lastModified:row.file?.lastModified||null,savedAt:row.savedAt||null,metadata};
     const existing=manifest.findIndex(item=>String(item.id)===String(row.id));
     if(existing>=0)manifest[existing]=entry;else manifest.push(entry);
    }catch(error){fileUploadErrors++;console.warn("StudySpace file upload failed",row.id,error);}
   }
  }
  const payload={localStorage:collectLocal(),files:manifest,version:1};
  const syncedAt=new Date().toISOString();
  const {error}=await client.from(TABLE).upsert({user_id:user.id,payload,updated_at:syncedAt},{onConflict:"user_id"});
  if(error)throw error;
  saveMeta({...readMeta(),lastSync:syncedAt,lastRemoteAt:syncedAt,conflictRemoteAt:null,accountId:user.id});
  dirty=false;
  let message="Synchronisiert · "+new Date().toLocaleString("de-DE")+" · "+manifest.length+" Dateien.";
  if(!fileState.available)message="Lernstände synchronisiert. Der Dateispeicher dieses Geräts ist nicht erreichbar; bereits vorhandene Cloud-Dateien bleiben erhalten. ("+fileState.reason+")";
  else if(fileUploadErrors)message="Lernstände synchronisiert; "+fileUploadErrors+" Datei(en) konnten nicht übertragen werden. Die übrige Cloud-Sicherung blieb erhalten.";
  status(message,fileUploadErrors>0||!fileState.available);
  return true;
 }catch(e){
  console.error("StudySpace Cloud Sync",e);
  status("Synchronisierung fehlgeschlagen: "+(e?.message||String(e)),true);
  return false;
 }finally{busy=false;}
}

async function fetchRemote(){const {data,error}=await client.from(TABLE).select("payload,updated_at").eq("user_id",user.id).maybeSingle();if(error)throw error;return data||null;}
async function downloadCloud(confirmReplace){
 if(!client||!user){status("Bitte zuerst anmelden.",true);return;}
 if(busy)return;
 busy=true;
 try{
  status("Cloud-Daten werden geladen …");
  const remote=await fetchRemote();
  if(!remote){status("Für dieses Konto gibt es noch keine Cloud-Sicherung. Dieses Gerät kann die erste Sicherung hochladen.");return;}
  if(confirmReplace&&!confirm("Die Daten auf diesem Gerät werden durch die Cloud-Sicherung ersetzt. Die Cloud-Sicherung bleibt unverändert. Fortfahren?"))return;
  restoring=true;
  const downloaded=[];
  let fileWarning="";
  try{
   for(const item of remote.payload.files||[]){
    const {data,error}=await client.storage.from(BUCKET).download(item.path);
    if(error)throw error;
    downloaded.push({...item,blob:data});
   }
   await replaceFiles(downloaded);
  }catch(error){
   fileWarning=" Die Dateianhänge konnten auf diesem Gerät nicht vollständig geladen werden ("+(error?.message||String(error))+").";
   console.warn("StudySpace file restore warning",error);
  }
  const remoteStorage=remote.payload.localStorage||{};
  Object.keys(localStorage).forEach(k=>{if(appKey(k))localStorage.removeItem(k);});
  Object.entries(remoteStorage).forEach(([k,v])=>{if(appKey(k))localStorage.setItem(k,String(v));});
  saveMeta({...readMeta(),lastRemoteAt:remote.updated_at,lastAppliedRemoteAt:remote.updated_at,conflictRemoteAt:null,accountId:user.id});
  status("Cloud-Lernstände geladen."+fileWarning+" StudySpace wird neu gestartet …",!!fileWarning);
  location.reload();
 }catch(e){
  console.error(e);
  status("Cloud-Daten konnten nicht geladen werden: "+(e?.message||String(e)),true);
 }finally{restoring=false;busy=false;}
}

function timestampMatches(a,b){
 if(a===b)return true;
 const left=Date.parse(a||""),right=Date.parse(b||"");
 return Number.isFinite(left)&&Number.isFinite(right)&&Math.abs(left-right)<1000;
}
function hasMeaningfulLocalData(){
 const local=collectLocal();
 const ignoredKeys=new Set([CONFIG_KEY,META_KEY,"studyspacePracticeSettingsV1"]);
 const meaningful=value=>{
  if(value===null||value===undefined)return false;
  if(Array.isArray(value))return value.length>0;
  if(typeof value==="object"){
   return Object.entries(value).some(([childKey,child])=>{
    if(["settings","timer","accent","fontSize","dailyLimit","targetRetention","version","createdAt","updatedAt","lastOpened"].includes(childKey))return false;
    return meaningful(child);
   });
  }
  if(typeof value==="string")return value.trim().length>0;
  return false;
 };
 for(const [key,raw] of Object.entries(local)){
  if(ignoredKeys.has(key))continue;
  try{if(meaningful(JSON.parse(raw)))return true;}
  catch{if(raw&&raw.trim())return true;}
 }
 return false;
}
async function localStateMatchesRemote(remote){
 const remoteStorage=remote?.payload?.localStorage||{};
 const localStorageValues=collectLocal();
 const keys=new Set([...Object.keys(localStorageValues),...Object.keys(remoteStorage)].filter(appKey));
 for(const key of keys){
  if((localStorageValues[key]??null)!==(remoteStorage[key]===undefined?null:String(remoteStorage[key])))return false;
 }
 const localState=await getFilesState();
 if(!localState.available)return false;
 const localIds=localState.rows.map(row=>String(row.id)).sort();
 const remoteIds=(remote?.payload?.files||[]).map(row=>String(row.id)).sort();
 return JSON.stringify(localIds)===JSON.stringify(remoteIds);
}

async function initialSync(){
 if(!client||!user||busy||initializing)return;
 initializing=true;
 try{
  const remote=await fetchRemote();
  if(!remote){
   syncPaused=false;
   status("Noch keine Cloud-Sicherung vorhanden. Dieses Gerät erstellt jetzt die erste Sicherung.");
   await pushCloud();
   startAutoSync();
   return;
  }
  const meta=readMeta();
  if(meta.accountId===user.id&&meta.conflictRemoteAt===remote.updated_at){
   syncPaused=true;
   status("Nur lokale Speicherung aktiv: Datenkonflikt erkannt. Wähle unten „Cloud → dieses Gerät“ oder „Dieses Gerät → Cloud“, um die Synchronisierung wieder freizugeben.",true);
   startAutoSync();
   return;
  }
  if(meta.accountId===user.id&&meta.lastAppliedRemoteAt===remote.updated_at){
   syncPaused=false;
   status("Diese Cloud-Sicherung wurde bereits auf diesem Gerät übernommen · "+user.email);
   startAutoSync();
   return;
  }
  if(meta.accountId===user.id&&timestampMatches(meta.lastRemoteAt,remote.updated_at)&&await localStateMatchesRemote(remote)){
   syncPaused=false;
   status("Cloud und dieses Gerät enthalten dieselben Lernstände · "+user.email);
   startAutoSync();
   return;
  }
  const hasLocal=hasMeaningfulLocalData();
  if(!hasLocal){
   syncPaused=false;
   status("Vorhandene Cloud-Sicherung gefunden. Dieses Gerät ist leer – die Lernstände werden geladen …");
   await downloadCloud(false);
   return;
  }
  const sameAccount=meta.accountId===user.id;
  const message=(sameAccount
   ?"Die Cloud-Sicherung wurde seit der letzten Synchronisierung geändert."
   :"Für dieses Konto gibt es bereits eine Cloud-Sicherung.")+
   "\n\nOK = Cloud-Daten auf dieses Gerät laden (lokale Inhalte werden ersetzt)."+
   "\nAbbrechen = lokale PC-Daten behalten. Es wird nichts automatisch überschrieben."+
   "\n\nDu kannst später über „Cloud → dieses Gerät“ oder „Dieses Gerät → Cloud“ bewusst entscheiden.";
  if(confirm(message)){
   syncPaused=false;
   await downloadCloud(false);
  }else{
   syncPaused=true;
   saveMeta({...readMeta(),conflictRemoteAt:remote.updated_at,accountId:user.id});
   startAutoSync();
   status("Nur lokale Speicherung aktiv: Wegen unterschiedlicher Datenstände ist die Cloud-Synchronisierung pausiert. Wähle unten „Cloud → dieses Gerät“, wenn die Cloud-Version maßgeblich ist, oder „Dieses Gerät → Cloud“, wenn die lokalen Daten maßgeblich sind.",true);
  }
 }catch(e){console.error(e);syncPaused=true;status("Erste Synchronisierung fehlgeschlagen: "+e.message,true);}
 finally{initializing=false;}
}
async function syncNow(show=true,explicit=false){
 if(!client||!user){status("Bitte zuerst anmelden.",true);return;}
 if(explicit){
  try{
   const remote=await fetchRemote();
   if(remote&&!confirm("Die lokalen Daten dieses PCs werden in die Cloud hochgeladen und ersetzen dort die bisherige Sicherung. Fortfahren?"))return;
   syncPaused=false;
   saveMeta({...readMeta(),conflictRemoteAt:null,accountId:user.id});
  }catch(e){status("Cloud konnte vor dem Upload nicht geprüft werden: "+e.message,true);return;}
 }
 if(syncPaused&&!explicit){if(show)status("Synchronisierung pausiert: Bitte zuerst entscheiden, welche Daten-Version verwendet werden soll.",true);return;}
 if(show)status("Lokale Daten werden in die Cloud übertragen …");
 await pushCloud();
 if(!syncPaused)startAutoSync();
}
function scheduleSync(){if(restoring||!client||!user)return;dirty=true;clearTimeout(debounce);debounce=setTimeout(()=>{if(syncPaused){status("Lokale Änderung gespeichert. Cloud-Übertragung pausiert, bis du eine Daten-Version ausgewählt hast.",true);return;}syncNow(false);},1800);}
function startAutoSync(){
 if(window.__studySpaceAutoSync)return;
 try{
  const storageProto=window.Storage?.prototype;
  if(storageProto&&!storageProto.__studySpaceWrapped){
   const originalSetItem=storageProto.setItem;
   storageProto.setItem=function(key,value){
    const result=originalSetItem.call(this,key,value);
    if(this===localStorage&&appKey(String(key)))scheduleSync();
    return result;
   };
   storageProto.__studySpaceWrapped=true;
  }
 }catch(error){console.warn("StudySpace localStorage autosync hook unavailable",error);}
 try{
  const proto=window.IDBObjectStore?.prototype;
  if(proto){
   ["put","add","delete","clear"].forEach(name=>{
    const originalMethod=proto[name];
    if(typeof originalMethod!=="function"||originalMethod.__studySpaceWrapped)return;
    const wrapped=function(...args){
     const result=originalMethod.apply(this,args);
     if(this.name===STORE)scheduleSync();
     return result;
    };
    wrapped.__studySpaceWrapped=true;
    proto[name]=wrapped;
   });
  }
 }catch(error){console.warn("StudySpace IndexedDB autosync hook unavailable",error);}
 window.__studySpaceAutoSync=true;
 const checkRemote=async()=>{
  if(!user||busy)return;
  try{
   const remote=await fetchRemote();
   if(remote&&remote.updated_at!==readMeta().lastRemoteAt&&!debounce){
    status("Auf einem anderen Gerät liegen neuere Cloud-Daten. Zum Übernehmen bitte bewusst „Cloud → dieses Gerät“ wählen.",true);
   }
  }catch(error){console.warn("StudySpace cloud status check",error);}
 };
 const flushPending=()=>{
  if(dirty&&!syncPaused&&user&&!busy){
   clearTimeout(debounce);debounce=null;
   syncNow(false);
  }
 };
 window.addEventListener("focus",()=>{checkRemote();flushPending();});
 window.addEventListener("online",flushPending);
 document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"){checkRemote();flushPending();}
 });
 setInterval(checkRemote,30000);
}

function init(){addStyles();addPanel();const cfg=readConfig();if(cfg.url&&cfg.key)connect();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();