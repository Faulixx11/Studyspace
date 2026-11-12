import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { RGBELoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/RGBELoader.js";
(()=>{
"use strict";
const root=document.getElementById("game"),loading=document.getElementById("loading"),fpsEl=document.getElementById("fps"),errorEl=document.getElementById("error");
try{
const small=(navigator.deviceMemory||4)<=4||(navigator.hardwareConcurrency||4)<=4;
const quality={pixelRatio:Math.min(devicePixelRatio||1,small?1.15:1.5),shadows:small?1024:1536,grass:small?2600:4800,trees:small?95:145};
const clouds=[];
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa9c9d0);scene.fog=new THREE.FogExp2(0xa9c9d0,.0036);
const sky=new THREE.Mesh(new THREE.SphereGeometry(280,32,18),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:"varying vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}",fragmentShader:"varying vec3 vWorld; void main(){float h=normalize(vWorld).y;vec3 low=vec3(.78,.84,.82);vec3 mid=vec3(.42,.67,.75);vec3 high=vec3(.13,.34,.49);vec3 col=mix(low,mid,smoothstep(-.18,.28,h));col=mix(col,high,smoothstep(.28,.9,h));gl_FragColor=vec4(col,1.0);}"}));scene.add(sky);

const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,360);
const renderer=new THREE.WebGLRenderer({antialias:!small,powerPreference:"high-performance",alpha:false});
renderer.setPixelRatio(quality.pixelRatio);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;root.prepend(renderer.domElement);
// Image-based lighting: a real HDR environment supplies reflections and soft ambient light to every PBR material.
// Poly Haven: Kloppenheim 06 Pure Sky, CC0. Kept at 1K to limit download and GPU memory.
const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
new RGBELoader().setDataType(THREE.HalfFloatType).load("https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloppenheim_06_puresky_1k.hdr",hdr=>{try{const env=pmrem.fromEquirectangular(hdr).texture;scene.environment=env;if("environmentIntensity" in scene)scene.environmentIntensity=.78;hdr.dispose();pmrem.dispose();}catch(e){console.warn("HDR environment setup failed",e);hdr.dispose();pmrem.dispose();}},undefined,err=>{console.warn("HDR environment could not be loaded; using fallback lighting",err);pmrem.dispose();});
const hemi=new THREE.HemisphereLight(0xd9efff,0x697b52,1.65);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe5bc,3.1);sun.position.set(-48,68,-32);sun.castShadow=true;sun.shadow.mapSize.set(quality.shadows,quality.shadows);sun.shadow.camera.left=-58;sun.shadow.camera.right=58;sun.shadow.camera.top=58;sun.shadow.camera.bottom=-58;sun.shadow.camera.near=1;sun.shadow.camera.far=160;sun.shadow.bias=-.00016;sun.shadow.normalBias=.025;sun.target.position.set(0,0,0);scene.add(sun,sun.target);
const mat=(color,rough=.85,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const m={grass:mat(0x668d58),grass2:mat(0x779e63),sand:mat(0xd9c394),soil:mat(0x77634c),bark:mat(0x59402e),leaf1:mat(0x315d43),leaf2:mat(0x467a50),leaf3:mat(0x6b9660),stone:mat(0x777d76),wood:mat(0x866047),cream:mat(0xe8d9b7),roof:mat(0x76544b),dark:mat(0x3d4842),glass:new THREE.MeshPhysicalMaterial({color:0x9ccbd0,roughness:.13,metalness:.08,clearcoat:1}),gold:mat(0xe0b96e,.38,.35)};
function proceduralTexture(base,accent,scale=1,kind="grain"){
 const size=256,canvas=document.createElement("canvas");canvas.width=canvas.height=size;const ctx=canvas.getContext("2d"),img=ctx.createImageData(size,size);let seed=base>>>0;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const b=new THREE.Color(base),a=new THREE.Color(accent);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;let n=(rand()-.5)*.17,pattern=kind==="grain"?(Math.sin(y*.19+Math.sin(x*.035)*2)*.045):(kind==="stone"?(Math.sin(x*.12)*Math.cos(y*.09)*.08):(Math.sin(x*.07+y*.11)*.035));let k=THREE.MathUtils.clamp(.78+rand()*.24+n+pattern,0,1);img.data[i]=Math.round((b.r*(1-k)+a.r*k)*255);img.data[i+1]=Math.round((b.g*(1-k)+a.g*k)*255);img.data[i+2]=Math.round((b.b*(1-k)+a.b*k)*255);img.data[i+3]=255}
 ctx.putImageData(img,0,0);
 for(let i=0;i<900;i++){ctx.globalAlpha=.035+rand()*.09;ctx.fillStyle=rand()>.5?"#ffffff":"#171b17";const w=kind==="grain"?1+rand()*2:1+rand()*3;ctx.fillRect(rand()*size,rand()*size,w,w)}
 const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(scale,scale);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tex;
}
m.bark.map=proceduralTexture(0x59402e,0x9a7550,2,"grain");m.bark.bumpMap=m.bark.map;m.bark.bumpScale=.12;
m.wood.map=proceduralTexture(0x866047,0xc49a6a,2,"grain");m.wood.bumpMap=m.wood.map;m.wood.bumpScale=.07;
m.roof.map=proceduralTexture(0x76544b,0xb07b68,3,"grain");m.roof.bumpMap=m.roof.map;m.roof.bumpScale=.045;
m.cream.map=proceduralTexture(0xe8d9b7,0xffffff,2,"grain");m.cream.bumpMap=m.cream.map;m.cream.bumpScale=.035;
m.sand.map=proceduralTexture(0xd9c394,0xf4e4bd,4,"stone");m.sand.bumpMap=m.sand.map;m.sand.bumpScale=.025;
m.grass.map=proceduralTexture(0x668d58,0x9db879,7,"stone");m.grass.bumpMap=m.grass.map;m.grass.bumpScale=.025;
[m.bark,m.wood,m.roof,m.cream,m.sand,m.grass].forEach(v=>v.needsUpdate=true);

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
const sandMat=mat(0xe4cda0,.98);const beach=mesh(new THREE.RingGeometry(39,43,180),m.sand,scene,[0,-.25,0],[1,1,1],false,true);beach.rotation.x=-Math.PI/2;
function path(x,z,len,width,angle=0){const p=mesh(new THREE.BoxGeometry(width,.035,len),mat(0xc6ad7c,.99),scene,[x,terrainY(x,z)+.035,z],[1,1,1],false,true);p.rotation.y=angle;return p}
path(0,12,31,3.4,0);path(-3,-2,24,2.7,.48);path(8,-13,23,2.5,-.55);path(-15,7,16,2.3,.2);
// Efficient repeated vegetation: one instanced trunk and three canopy layers.
const trunkGeo=new THREE.CylinderGeometry(.16,.25,2.8,9),canopyGeo=new THREE.IcosahedronGeometry(1,2);
const trunks=new THREE.InstancedMesh(trunkGeo,m.bark,quality.trees),canopyA=new THREE.InstancedMesh(canopyGeo,m.leaf1,quality.trees),canopyB=new THREE.InstancedMesh(canopyGeo,m.leaf2,quality.trees),canopyC=new THREE.InstancedMesh(canopyGeo,m.leaf3,quality.trees);
let treeCount=0;const treeSpots=[];
for(let i=0;i<quality.trees*3&&treeCount<quality.trees;i++){const a=Math.random()*Math.PI*2,r=15+Math.random()*28,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<9&&z>-15&&z<18)continue;if(Math.hypot(x+17,z+15)<7||Math.hypot(x-20,z-17)<7)continue;const y=terrainY(x,z);treeSpots.push([x,y,z]);dummy.position.set(x,y+1.35,z);dummy.rotation.set(0,Math.random()*6,0);const s=.8+Math.random()*.65;dummy.scale.set(s,s,s);dummy.updateMatrix();trunks.setMatrixAt(treeCount,dummy.matrix);dummy.position.set(x,y+3.0*s,z);dummy.scale.set(2.15*s,2.15*s,2.15*s);dummy.rotation.set(Math.random()*.2,Math.random()*6,Math.random()*.2);dummy.updateMatrix();canopyA.setMatrixAt(treeCount,dummy.matrix);dummy.position.set(x-.7*s,y+3.45*s,z+.35*s);dummy.scale.set(1.45*s,1.55*s,1.5*s);dummy.updateMatrix();canopyB.setMatrixAt(treeCount,dummy.matrix);dummy.position.set(x+.65*s,y+3.5*s,z-.3*s);dummy.scale.set(1.5*s,1.55*s,1.45*s);dummy.updateMatrix();canopyC.setMatrixAt(treeCount,dummy.matrix);treeCount++}
[trunks,canopyA,canopyB,canopyC].forEach(o=>{o.count=treeCount;o.instanceMatrix.needsUpdate=true;o.castShadow=true;o.receiveShadow=true;scene.add(o)});
// Instanced grass tufts; only a few thousand triangles for the entire meadow.
const bladeGeo=new THREE.BufferGeometry();bladeGeo.setAttribute("position",new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,0,.42,0,0,0,-.045,0,0,.045,0,.42,0],3));bladeGeo.setIndex([0,1,2,3,4,5]);bladeGeo.computeVertexNormals();const grass=new THREE.InstancedMesh(bladeGeo,new THREE.MeshStandardMaterial({color:0xb0c68a,map:m.grass.map,side:THREE.DoubleSide,roughness:1}),quality.grass);let gc=0;
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

/* EXPANDED WORLD PASS: layered terrain, village architecture and landmarks */
const stoneLight=mat(0x8b8d82,.94),stoneDark=mat(0x535d58,.98),plasterWarm=mat(0xd8c49e,.92),plasterRose=mat(0xb98269,.92),roofBlue=mat(0x3d4c50,.8),roofTerracotta=mat(0x9a5540,.86),timberDark=mat(0x49372b,.9),leafBright=mat(0x83a967,.95),flowerWhite=mat(0xf1e9cf,.75);
function addBox(parent,material,x,y,z,sx,sy,sz,rz=0){const o=mesh(boxGeo,material,parent,[x,y,z],[sx,sy,sz]);o.rotation.z=rz;return o}
function addVillageHouse(x,z,scale=1,wall=plasterWarm,roof=roofTerracotta){
 const g=new THREE.Group();g.position.set(x,terrainY(x,z),z);g.scale.setScalar(scale);scene.add(g);
 addBox(g,wall,0,1.55,0,5.2,3.1,4.4);
 // Two pitched roof planes with visible rafters and fascia.
 for(const side of [-1,1]){const p=addBox(g,roof,side*1.18,3.35,0,3.1,.22,4.95,side*.58);p.rotation.y=0;addBox(g,timberDark,side*2.25,2.72,0,.13,1.25,5,side*.58)}
 addBox(g,timberDark,0,4.16,0,.16,.16,5);
 // Gable front.
 const gable=mesh(new THREE.ConeGeometry(2.75,1.75,4),wall,g,[0,3.35,2.17]);gable.rotation.y=Math.PI/4;gable.scale.set(1,.72,.42);
 // Door and inset windows.
 addBox(g,timberDark,0,1.05,2.24,1.02,2.05,.14);addBox(g,mat(0x694b35),0,1.05,2.33,.76,1.8,.06);
 mesh(new THREE.SphereGeometry(.055,8,6),m.gold,g,[.28,1.05,2.39]);
 for(const wx of [-1.65,1.65]){addBox(g,timberDark,wx,1.95,2.25,1.05,1.15,.14);addBox(g,m.glass,wx,1.95,2.34,.83,.91,.07);addBox(g,timberDark,wx,1.95,2.39,.07,1,.06);addBox(g,timberDark,wx,1.95,2.39,.9,.07,.06)}
 // Chimney, roof ridge caps, porch and supports.
 addBox(g,stoneLight,1.55,4.12,-1.15,.55,1.5,.65);addBox(g,stoneDark,1.55,4.88,-1.15,.72,.16,.8);
 addBox(g,timberDark,0,2.35,2.9,6,.16,1.15);for(const px of [-2.55,2.55])addBox(g,timberDark,px,1.2,3.35,.14,2.4,.14);
 for(let i=0;i<4;i++)addBox(g,stoneLight,0,.12+i*.12,3.7+i*.23,2.7,.16,.6);
 // Flower boxes with compact instanced blooms.
 for(const wx of [-1.65,1.65]){addBox(g,timberDark,wx,1.35,2.55,1.18,.18,.32);for(let j=0;j<5;j++)mesh(flowerGeo,flowerMat[(j+Math.round(x))%3],g,[wx-.42+j*.21,1.52,2.55],[.8,.65,.8],false,false)}
 const glow=new THREE.PointLight(0xffbd70,.45,7);glow.position.set(0,1.7,2.55);g.add(glow);return g;
}
addVillageHouse(-23,4,.82,plasterRose,roofBlue);
addVillageHouse(22,-8,.78,plasterWarm,roofTerracotta);
addVillageHouse(9,25,.72,plasterRose,roofBlue);
addVillageHouse(-27,-19,.68,plasterWarm,roofTerracotta);
// Dramatic distant mountain silhouettes, with snow ridges and layered foothills.
function ridge(points,depth,material){const v=[],idx=[];for(let i=0;i<points.length;i++){const [x,y]=points[i];v.push(x,y,depth,x,y-13,depth+2)}for(let i=0;i<points.length-1;i++){let n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2)}const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();const o=mesh(geo,material,scene,[0,0,0],[1,1,1],false,false);o.material.side=THREE.DoubleSide;return o}
const mountainMat=new THREE.MeshStandardMaterial({color:0x657e83,roughness:1,flatShading:true});
const snowMat=new THREE.MeshStandardMaterial({color:0xe7e9e2,roughness:.94,flatShading:true});
ridge([[-105,9],[-86,25],[-70,13],[-52,37],[-35,17],[-14,32],[7,14],[28,35],[49,16],[69,30],[88,12],[110,26]],-86,mountainMat);
for(const [x,y,w] of [[-52,37,7],[-14,32,6],[28,35,7],[69,30,6]]){const cap=mesh(new THREE.ConeGeometry(w,y*.34,5),snowMat,scene,[x,y-2,-85],[1,1,1],false,false);cap.rotation.y=.35;}
// Near cliffs behind the village create strong vertical silhouettes.
for(let i=0;i<13;i++){const x=-38+i*6.2,z=-35-Math.random()*5,h=8+Math.random()*13;const cliff=mesh(new THREE.DodecahedronGeometry(1,1),i%3?stoneDark:stoneLight,scene,[x,h*.38,z],[3+Math.random()*2,h,3.5+Math.random()*2],false,true);cliff.rotation.y=Math.random()*2}
 // Windmill with a detailed timber tower and four rotating sails.
const windmill=new THREE.Group();windmill.position.set(-3,terrainY(-3,-26),-26);scene.add(windmill);
mesh(new THREE.CylinderGeometry(1.35,2.05,8,12),plasterWarm,windmill,[0,4,0]);
mesh(new THREE.ConeGeometry(2.1,1.7,12),roofTerracotta,windmill,[0,8.8,0]);
const axle=new THREE.Group();axle.position.set(0,6.8,1.65);windmill.add(axle);mesh(new THREE.CylinderGeometry(.18,.18,.8,12),m.wood,axle,[0,0,0],[1,1,1]).rotation.x=Math.PI/2;
for(let i=0;i<4;i++){const sail=new THREE.Group();sail.rotation.z=i*Math.PI/2;axle.add(sail);addBox(sail,m.wood,0,2.1,0,.22,4.4,.12);addBox(sail,m.cream,0,2.35,.1,.92,2.4,.08);addBox(sail,m.wood,0,3.35,.17,.12,2.5,.1)}
// Timber harbor piers, mooring posts and a small sailing boat.
function pier(x,z,length=17){const g=new THREE.Group();g.position.set(x,terrainY(x,z)-.7,z);scene.add(g);addBox(g,m.wood,0,0,0,3.1,.32,length);for(let j=0;j<Math.floor(length/2);j++)for(const side of [-1,1])mesh(new THREE.CylinderGeometry(.13,.17,2.8,8),m.bark,g,[side*1.25,-1.2,-length/2+j*2.2]);for(const end of [-1,1])for(const side of [-1,1])mesh(new THREE.CylinderGeometry(.22,.25,1.1,8),m.wood,g,[side*1.25,.35,end*length/2]);return g}
pier(27,5,18);pier(31,13,12);
const boat=new THREE.Group();boat.position.set(35,-1.25,2);scene.add(boat);mesh(new THREE.BoxGeometry(5,.55,10),m.wood,boat,[0,0,0]);mesh(new THREE.ConeGeometry(2.3,.9,4),m.bark,boat,[0,-.4,0],[1,1,2]);mesh(new THREE.CylinderGeometry(.08,.08,7,8),m.wood,boat,[0,3,0]);mesh(new THREE.PlaneGeometry(3.4,5.4),m.cream,boat,[0,3.1,.2]).rotation.y=.04;
// Fence sections around paths and cottage gardens.
function fence(x,z,count,angle=0){const g=new THREE.Group();g.position.set(x,terrainY(x,z),z);g.rotation.y=angle;scene.add(g);for(let i=0;i<=count;i++){const px=i*1.6;mesh(new THREE.BoxGeometry(.18,1.35,.18),m.bark,g,[px,.68,0]);mesh(new THREE.SphereGeometry(.13,8,6),m.wood,g,[px,1.4,0])}for(const y of [.48,1.05])mesh(new THREE.BoxGeometry(count*1.6+.2,.13,.16),m.wood,g,[count*.8,y,0]);}
fence(-24,10,9,.25);fence(-13,-22,8,-.3);fence(13,22,7,.7);
// Foreground broadleaf trees with visible branch forks, varied leaf clusters.
function heroTree(x,z,s=1){const g=new THREE.Group();g.position.set(x,terrainY(x,z),z);g.scale.setScalar(s);scene.add(g);mesh(new THREE.CylinderGeometry(.42,.72,7,10),m.bark,g,[0,3.5,0]);for(let i=0;i<5;i++){const branch=mesh(new THREE.CylinderGeometry(.12,.23,3.1,7),m.bark,g,[Math.sin(i*1.26)*1.1,5+i*.18,Math.cos(i*1.26)*.8]);branch.rotation.z=Math.sin(i*1.26)*.65;branch.rotation.x=Math.cos(i*1.26)*.55}for(let i=0;i<11;i++){const a=i*2.399,r=1.2+(i%3)*.55;mesh(new THREE.SphereGeometry(1.55,12,9),[m.leaf1,m.leaf2,m.leaf3][i%3],g,[Math.cos(a)*r,6.5+(i%4)*.55,Math.sin(a)*r],[1.1,1,.95],true,true)}}
heroTree(-33,15,1.5);heroTree(34,25,1.25);heroTree(-31,-28,1.1);
// Player equipment adds readable silhouette and depth.
const pack=mesh(new THREE.BoxGeometry(.62,.78,.36),m.bark,body,[0,1.22,-.34]);pack.rotation.x=-.08;
mesh(new THREE.BoxGeometry(.72,.12,.42),m.wood,body,[0,1.56,-.34]);
for(const side of [-1,1]){const strap=mesh(new THREE.CapsuleGeometry(.045,.7,3,6),m.gold,body,[side*.24,1.3,-.12]);strap.rotation.z=side*.2}
mesh(new THREE.CylinderGeometry(.12,.16,.34,8),m.wood,body,[.38,.93,-.32]).rotation.z=Math.PI/2;

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
let frames=0,lastFps=performance.now(),fps=60,renderScale=quality.pixelRatio,lastAdaptive=performance.now();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;waterMat.uniforms.uTime.value=t;
let forward=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0),side=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);const len=Math.hypot(forward,side)||1;forward/=len;side/=len;
if(forward||side){const speed=keys.shift?9:5.2,dx=(Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed*dt,dz=(Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed*dt,nx=player.position.x+dx,nz=player.position.z+dz;if(Math.hypot(nx,nz)<38){player.position.x=nx;player.position.z=nz}body.position.y=Math.sin(t*11)*.045;body.rotation.y=Math.atan2(side,forward); }else{body.position.y=Math.sin(t*1.7)*.012}
player.position.y=terrainY(player.position.x,player.position.z);updateCamera();clouds.forEach(c=>{c.position.x+=c.userData.speed*dt;if(c.position.x>100)c.position.x=-100});
renderer.render(scene,camera);frames++;const now=performance.now();if(now-lastFps>800){fps=Math.round(frames*1000/(now-lastFps));fpsEl.textContent=fps+" FPS";frames=0;lastFps=now}if(now-lastAdaptive>2400){if(fps<38&&renderScale>.72){renderScale=Math.max(.72,renderScale-.12);renderer.setPixelRatio(renderScale);renderer.setSize(innerWidth,innerHeight)}else if(fps>56&&renderScale<quality.pixelRatio){renderScale=Math.min(quality.pixelRatio,renderScale+.06);renderer.setPixelRatio(renderScale);renderer.setSize(innerWidth,innerHeight)}lastAdaptive=now}}
loading.style.display="none";animate();
}catch(err){console.error(err);errorEl.hidden=false;errorEl.textContent="Die 3D-Vorschau konnte nicht gestartet werden: "+(err?.message||err);loading.style.display="none"}
})();