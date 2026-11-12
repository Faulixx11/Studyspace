import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(function(){
"use strict";
let root,scene,camera,renderer,player,cameraYaw=0,cameraPitch=.34,cameraDistance=8,clock,active=false,frame=0;
const keys={},colliders=[],interactables=[],collectibles=[],npcs=[];
const SAVE_KEY="studySpaceAdventureV1",GAME_KEY="studySpace3DWorldV1";
let saved={x:0,z:7,shells:[],visited:[]},coins=0,nearby=null,dialogueTimer=0;
const mats={};
const mat=(color,roughness=.9)=>new THREE.MeshStandardMaterial({color:color,roughness});
const colors={grass:0x79b879,grass2:0x8ac77e,sand:0xe7cf91,water:0x4eabc0,wood:0x9a6845,cream:0xf5e7c8,roof:0xc97868,leaf:0x4c9364,stone:0x9a9c9a};
function loadSave(){try{saved=Object.assign(saved,JSON.parse(localStorage.getItem(GAME_KEY)||"{}"));let s=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");coins=Number(s.coins)||0}catch(e){}}
function save(){try{localStorage.setItem(GAME_KEY,JSON.stringify(saved));let s=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");s.coins=Number(s.coins)||0;localStorage.setItem(SAVE_KEY,JSON.stringify(s))}catch(e){}}
function box(parent,x,y,z,w,h,d,material,round=0){let g=new THREE.BoxGeometry(w,h,d),m=new THREE.Mesh(g,material),o=new THREE.Group();o.add(m);o.position.set(x,y,z);parent.add(o);return o}
function cylinder(parent,x,y,z,r1,r2,h,material,segments=10){let m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y,z);parent.add(m);return m}
function sphere(parent,x,y,z,r,material){let m=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),material);m.position.set(x,y,z);parent.add(m);return m}
function cone(parent,x,y,z,r,h,material,n=6){let m=new THREE.Mesh(new THREE.ConeGeometry(r,h,n),material);m.position.set(x,y,z);parent.add(m);return m}
function group(parent,x=0,y=0,z=0){let g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
function flat(parent,x,z,w,d,material,y=.04){let m=new THREE.Mesh(new THREE.BoxGeometry(w,.08,d),material);m.position.set(x,y,z);parent.add(m);return m}
function addCollider(x,z,r){colliders.push({x,z,r})}
function tree(x,z,scale=1){let g=group(scene,x,0,z);cylinder(g,0,.85*scale,0,.2*scale,.28*scale,1.7*scale,mat(0x8b5b3c));sphere(g,0,2.15*scale,0,1.05*scale,mat(0x4f9561));sphere(g,-.55*scale,1.9*scale,.12*scale,.7*scale,mat(0x66aa6d));sphere(g,.52*scale,1.95*scale,-.12*scale,.72*scale,mat(0x43885a));addCollider(x,z,.75*scale)}
function flower(x,z,color){let g=group(scene,x,0,z);cylinder(g,0,.22,0,.035,.035,.44,mat(0x468b50),6);for(let i=0;i<5;i++){let a=i*Math.PI*2/5;sphere(g,Math.cos(a)*.14,.48,Math.sin(a)*.14,.13,mat(color))}sphere(g,0,.5,0,.09,mat(0xf5d76e))}
function house(x,z,wallColor,roofColor,name){let g=group(scene,x,0,z);box(g,0,.95,0,3.4,1.9,2.8,mat(wallColor));let roof=new THREE.Mesh(new THREE.ConeGeometry(2.5,1.65,4),mat(roofColor));roof.rotation.y=Math.PI/4;roof.position.set(0,2.7,0);g.add(roof);box(g,0,.62,1.43,.62,1.2,.1,mat(0x70472f));box(g,-.95,1.18,1.45,.58,.58,.08,mat(0x8fd1dc));box(g,.95,1.18,1.45,.58,.58,.08,mat(0x8fd1dc));box(g,0,.1,1.55,1.15,.12,.22,mat(0x9a704f));addCollider(x,z,2.05);interactables.push({x,z,r:3.2,title:name,lines:["Willkommen! Dieses Haus gehört zur Sterneninsel.","Hier wird es mit jedem deiner Lernfortschritte gemütlicher."]})}
function bench(x,z){let g=group(scene,x,0,z);box(g,0,.65,0,1.5,.18,.48,mat(0x9b6744));for(let x0 of [-.55,.55])box(g,x0,.32,0,.13,.65,.42,mat(0x704a34));}
function makeNpc(x,z,shirt,headColor,name,lines){let g=group(scene,x,0,z);cylinder(g,0,.8,0,.38,.43,.85,mat(shirt),10);sphere(g,0,1.48,0,.32,mat(headColor));sphere(g,-.11,1.53,.27,.045,mat(0x292a31));sphere(g,.11,1.53,.27,.045,mat(0x292a31));sphere(g,0,1.35,.3,.06,mat(0xd98279));let hat=cone(g,0,1.85,0,.4,.38,mat(0xd7b46c));npcs.push({g,x,z,baseX:x,baseZ:z,phase:Math.random()*6});interactables.push({x,z,r:2.7,title:name,lines:lines,kind:"npc"})}
function shell(x,z,id){let g=group(scene,x,0,z);sphere(g,0,.13,0,.25,mat(0xf4d6b0));g.scale.set(1,.45,.7);collectibles.push({g,x,z,id});}
function sign(x,z,text){let g=group(scene,x,0,z);cylinder(g,0,.7,0,.09,.09,1.4,mat(0x76503b));box(g,0,1.25,0,1.2,.7,.13,mat(0xd2b27a));interactables.push({x,z,r:2.6,title:text,lines:["Auf der Sterneninsel gibt es viel zu entdecken.","Erkunde die Wege, sprich mit den Bewohnern und sammle Muscheln."]})}
function buildWorld(){
 scene.background=new THREE.Color(0x9dd8e5);scene.fog=new THREE.Fog(0x9dd8e5,34,75);
 let hemi=new THREE.HemisphereLight(0xffffff,0x66845b,2.0);scene.add(hemi);let sun=new THREE.DirectionalLight(0xfff0d6,2.4);sun.position.set(-12,22,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
 let ocean=new THREE.Mesh(new THREE.CircleGeometry(65,64),mat(colors.water));ocean.rotation.x=-Math.PI/2;ocean.position.y=-.52;scene.add(ocean);
 let island=new THREE.Mesh(new THREE.CircleGeometry(24,64),mat(colors.sand));island.rotation.x=-Math.PI/2;island.position.y=-.1;scene.add(island);
 let land=new THREE.Mesh(new THREE.CircleGeometry(21.5,64),mat(colors.grass));land.rotation.x=-Math.PI/2;land.position.y=-.015;scene.add(land);
 for(let i=0;i<42;i++){let a=i*2.399,r=14+(i%5)*1.25;tree(Math.cos(a)*r,Math.sin(a)*r,.75+(i%3)*.15)}
 // paths
 let pathMat=mat(0xd9c18b);flat(scene,0,5,3.4,22,pathMat,.06).rotation.y=0;flat(scene,0,-5,3.2,14,pathMat,.06);
 flat(scene,5,0,14,2.6,pathMat,.065);flat(scene,-6,1,10,2.3,pathMat,.065);
 // plaza
 let plaza=new THREE.Mesh(new THREE.CircleGeometry(5,32),mat(0xd6c18f));plaza.rotation.x=-Math.PI/2;plaza.position.set(0,.09,1);scene.add(plaza);
 house(-5,3,0xf0d8aa,0xc97d67,"Miras Häuschen");
 house(7,2,0xd5e6c7,0x8e9bc9,"Noahs Werkstatt");
 house(-7,-8,0xf1d0b7,0x6e9f91,"Dein kleines Inselhaus");
 // lighthouse
 let light=group(scene,13,0,-11);cylinder(light,0,2.1,0,1,1.25,4.2,mat(0xf4e8cf),16);cylinder(light,0,4.35,0,1.12,1.12,.28,mat(0x9a6e55),16);cylinder(light,0,4.8,0,.65,.65,.7,mat(0xe6b95e),12);cone(light,0,5.35,0,.8,.8,mat(0xc76e61),8);addCollider(13,-11,1.5);interactables.push({x:13,z:-11,r:4,title:"Alter Leuchtturm",lines:["Der Leuchtturm wacht über die Sternenbucht.","Vielleicht bringt dich eines Tages ein neuer Lernfortschritt seinem Geheimnis näher."]});
 // garden
 for(let i=0;i<55;i++){let x=-12+(i%11)*.75,z=-1+Math.floor(i/11)*.7;flower(x,z,[0xf4a8c7,0xffdf83,0xc6b0ff,0xffffff][i%4])}
 // beach shells and palm-like trees
 for(let i=0;i<8;i++){let a=i*.8;let x=Math.cos(a)*18,z=Math.sin(a)*18;shell(x,z,"shell"+i)}
 for(let i=0;i<12;i++){let x=-16+(i%4)*1.2,z=8+Math.floor(i/4)*1.2;tree(x,z,.65)}
 bench(2,7);bench(-2,-5);sign(0,9,"Insel-Infotafel");
 makeNpc(-2,1,0x719cdb,0xf0c5a2,"Mira",["Hallo! Wie schön, dass du da bist.","Die Insel wächst mit deinen Ideen. Schau dich um – ich erzähle dir gern mehr."]);
 makeNpc(9,0,0xd68d72,0xc68c66,"Noah",["Ich tüftle an neuen Dingen für die Insel.","Mit Sternensplittern kann man in der Werkstatt tolle Sachen herstellen."]);
 makeNpc(-10,-5,0x8ebd7d,0xf1c6a0,"Lio",["Willkommen im Garten!","Pflanzen brauchen Zeit. Genauso wie gute Ideen."]);
}
function makePlayer(){let g=group(scene,saved.x||0,0,saved.z||7);let body=group(g);cylinder(body,0,.9,0,.34,.42,.85,mat(0x6e8fd5),10);sphere(body,0,1.58,0,.34,mat(0xf0c6a0));sphere(body,-.12,1.65,.29,.045,mat(0x25242a));sphere(body,.12,1.65,.29,.045,mat(0x25242a));sphere(body,0,1.43,.31,.06,mat(0xb96e66));sphere(body,0,1.86,-.04,.35,mat(0x684c3e));let legs=group(body,0,.45,0);for(let x of [-.16,.16]){cylinder(legs,x,-.2,0,.11,.13,.48,mat(0x4d526a),8);sphere(legs,x,-.44,.08,.14,mat(0x574b49))}g.userData.body=body;return g}
function makeUI(){root=document.createElement("div");root.id="ss3d-game";root.innerHTML='<div class="ss3d-top"><div class="ss3d-brand"><span>✦</span><div><b>STERNENINSEL</b><small>Ein Ort zum Entdecken</small></div></div><div class="ss3d-stats"><span id="ss3d-coins">🪙 0</span><span id="ss3d-shells">🐚 0 / 8</span></div><div class="ss3d-controls"><button id="ss3d-full">⛶ Vollbild</button><button id="ss3d-exit">✕ Verlassen</button></div></div><div class="ss3d-bottom"><div class="ss3d-quest"><small>DEIN KLEINES ABENTEUER</small><b>Erkunde die Sterneninsel</b><span>Sprich mit Mira, Noah und Lio und sammle Muscheln am Strand.</span></div><div class="ss3d-hint" id="ss3d-hint">WASD / Pfeile · Maus ziehen = Kamera · E = Interagieren</div></div><div class="ss3d-dialogue" id="ss3d-dialogue"><div><small id="ss3d-speaker">STERNENINSEL</small><p id="ss3d-line"></p><button id="ss3d-close-dialogue">Weiter</button></div></div><div class="ss3d-mobile"><button data-move="forward">▲</button><div><button data-move="left">◀</button><button data-move="back">▼</button><button data-move="right">▶</button></div><button data-action="interact">E</button></div>';
document.body.appendChild(root);root.addEventListener("click",uiClick);document.getElementById("ss3d-full").onclick=()=>{if(!document.fullscreenElement)root.requestFullscreen?.();else document.exitFullscreen?.()};document.getElementById("ss3d-exit").onclick=closeGame;document.getElementById("ss3d-close-dialogue").onclick=hideDialogue;root.querySelectorAll("[data-move]").forEach(b=>{b.addEventListener("pointerdown",e=>{e.preventDefault();keys[b.dataset.move]=true});["pointerup","pointerleave","pointercancel"].forEach(n=>b.addEventListener(n,()=>keys[b.dataset.move]=false))})}
function uiClick(e){let a=e.target.closest("[data-action]");if(a)interact()}
function openGame(){if(active)return;active=true;loadSave();makeUI();scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,150);renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;root.insertBefore(renderer.domElement,root.firstChild);clock=new THREE.Clock();buildWorld();player=makePlayer();camera.position.set(0,8,15);camera.lookAt(0,1,0);bindGameKeys();window.addEventListener("resize",resize);root.addEventListener("pointerdown",pointerDown);root.addEventListener("pointermove",pointerMove);root.addEventListener("pointerup",pointerUp);updateHud();animate();document.body.classList.add("ss3d-open")}
function closeGame(){if(!active)return;active=false;cancelAnimationFrame(frame);window.removeEventListener("resize",resize);window.removeEventListener("keydown",keyDown);root?.removeEventListener("pointerdown",pointerDown);root?.removeEventListener("pointermove",pointerMove);root?.removeEventListener("pointerup",pointerUp);if(document.fullscreenElement)document.exitFullscreen?.();root?.remove();root=null;renderer?.dispose();renderer=null;document.body.classList.remove("ss3d-open");save()}
function bindGameKeys(){window.addEventListener("keydown",keyDown);window.addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false});}
function keyDown(e){let k=e.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"," "].includes(k))e.preventDefault();keys[k]=true;if(k==="e")interact();if(k==="escape"&&active)closeGame()}
let dragging=false,lastX=0,lastY=0;
function pointerDown(e){if(e.target.closest("button,.ss3d-dialogue"))return;dragging=true;lastX=e.clientX;lastY=e.clientY}
function pointerMove(e){if(!dragging)return;cameraYaw-=(e.clientX-lastX)*.006;cameraPitch=Math.max(.15,Math.min(.72,cameraPitch+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY}
function pointerUp(){dragging=false}
function resize(){if(!renderer||!camera)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
function nearest(){let best=null,dist=3.4;for(let x of interactables){let d=Math.hypot(player.position.x-x.x,player.position.z-x.z);if(d<Math.min(dist,x.r)){dist=d;best=x}}for(let x of collectibles){if(saved.shells.includes(x.id))continue;let d=Math.hypot(player.position.x-x.x,player.position.z-x.z);if(d<1.45){dist=d;best={...x,kind:"shell",r:1.45}}}return best}
function interact(){if(!active)return;if(dialogueTimer){hideDialogue();return}let o=nearest();if(!o){showDialogue("STERNENINSEL","Hier gibt es gerade nichts in Reichweite. Geh ein Stück näher an eine Person oder einen Gegenstand.");return}if(o.kind==="shell"){saved.shells.push(o.id);scene.remove(o.g);let st=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");st.coins=(Number(st.coins)||0)+5;localStorage.setItem(SAVE_KEY,JSON.stringify(st));coins=st.coins;updateHud();save();showDialogue("Muschel gefunden","Eine kleine Erinnerung vom Strand! Du hast 5 Inselmünzen gefunden.");return}showDialogue(o.title,o.lines[Math.floor(Math.random()*o.lines.length)])}
function showDialogue(name,line){document.getElementById("ss3d-speaker").textContent=name;document.getElementById("ss3d-line").textContent=line;document.getElementById("ss3d-dialogue").classList.add("visible");dialogueTimer=1}
function hideDialogue(){document.getElementById("ss3d-dialogue").classList.remove("visible");dialogueTimer=0}
function updateHud(){let c=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");coins=Number(c.coins)||0;document.getElementById("ss3d-coins").textContent="🪙 "+coins;document.getElementById("ss3d-shells").textContent="🐚 "+saved.shells.length+" / 8"}
function movePlayer(dt){let f=keys.w||keys.arrowup||keys.forward,b=keys.s||keys.arrowdown||keys.back,l=keys.a||keys.arrowleft||keys.left,r=keys.d||keys.arrowright||keys.right;let x=(r?1:0)-(l?1:0),z=(b?1:0)-(f?1:0);let moving=x||z;if(moving){let len=Math.hypot(x,z);x/=len;z/=len;let angle=cameraYaw;let wx=x*Math.cos(angle)+z*Math.sin(angle),wz=-x*Math.sin(angle)+z*Math.cos(angle);let speed=5.4;let nx=player.position.x+wx*speed*dt,nz=player.position.z+wz*speed*dt;if(Math.hypot(nx,nz)<21.5&&!colliders.some(c=>Math.hypot(nx-c.x,nz-c.z)<c.r)){player.position.x=nx;player.position.z=nz}player.rotation.y=Math.atan2(wx,wz);player.userData.body.position.y=Math.abs(Math.sin(clock.elapsedTime*11))*.08;player.userData.body.rotation.z=Math.sin(clock.elapsedTime*11)*.035}else{player.userData.body.position.y=0;player.userData.body.rotation.z=0}}
function updateCamera(dt){let p=player.position;let target=new THREE.Vector3(p.x+Math.sin(cameraYaw)*cameraDistance*Math.cos(cameraPitch),p.y+cameraDistance*Math.sin(cameraPitch)+2.3,p.z+Math.cos(cameraYaw)*cameraDistance*Math.cos(cameraPitch));camera.position.lerp(target,1-Math.pow(.001,dt));camera.lookAt(p.x,p.y+1.15,p.z)}
function animate(){if(!active)return;frame=requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.04);movePlayer(dt);updateCamera(dt);let o=nearest();nearby=o;if(!dialogueTimer){let hint=document.getElementById("ss3d-hint");hint.textContent=o?(o.kind==="shell"?"E drücken · Muschel aufheben":"E drücken · "+o.title):"WASD / Pfeile · Maus ziehen = Kamera · E = Interagieren"}npcs.forEach(n=>{n.g.position.x=n.baseX+Math.sin(clock.elapsedTime*.35+n.phase)*.35;n.g.position.z=n.baseZ+Math.cos(clock.elapsedTime*.35+n.phase)*.25});renderer.render(scene,camera)}
function boot(){let page=document.getElementById("page-adventure");if(!page)return;let hero=page.querySelector(".adv-hero>div:first-child");if(hero&&!document.getElementById("ss3d-launch")){let b=document.createElement("button");b.id="ss3d-launch";b.className="adv-btn light ss3d-launch";b.textContent="▶ Insel als 3D-Spiel betreten";b.addEventListener("click",openGame);hero.appendChild(b)}}
window.addEventListener("DOMContentLoaded",boot);
window.addEventListener("studyspace:open-island-game",openGame);
})();
