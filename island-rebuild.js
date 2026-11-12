import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
(()=>{
"use strict";
const root=document.getElementById("game"),loading=document.getElementById("loading"),fpsEl=document.getElementById("fps"),errorEl=document.getElementById("error");
try{
const small=(navigator.deviceMemory||4)<=4||(navigator.hardwareConcurrency||4)<=4;
const quality={pixelRatio:Math.min(devicePixelRatio||1,small?1.15:1.5),shadows:small?1024:1536,grass:small?2600:4800,trees:small?95:145};
const clouds=[];
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9c9d0);scene.fog=new THREE.FogExp2(0xa9c9d0,.0036);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,360);
const renderer=new THREE.WebGLRenderer({antialias:!small,powerPreference:"high-performance",alpha:false});
renderer.setPixelRatio(quality.pixelRatio);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;root.prepend(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xd9efff,0x697b52,1.65);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe5bc,3.1);sun.position.set(-48,68,-32);sun.castShadow=true;sun.shadow.mapSize.set(quality.shadows,quality.shadows);sun.shadow.camera.left=-58;sun.shadow.camera.right=58;sun.shadow.camera.top=58;sun.shadow.camera.bottom=-58;sun.shadow.camera.near=1;sun.shadow.camera.far=160;sun.shadow.bias=-.00016;sun.shadow.normalBias=.025;sun.target.position.set(0,0,0);scene.add(sun,sun.target);
const mat=(color,rough=.85,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const m={grass:mat(0x668d58),grass2:mat(0x779e63),sand:mat(0xd9c394),soil:mat(0x77634c),bark:mat(0x59402e),leaf1:mat(0x315d43),leaf2:mat(0x467a50),leaf3:mat(0x6b9660),stone:mat(0x777d76),wood:mat(0x866047),cream:mat(0xe8d9b7),roof:mat(0x76544b),dark:mat(0x3d4842),glass:new THREE.MeshPhysicalMaterial({color:0x9ccbd0,roughness:.13,metalness:.08,clearcoat:1}),gold:mat(0xe0b96e,.38,.35)};
const sphere=(r,w=24,h=16)=>new THREE.SphereGeometry(r,w,h);
const boxGeo=new THREE.BoxGeometry(1,1,1);
function mesh(geo,material,parent=scene,pos=[0,0,0],scale=[1,1,1],cast=true,receive=true){const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.scale.set(...scale);o.castShadow=cast;o.receiveShadow=receive;parent.add(o);return o}
function terrainY(x,z){return .15*Math.sin(x*.12)*Math.cos(z*.13)+.1*Math.sin((x+z)*.22)+.65*Math.exp(-((x+19)**2+(z+17)**2)/240)+.42*Math.exp(-((x-22)**2+(z-20)**2)/190)}
// Sculpted island with a sandy shelf and a submerged rocky edge.
const rings=90,segments=220,verts=[],cols=[],indices=[];const c=new THREE.Color();
for(let i=0;i<=rings;i++){const t=i/rings,r=t*47;for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r,edge=Math.max(0,(r-38)/9),y=terrainY(x,z)-edge*2.5;verts.push(x,y,z);let k=.92+.045*Math.sin(x*.24+z*.17);c.setRGB(.29*k,.47*k,.25*k);if(r>38)c.lerp(new THREE.Color(0xb59a6b),Math.min(1,(r-38)/5)*.9);cols.push(c.r,c.g,c.b);if(i<rings&&j<segments){let n=i*(segments+1)+j;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1)}}}
const tg=new THREE.BufferGeometry();tg.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));tg.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));tg.setIndex(indices);tg.computeVertexNormals();mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98}),scene,[0,0,0],[1,1,1],false,true);
// Rocky shoreline ring as merged instanced meshes.
const rockGeo=new THREE.DodecahedronGeometry(1,1),rockMat=mat(0x65736d,.96);const rocks=new THREE.InstancedMesh(rockGeo,rockMat,230);const dummy=new THREE.Object3D();let rc=0;
for(let i=0;i<230;i++){const a=i/230*Math.PI*2,r=43+Math.random()*2.2,x=Math.cos(a)*r,z=Math.sin(a)*r;dummy.position.set(x,-.9+Math.random()*.8,z);dummy.rotation.set(Math.random()*.5,Math.random()*6,Math.random()*.5);dummy.scale.set(.8+Math.random()*1.7,.6+Math.random()*1.5,.8+Math.random()*1.5);dummy.updateMatrix();rocks.setMatrixAt(rc++,dummy.matrix)}rocks.count=rc;rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
// Deep ocean: shader animation on GPU, no CPU vertex updates.
const waterGeo=new THREE.PlaneGeometry(600,600,1,1);waterGeo.rotateX(-Math.PI/2);
const waterMat=new THREE.ShaderMaterial({transparent:false,uniforms:{uTime:{value:0}},vertexShader:"varying vec3 vPos; uniform float uTime; void main(){vec3 p=position; p.y += sin(p.x*.035+uTime*.7)*.16+cos(p.z*.043-uTime*.55)*.12; vPos=p; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}",fragmentShader:"varying vec3 vPos; void main(){float wave=.5+.5*sin(vPos.x*.035+vPos.z*.027);vec3 deep=vec3(.035,.22,.29);vec3 shallow=vec3(.12,.43,.48);vec3 col=mix(deep,shallow,wave*.45);gl_FragColor=vec4(col,1.0);}",side:THREE.DoubleSide});
const water=mesh(waterGeo,waterMat,scene,[0,-1.9,0],[1,1,1],false,false);
// Beach coves and a pale path network.
const sandMat=mat(0xe4cda0,.98);const beach=mesh(new THREE.RingGeometry(39,43,180),sandMat,scene,[0,-.25,0],[1,1,1],false,true);beach.rotation.x=-Math.PI/2;
function path(x,z,len,width,angle=0){const p=mesh(new THREE.BoxGeometry(width,.035,len),mat(0xc6ad7c,.99),scene,[x,terrainY(x,z)+.035,z],[1,1,1],false,true);p.rotation.y=angle;return p}
path(0,12,31,3.4,0);path(-3,-2,24,2.7,.48);path(8,-13,23,2.5,-.55);path(-15,7,16,2.3,.2);
// Efficient repeated vegetation: one instanced trunk and three canopy layers.
const trunkGeo=new THREE.CylinderGeometry(.16,.25,2.8,9),canopyGeo=new THREE.IcosahedronGeometry(1,2);
const trunks=new THREE.InstancedMesh(trunkGeo,m.bark,quality.trees),canopyA=new THREE.InstancedMesh(canopyGeo,m.leaf1,quality.trees),canopyB=new THREE.InstancedMesh(canopyGeo,m.leaf2,quality.trees),canopyC=new THREE.InstancedMesh(canopyGeo,m.leaf3,quality.trees);
let treeCount=0;const treeSpots=[];
for(let i=0;i<quality.trees*3&&treeCount<quality.trees;i++){const a=Math.random()*Math.PI*2,r=15+Math.random()*28,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<9&&z>-15&&z<18)continue;if(Math.hypot(x+17,z+15)<7||Math.hypot(x-20,z-17)<7)continue;const y=terrainY(x,z);treeSpots.push([x,y,z]);dummy.position.set(x,y+1.35,z);dummy.rotation.set(0,Math.random()*6,0);const s=.8+Math.random()*.65;dummy.scale.set(s,s,s);dummy.updateMatrix();trunks.setMatrixAt(treeCount,dummy.matrix);dummy.position.set(x,y+3.0*s,z);dummy.scale.set(2.15*s,2.15*s,2.15*s);dummy.rotation.set(Math.random()*.2,Math.random()*6,Math.random()*.2);dummy.updateMatrix();canopyA.setMatrixAt(treeCount,dummy.matrix);dummy.position.set(x-.7*s,y+3.45*s,z+.35*s);dummy.scale.set(1.45*s,1.55*s,1.5*s);dummy.updateMatrix();canopyB.setMatrixAt(treeCount,dummy.matrix);dummy.position.set(x+.65*s,y+3.5*s,z-.3*s);dummy.scale.set(1.5*s,1.55*s,1.45*s);dummy.updateMatrix();canopyC.setMatrixAt(treeCount,dummy.matrix);treeCount++}
[trunks,canopyA,canopyB,canopyC].forEach(o=>{o.count=treeCount;o.instanceMatrix.needsUpdate=true;o.castShadow=true;o.receiveShadow=true;scene.add(o)});
// Instanced grass tufts; only a few thousand triangles for the entire meadow.
const bladeGeo=new THREE.BufferGeometry();bladeGeo.setAttribute("position",new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,0,.42,0,0,0,-.045,0,0,.045,0,.42,0],3));bladeGeo.setIndex([0,1,2,3,4,5]);bladeGeo.computeVertexNormals();const grass=new THREE.InstancedMesh(bladeGeo,new THREE.MeshStandardMaterial({color:0x9ebc72,side:THREE.DoubleSide,roughness:1}),quality.grass);let gc=0;
for(let i=0;i<quality.grass*2&&gc<quality.grass;i++){const x=(Math.random()-.5)*78,z=(Math.random()-.5)*78,r=Math.hypot(x,z);if(r<12||r>39)continue;if(Math.abs(x)<5&&z>-18&&z<20)continue;dummy.position.set(x,terrainY(x,z)+.02,z);dummy.rotation.set(0,Math.random()*6.28,0);const s=.55+Math.random()*1.1;dummy.scale.set(s,s,s);dummy.updateMatrix();grass.setMatrixAt(gc++,dummy.matrix)}grass.count=gc;grass.instanceMatrix.needsUpdate=true;grass.frustumCulled=true;scene.add(grass);
// Flower patches, stones and fallen logs, batched where possible.
const flowerGeo=new THREE.SphereGeometry(.12,8,6),flowerMat=[mat(0xe8c7bd),mat(0xf0d88d),mat(0xd8a6bd)];for(let k=0;k<3;k++){const flowers=new THREE.InstancedMesh(flowerGeo,flowerMat[k],120);let n=0;for(let i=0;i<120;i++){const x=(Math.random()-.5)*58,z=(Math.random()-.5)*58;if(Math.hypot(x,z)<13)continue;dummy.position.set(x,terrainY(x,z)+.45,z);dummy.scale.set(1.2,.55,1.2);dummy.updateMatrix();flowers.setMatrixAt(n++,dummy.matrix)}flowers.count=n;flowers.instanceMatrix.needsUpdate=true;scene.add(flowers)}
// Premium timber cottage: layered roof, recessed windows, porch and warm interior glow.
function cottage(x,z,scale=1){const g=new THREE.Group();g.position.set(x,terrainY(x,z),z);g.scale.setScalar(scale);scene.add(g);
mesh(new THREE.BoxGeometry(6.6,3.3,5.1),m.cream,g,[0,1.65,0],[1,1,1]);mesh(new THREE.BoxGeometry(6.9,.35,5.4),m.wood,g,[0,.2,0]);
for(const side of [-1,1]){const roof=mesh(new THREE.BoxGeometry(3.9,.28,5.9),m.roof,g,[side*1.38,3.55,0]);roof.rotation.z=side<0?.57:-.57;mesh(new THREE.BoxGeometry(.18,.22,5.95),m.wood,g,[side*2.65,2.7,0]).rotation.z=side<0?.57:-.57}
mesh(new THREE.BoxGeometry(.18,.18,6),m.wood,g,[0,4.62,0]);
for(const xw of [-2.1,2.1]){mesh(new THREE.BoxGeometry(1.25,1.1,.14),m.wood,g,[xw,2.05,2.57]);mesh(new THREE.BoxGeometry(1.02,.87,.08),m.glass,g,[xw,2.05,2.67]);mesh(new THREE.BoxGeometry(.08,1.05,.08),m.cream,g,[xw,2.05,2.72]);mesh(new THREE.BoxGeometry(1.05,.08,.08),m.cream,g,[xw,2.05,2.72]);for(const side of [-1,1])mesh(new THREE.BoxGeometry(.28,1.22,.16),m.roof,g,[xw+side*.78,2.05,2.62])}
mesh(new THREE.BoxGeometry(1.1,2.15,.2),m.wood,g,[0,1.25,2.61]);mesh(new THREE.BoxGeometry(.75,1.8,.07),mat(0x654a35),g,[0,1.25,2.74]);mesh(new THREE.SphereGeometry(.07,12,8),m.gold,g,[.34,1.25,2.81]);
for(let side of [-1,1]){mesh(new THREE.CylinderGeometry(.08,.1,2.8,8),m.wood,g,[side*2.4,1.45,3]);}
mesh(new THREE.BoxGeometry(7.3,.2,1.5),m.wood,g,[0,2.9,3.05]);mesh(new THREE.BoxGeometry(7.6,.18,1.8),m.cream,g,[0,2.79,3.1]);mesh(new THREE.BoxGeometry(.9,1.8,.9),m.roof,g,[2.1,4.05,-1.1]);mesh(new THREE.BoxGeometry(1.1,.16,1.1),m.cream,g,[2.1,4.96,-1.1]);
for(let i=0;i<7;i++){const beam=mesh(new THREE.BoxGeometry(.1,.1,5.15),m.wood,g,[-3+i,1.9,2.61]);}
const warm=new THREE.PointLight(0xffc77d,1.2,10);warm.position.set(0,2.1,2.9);g.add(warm);
}
cottage(-15,-12,1.05);cottage(17,16,.82);
// Lighthouse landmark on a headland.
const lightHouse=new THREE.Group();lightHouse.position.set(29,terrainY(29,-25),-25);scene.add(lightHouse);mesh(new THREE.CylinderGeometry(.85,1.35,8,16),m.cream,lightHouse,[0,4,0]);mesh(new THREE.CylinderGeometry(1.05,1.05,.45,16),m.roof,lightHouse,[0,8.1,0]);mesh(new THREE.CylinderGeometry(.68,.68,1.15,16),m.glass,lightHouse,[0,8.85,0]);mesh(new THREE.ConeGeometry(.95,.8,12),m.roof,lightHouse,[0,9.85,0]);const beacon=new THREE.PointLight(0xffe3a4,2,28);beacon.position.set(0,8.8,0);lightHouse.add(beacon);
// Rock groups near the coves.
const rockBatch=new THREE.InstancedMesh(rockGeo,rockMat,110);let rb=0;for(let i=0;i<110;i++){const a=Math.random()*Math.PI*2,r=37+Math.random()*7,x=Math.cos(a)*r,z=Math.sin(a)*r;dummy.position.set(x,terrainY(x,z)+.15,z);dummy.rotation.set(Math.random(),Math.random()*6,Math.random());const s=.3+Math.random()*1.1;dummy.scale.set(s*1.3,s*.8,s);dummy.updateMatrix();rockBatch.setMatrixAt(rb++,dummy.matrix)}rockBatch.count=rb;rockBatch.instanceMatrix.needsUpdate=true;rockBatch.castShadow=true;scene.add(rockBatch);
// Player silhouette with layered clothing and a soft contact shadow.
const player=new THREE.Group();scene.add(player);const body=new THREE.Group();player.add(body);mesh(new THREE.CapsuleGeometry(.36,.72,5,10),mat(0x3d6570),body,[0,1.05,0]);mesh(new THREE.SphereGeometry(.31,18,14),mat(0xd9aa83),body,[0,1.78,.02]);mesh(new THREE.SphereGeometry(.34,18,14),mat(0x493a31),body,[0,1.98,-.04],[1,.55,1]);for(const s of [-1,1]){mesh(new THREE.SphereGeometry(.055,8,8),m.dark,body,[s*.12,1.8,.29]);mesh(new THREE.CapsuleGeometry(.12,.38,3,7),mat(0x5d5148),body,[s*.17,.35,0])}player.position.set(0,terrainY(0,14),14);
// Soft cloud clusters.
const cloudMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,depthWrite:false});for(let i=0;i<12;i++){const cloud=new THREE.Group();cloud.position.set((Math.random()-.5)*170,34+Math.random()*20,(Math.random()-.5)*170);for(let j=0;j<5;j++)mesh(new THREE.SphereGeometry(2.5+Math.random()*2.5,12,8),cloudMat,cloud,[j*2.8,Math.random()*1.5,Math.random()*1.8],[1,.55,1],false,false);scene.add(cloud);cloud.userData.speed=.15+Math.random()*.25;clouds.push(cloud)}
let yaw=0,pitch=.28,distance=13,drag=false,lastX=0,lastY=0,keys={},clock=new THREE.Clock(),mix=0;
function updateCamera(){const target=new THREE.Vector3(player.position.x,player.position.y+1.5,player.position.z);camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(target)}
updateCamera();
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase()))e.preventDefault()});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
renderer.domElement.addEventListener("pointerdown",e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener("pointerup",()=>drag=false);
renderer.domElement.addEventListener("pointermove",e=>{if(!drag)return;yaw-=(e.clientX-lastX)*.004;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-lastY)*.003,-.08,.8);lastX=e.clientX;lastY=e.clientY});
renderer.domElement.addEventListener("wheel",e=>{distance=THREE.MathUtils.clamp(distance+e.deltaY*.012,7,25)},{passive:true});
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,quality.pixelRatio));renderer.setSize(innerWidth,innerHeight)});
let frames=0,lastFps=performance.now(),fps=60;
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;waterMat.uniforms.uTime.value=t;
let forward=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);const len=Math.hypot(forward,side)||1;forward/=len;side/=len;
if(forward||side){const speed=keys.shift?9:5.2,dx=(Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,dz=(Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt,nx=player.position.x+dx,nz=player.position.z+dz;if(Math.hypot(nx,nz)<38){player.position.x=nx;player.position.z=nz}body.position.y=Math.sin(t*11)*.045;body.rotation.y=Math.atan2(side,forward); }else{body.position.y=Math.sin(t*1.7)*.012}
player.position.y=terrainY(player.position.x,player.position.z);updateCamera();clouds.forEach(c=>{c.position.x+=c.userData.speed*dt;if(c.position.x>100)c.position.x=-100});
renderer.render(scene,camera);frames++;const now=performance.now();if(now-lastFps>800){fps=Math.round(frames*1000/(now-lastFps));fpsEl.textContent=fps+" FPS";frames=0;lastFps=now}}
loading.style.display="none";animate();
}catch(err){console.error(err);errorEl.hidden=false;errorEl.textContent="Die 3D-Vorschau konnte nicht gestartet werden: "+(err?.message||err);loading.style.display="none"}
})();