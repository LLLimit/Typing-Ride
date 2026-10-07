import * as T from 'three';
import {Part} from './models';
import type {MapId,Settings} from './data';

const box=new T.BoxGeometry(1,1,1),round=new T.SphereGeometry(1,12,8),rod=new T.CylinderGeometry(1,1,1,10),cone=new T.ConeGeometry(1,1,10);
const lowRock=new T.IcosahedronGeometry(1,1);
function random(seed:number){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function surface(rows:number,columns:number,point:(t:number,s:number)=>number[]){
  const positions:number[]=[],indices:number[]=[],uvs:number[]=[];
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){positions.push(...point(row/rows,col/columns));uvs.push(col/columns,row/rows);}
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function shoreline(z:number){return -9.2+Math.sin(z*Math.PI/64)*.5+Math.sin(z*Math.PI/32)*.18;}
function trailCenter(z:number){return -1+Math.sin(z*Math.PI/64)*.22;}
const frond=surface(10,2,(t,s)=>{const width=Math.sin(t*Math.PI)*.34;return[(s-.5)*width*2,Math.sin(t*Math.PI)*.34-t*t*.55,t*2.8];});
frond.setAttribute('windWeight',new T.Float32BufferAttribute(Array.from({length:33},(_,i)=>(Math.floor(i/3)/10)**1.6),1));
const flag=surface(5,6,(t,s)=>[s*1.3, t*.52+Math.sin(s*Math.PI)*.045,Math.sin(s*5)*.035]);
flag.setAttribute('windWeight',new T.Float32BufferAttribute(Array.from({length:42},(_,i)=>(i%7/6)**1.6),1));
const surfShape=new T.Shape();surfShape.moveTo(0,-1);surfShape.bezierCurveTo(-.45,-.85,-.46,.65,0,1);surfShape.bezierCurveTo(.46,.65,.45,-.85,0,-1);
const surfboard=new T.ExtrudeGeometry(surfShape,{depth:.07,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1,curveSegments:12});surfboard.translate(0,0,-.035);
const gableShape=new T.Shape();gableShape.moveTo(-2.9,0);gableShape.lineTo(0,1.65);gableShape.lineTo(2.9,0);gableShape.closePath();
const gable=new T.ExtrudeGeometry(gableShape,{depth:4.4,bevelEnabled:false,steps:1});gable.translate(0,0,-2.2);
const windDisplacement=`
float gust=sin(uNatureTime*.95+position.z*.21)*.65+sin(uNatureTime*1.83+position.x*.9)*.35;
transformed.x += windWeight*uWindStrength*(.28+gust*.34);
transformed.z += windWeight*uWindStrength*sin(uNatureTime*1.17+position.z*.33)*.22;
transformed.y += windWeight*uWindStrength*sin(uNatureTime*2.2+position.z*.5)*.14;
`;
type Creature={kind:string;root:T.Group;animate:(time:number)=>void};

/** Fixed-size scenery and wildlife pools; wind and ocean motion run in GPU shaders. */
export class NatureWorld{
  root=new T.Group();private time={value:0};private travel={value:0};private windStrength={value:1};private night={value:0};private sunset={value:0};private creatures:Creature[]=[];
  private smoke:{mesh:T.InstancedMesh;x:number;z:number;phase:number}[]=[];private dappled:T.InstancedMesh[]=[];private dummy=new T.Object3D();private map:MapId='town';
  private foliage:T.MeshToonMaterial;private foliageDepth:T.MeshDepthMaterial;private ocean:T.Mesh;private sandMaterial:T.MeshToonMaterial;private forestLight:T.MeshBasicMaterial;
  private smokeMaterial=new T.MeshBasicMaterial({color:'#e3e9d4',transparent:true,opacity:.3,depthWrite:false});
  constructor(private ground:T.MeshToonMaterial,private actor:T.MeshToonMaterial,private edge:T.Material,private glow:T.Material){
    this.sandMaterial=ground.clone();this.sandMaterial.emissive.set('#e9cfa6');this.sandMaterial.emissiveIntensity=.19;this.sandMaterial.onBeforeCompile=ground.onBeforeCompile;
    this.forestLight=(glow as T.MeshBasicMaterial).clone();this.forestLight.color.set('#eef4c6');this.forestLight.opacity=.13;
    this.foliage=ground.clone();this.foliage.side=T.DoubleSide;
    const patch=(shader:{uniforms:Record<string,unknown>;vertexShader:string})=>{shader.uniforms.uNatureTime=this.time;shader.uniforms.uWindStrength=this.windStrength;shader.vertexShader='attribute float windWeight;\nuniform float uNatureTime;\nuniform float uWindStrength;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+windDisplacement);};
    this.foliage.onBeforeCompile=(shader,renderer)=>{ground.onBeforeCompile(shader,renderer);patch(shader);};this.foliage.customProgramCacheKey=()=> 'nature-wind-v1';
    this.foliageDepth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,side:T.DoubleSide});this.foliageDepth.onBeforeCompile=patch;this.foliageDepth.customProgramCacheKey=()=> 'nature-wind-depth-v1';
    const water=new T.ShaderMaterial({fog:true,side:T.DoubleSide,uniforms:{...T.UniformsUtils.clone(T.UniformsLib.fog),uNatureTime:this.time,uTravelZ:this.travel,uNight:this.night,uSunset:this.sunset,uWindStrength:this.windStrength},vertexShader:`
      uniform float uNatureTime;uniform float uTravelZ;varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main(){
        vec3 transformed=position;
        float along=position.z-uTravelZ+64.;
        float shore=-9.2+sin(along*3.14159265/64.0)*.5+sin(along*3.14159265/32.0)*.18;
        float distanceToShore=max(0.,shore-position.x);
        transformed.y += sin(distanceToShore*1.15+uNatureTime*1.65+sin(position.z*.14)*.4)*.028;
        transformed.y += sin(position.x*.48+position.z*.35+uNatureTime*.8)*.018;
        vWorld=(modelMatrix*vec4(transformed,1.)).xyz;
        vec4 mvPosition=modelViewMatrix*vec4(transformed,1.);gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,fragmentShader:`
      uniform float uNatureTime;uniform float uTravelZ;uniform float uNight;uniform float uSunset;uniform float uWindStrength;varying vec3 vWorld;
      #include <fog_pars_fragment>
      void main(){
        float along=vWorld.z-uTravelZ+64.;
        float shore=-9.2+sin(along*3.14159265/64.)*.5+sin(along*3.14159265/32.)*.18;
        float d=max(0.,shore-vWorld.x);
        vec3 color=mix(vec3(.11,.66,.58),vec3(.018,.22,.47),smoothstep(1.,28.,d));
        float bands=fract(d*.24+uNatureTime*.17+sin(vWorld.z*.14)*.095);
        float broken=.45+.55*smoothstep(-.7,.7,sin(vWorld.z*1.4+sin(vWorld.x*.5)));
        float crest=smoothstep(.91,.975,bands)*(1.-smoothstep(10.,30.,d))*broken;
        float lap=(.5+.5*sin(uNatureTime*1.65+vWorld.z*.27))*.7;
        float foam=(1.-smoothstep(lap,lap+.3,d))*.8+crest*.63;
        float sparkle=pow(max(0.,sin(vWorld.x*3.1+uNatureTime)*sin(vWorld.z*2.3-uNatureTime*.6)),18.)*.13;
        color=mix(color,vec3(.8,.98,.89),clamp(foam+sparkle,0.,.9));
        color=mix(color,color*vec3(.34,.39,.58),uNight*.8);
        color=mix(color,color*vec3(1.2,.88,.68)+vec3(.075,.02,.015),uSunset*.38);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`});
    const sea=surface(100,60,(t,s)=>[-8.3+(-151*s),-.085,-88+t*192]);this.ocean=new T.Mesh(sea,water);this.ocean.frustumCulled=false;this.root.add(this.ocean);
  }
  reset(){this.creatures=[];this.smoke=[];this.dappled=[];this.travel.value=0;}
  configure(settings:Settings){this.map=settings.map;this.root.visible=settings.map==='coast';this.night.value=settings.time==='night'?1:0;this.sunset.value=settings.time==='sunset'?1:0;this.windStrength.value=settings.weather==='rain'?1.6:1;this.smokeMaterial.color.set(settings.time==='night'?'#9aaac0':'#e3e9d4');this.sandMaterial.emissiveIntensity=settings.time==='night'?.018:.19;this.forestLight.opacity=settings.time==='sunset'?.07:.13;this.dappled.forEach(m=>m.visible=settings.time!=='night'&&settings.weather!=='rain');}
  buildChunk(map:'coast'|'forest',seed:number){return map==='coast'?this.beach(seed):this.forest(seed);}
  private windMesh(p:Part,group:T.Group){const m=p.finish(group);m.customDepthMaterial=this.foliageDepth;return m;}
  private beach(seed:number){
    const group=new T.Group(),p=new Part(this.ground),sandParts=new Part(this.sandMaterial),leaves=new Part(this.foliage),rand=random(107+seed*983),offset=seed*32;
    group.userData.theme='tropical-beach';group.userData.pathWidth=3.8;
    const sand=surface(32,4,(t,s)=>{const z=-16+t*32,shore=shoreline(z+offset);return[shore+(38-shore)*s,-.03-Math.exp(-s*40)*.025,z];});
    const wet=surface(32,1,(t,s)=>{const z=-16+t*32;return[shoreline(z+offset)+s*1.05,-.023-Math.pow(1-s,2)*.029,z];});
    const track=surface(32,1,(t,s)=>{const z=-16+t*32;return[trailCenter(z+offset)+(s-.5)*3.8,.025,z];});
    sandParts.add(sand,'#fff0c8',[0,0,0],[1,1,1]).add(wet,'#e0c18f',[0,0,0],[1,1,1]).add(track,'#d5b47d',[0,0,0],[1,1,1]);sand.dispose();wet.dispose();track.dispose();
    for(let i=0;i<32;i++){const z=-15.5+i;sandParts.add(box,'#b79769',[trailCenter(z+offset),.029,z],[3.8,.006,.023]);for(const side of [-1,1])sandParts.add(rod,'#94774f',[trailCenter(z+offset)+side*1.75,.033,z+.38],[.017,.004,.017]);}
    // Sand ripples, shells and irregular grass along a cycle path, without road markings.
    for(let i=0;i<65;i++){const x=-3.2-rand()*5.1,z=-16+rand()*32;p.add(box,i%3?'#e4c18a':'#ffeabc',[x,-.015,z],[.12+rand()*.45,.004,.018],[0,rand()*.3,0]);}
    for(let i=0;i<15;i++){const x=-3.9-rand()*3.8,z=-15+rand()*30;p.add(round,i%2?'#fff0d3':'#eead91',[x,.015,z],[.08,.035,.06],[0,rand()*5,0]);}
    for(let i=0;i<22;i++){const x=1.5+rand()*5,z=-16+rand()*32;for(let j=0;j<3;j++)leaves.add(frond,['#68a16a','#8ab878','#a1be73'][j],[x,.04,z],[.22,.27,.24],[0,j*2.1,-.2]);}
    for(let i=0;i<3;i++){
      const x=i===2?4.3:-5.7+(i%2)*.35,z=-11+i*11,h=(i===1?3.6:4.9)+rand()*(i===1?.4:.8);
      for(let j=0;j<7;j++){const a=j/7,b=(j+1)/7;p.tube([x+a*a*.7,a*h,z+a*.12],[x+b*b*.7,b*h,z+b*.12],.13-a*.05,j%2?'#c39562':'#aa8055');p.add(rod,'#a07950',[x+b*b*.7,b*h-.025,z+b*.12],[.134-b*.05,.047,.134-b*.05]);}
      for(let j=0;j<10;j++){const a=j*Math.PI/5;leaves.add(frond,['#2e825b','#46a66b','#75b76b'][j%3],[x+.7,h,z+.12],[1,1,1],[.08+Math.sin(j)*.08,a,Math.cos(j)*.09]);}
      for(let j=0;j<3;j++)p.add(round,'#977348',[x+.6+j%2*.19,h-.25,z+.05+j*.12],[.15,.19,.15]);
      if(i===0){p.add(surfboard,'#fb7965',[x+.55,1.01,z+.3],[.9,1.05,1],[.1,.5,-.2]);p.add(box,'#fff2c4',[x+.55,1.02,z+.37],[.055,1.8,.02],[.1,.5,-.2]);}
    }
    // Striped umbrellas and loungers make the beach feel inhabited, without buildings.
    for(let i=0;i<2;i++){
      const x=-6.8,z=-6+i*17;p.add(rod,'#d5b27d',[x,1.0,z],[.035,2,.035]);
      for(let j=0;j<10;j++){
        const wedge=surface(4,4,(t,s)=>{const a=(j+s)*Math.PI/5;return[Math.cos(a)*t*1.25,Math.cos(t*Math.PI/2)*.38+1.95,Math.sin(a)*t*1.25];});
        const indices=wedge.index!.array;for(let k=0;k<indices.length;k+=3)[indices[k],indices[k+1]]=[indices[k+1],indices[k]];wedge.computeVertexNormals();
        p.add(wedge,j%2?'#fff5dc':i===0?'#e97866':'#69baba',[x,0,z],[1,1,1]);wedge.dispose();
      }
      for(const dz of [-.5,.5]){p.add(box,'#eee3ca',[x+.8,.18,z+dz],[.7,.045,1.75]);p.add(box,i?'#78bfc2':'#e59071',[x+.8,.43,z+dz-.55],[.67,.045,.65],[-.7,0,0]);for(const xx of [-.3,.3])p.tube([x+.8+xx,.05,z+dz-.6],[x+.8+xx,.18,z+dz+.65],.022,'#b79b70');}
      p.add(box,i?'#69adc2':'#efae78',[x-1.1,.006,z+.9],[.95,.01,1.85],[0,.2,0]);p.add(rod,'#fff4d8',[x-1.1,.08,z+1.55],[.09,.7,.09],[0,0,Math.PI/2]);
    }
    for(const z of [-13,6]){
      p.tube([1.5,0,z],[1.5,2.4,z],.033,'#d5ac6c');leaves.add(flag,seed%2?'#e88968':'#60a8bb',[1.5,1.8,z],[1,1,1],[0,-.1,0]);
      p.add(rod,'#a57543',[1.1,.65,z-2],[.065,1.3,.065]).add(box,'#cbae73',[1.1,1.3,z-2],[.2,.07,.2]).add(round,'#f5df9a',[1.1,1.41,z-2],[.09,.14,.09]);
    }
    sandParts.finish(group).castShadow=false;p.finish(group);this.windMesh(leaves,group);
    if(seed%2===0)this.addBird(group,-12,3.4,4,seed*1.6);
    return group;
  }
  private cabin(p:Part,group:T.Group,x:number,z:number,seed:number){
    group.userData.cabin=true;
    p.add(box,'#75664e',[x,.13,z],[4.8,.26,6.2]).add(box,'#8e6944',[x,1.62,z],[4.4,2.94,5.8]);
    for(let row=0;row<14;row++){
      const y=.34+row*.2;p.add(rod,row%3?'#b58a57':'#a7794e',[x+2.22,y,z],[.14,6,.14],[Math.PI/2,0,0]);
      for(const side of [-1,1])p.add(rod,row%3?'#a67d52':'#98714c',[x,y,z+side*2.88],[.135,4.6,.135],[0,0,Math.PI/2]);
    }
    p.add(gable,'#c59b61',[x,3.1,z],[1,1,1],[0,Math.PI/2,0]);
    for(const side of [-1,1]){
      p.add(box,'#355447',[x,3.9,z+side*1.65],[5.15,.16,3.65],[side*.515,0,0]);
      for(let row=0;row<5;row++)for(let col=0;col<10;col++){const rz=side*(.31+row*.63);p.add(box,['#58795b','#4c6c52','#638463'][(row+col+seed)%3],[x-2.28+col*.51,4.78-Math.abs(rz)*.566,z+rz],[.50,.037,.72],[side*.515,0,0]);}
      p.tube([x+2.58,3.04,z+side*3.24],[x+2.58,4.87,z],.077,'#d4b179');
    }
    p.tube([x-2.62,4.88,z],[x+2.68,4.88,z],.09,'#abc092');
    // Glass, frames, shutters, a carved door and porch steps face the path.
    for(const dz of [-1.67,1.67]){
      p.add(box,'#f0d29a',[x+2.40,1.84,z+dz],[.12,1.27,1.35]).add(box,'#edcc84',[x+2.48,1.84,z+dz],[.03,1.04,1.13]);
      p.add(box,'#6a593f',[x+2.51,1.84,z+dz],[.04,1.08,.055]).add(box,'#6a593f',[x+2.51,1.84,z+dz],[.04,.055,1.16]);
      for(const s of [-1,1]){p.add(box,'#5e8063',[x+2.48,1.84,z+dz+s*.86],[.095,1.23,.37]);for(let row=0;row<7;row++)p.add(box,'#829975',[x+2.53,1.36+row*.15,z+dz+s*.86],[.025,.025,.31]);}
      p.add(box,'#68503d',[x+2.64,1.13,z+dz],[.38,.26,1.34]);for(let i=0;i<5;i++)p.add(round,i%2?'#e7b86e':'#ca8580',[x+2.66,1.35,z+dz-.5+i*.25],[.16,.17,.15]);
    }
    for(const side of [-1,1])for(const dx of [-.92,.92]){
      p.add(box,'#e6c88c',[x+dx,1.88,z+side*3.00],[1.35,1.24,.11]).add(box,'#edcc84',[x+dx,1.88,z+side*3.065],[1.14,1.03,.03]);
      p.add(box,'#685944',[x+dx,1.88,z+side*3.09],[.055,1.07,.03]).add(box,'#685944',[x+dx,1.88,z+side*3.09],[1.18,.055,.03]);
      for(const shutter of [-1,1]){p.add(box,'#638567',[x+dx+shutter*.79,1.88,z+side*3.08],[.3,1.22,.07]);for(let row=0;row<7;row++)p.add(box,'#829b76',[x+dx+shutter*.79,1.4+row*.15,z+side*3.12],[.26,.025,.014]);}
      p.add(box,'#71563d',[x+dx,1.12,z+side*3.19],[1.3,.24,.34]);for(let i=0;i<4;i++)p.add(round,i%2?'#cf8582':'#f0c173',[x+dx-.45+i*.3,1.35,z+side*3.22],[.16,.14,.13]);
    }
    p.add(box,'#e0be84',[x+2.43,1.36,z],[.15,2.35,1.05]).add(box,'#526c53',[x+2.53,1.35,z],[.055,2.14,.85]);
    p.add(box,'#b5c292',[x+2.57,1.8,z],[.025,.5,.59]).add(round,'#dbc477',[x+2.59,1.12,z+.29],[.045,.045,.045]);
    p.add(box,'#a88150',[x+3.06,.28,z],[1.3,.18,4.6]);for(let i=0;i<15;i++)p.add(box,'#cea66d',[x+3.06,.375,z-2.16+i*.3],[1.33,.022,.012]);
    for(let i=0;i<3;i++)p.add(box,'#94744d',[x+3.87+i*.23,.26-i*.08,z],[.28,.16,1.5]);
    for(const dz of [-2.15,2.15]){p.tube([x+3.62,.34,z+dz],[x+3.62,2.84,z+dz],.07,'#b79866');p.tube([x+2.55,2.8,z+dz],[x+3.73,2.8,z+dz],.065,'#b79866');}
    p.add(box,'#55745a',[x+3.12,2.88,z],[1.6,.11,4.8],[0,0,-.12]);
    p.add(box,'#a9a092',[x-.6,4.47,z+1.5],[.65,1.55,.75]);for(let i=0;i<8;i++)p.add(box,'#7e8179',[x-.25,3.86+i*.17,z+1.5],[.02,.029,.78]);p.add(box,'#686f68',[x-.6,5.29,z+1.5],[.83,.16,.92]);
    p.add(box,'#4b5644',[x+2.64,2.55,z+.72],[.26,.36,.28]).add(box,'#f5df9a',[x+2.80,2.55,z+.72],[.07,.23,.17]);
    for(let i=0;i<8;i++){const y=.23+Math.floor(i/3)*.17,dz=-2.5+i%3*.19;p.add(rod,'#8c633f',[x+3.1,y,z+dz],[.084,.6,.084],[0,0,Math.PI/2]).add(rod,'#d8b785',[x+3.405,y,z+dz],[.067,.012,.067],[0,0,Math.PI/2]);}
    for(let i=0;i<6;i++)p.add(lowRock,'#c3bdaa',[x+4.6+i*.38,.04,z+Math.sin(i)*.23],[.26,.08,.36]);
    const smoke=new T.InstancedMesh(round.clone(),this.smokeMaterial,8);smoke.userData.ownedGeometry=true;smoke.instanceMatrix.setUsage(T.DynamicDrawUsage);smoke.frustumCulled=false;group.add(smoke);this.smoke.push({mesh:smoke,x:x-.6,z:z+1.5,phase:seed*2.3});
  }
  private forest(seed:number){
    const group=new T.Group(),p=new Part(this.ground),leaves=new Part(this.foliage),rand=random(903+seed*337),offset=seed*32;
    group.userData.theme='woodland-trail';group.userData.pathWidth=3.8;
    p.add(box,'#729458',[0,-.18,0],[72,.3,32]);const track=surface(32,1,(t,s)=>{const z=-16+t*32;return[trailCenter(z+offset)+(s-.5)*3.8,.025,z];});p.add(track,'#bba480',[0,0,0],[1,1,1]);track.dispose();
    const cabinZ=seed===2?-9:seed===3?-15:undefined;
    for(let i=0;i<24;i++){
      const left=i%2===0,x=left?-6.3-rand()*12:11+rand()*11,z=-15+rand()*30,h=4.6+rand()*3.5;
      if(left&&cabinZ!==undefined&&Math.abs(x+7.5)<5&&Math.abs(z-cabinZ)<6.5)continue;
      p.tube([x,0,z],[x+.15,h*.78,z-.12],.16+rand()*.12,'#766147');
      for(let j=0;j<3;j++){p.tube([x,h*(.35+j*.16),z],[x+(j%2?-.85:.8),h*(.45+j*.17),z+.15],.07,'#766147');}
      if(i%3){for(let j=0;j<3;j++)p.add(cone,['#355d47','#497655','#63875b'][j],[x,(.5+j*.17)*h,z],[1.5-j*.3,h*.47,1.5-j*.3]);}
      else{for(let j=0;j<5;j++)p.add(round,['#4a754b','#638c54','#80a25d'][j%3],[x+Math.cos(j*2)*.8,h*.78+Math.sin(j)*.45,z+Math.sin(j*2)*.7],[1.35,1.2,1.35]);}
    }
    // Low undergrowth keeps the camera corridor open while the forest stays dense.
    for(let i=0;i<50;i++){
      const x=i%2?-3.3-rand()*4:1.5+rand()*8,z=-16+rand()*32;
      p.add(lowRock,['#8d9b77','#a6ad8b','#677b60'][i%3],[x,.07,z],[.18+rand()*.32,.1+rand()*.13,.2+rand()*.28]);
      for(let j=0;j<5;j++)leaves.add(frond,['#437d53','#68994f','#8ca75a'][j%3],[x,.1,z],[.24,.28,.26],[.2,j*Math.PI*.4,0]);
      if(i%4===0){p.add(rod,'#e4d4aa',[x+.24,.16,z],[.045,.3,.045]);p.add(round,'#c57a63',[x+.24,.31,z],[.19,.08,.16]);for(let j=0;j<3;j++)p.add(round,'#f8edd1',[x+.17+j*.07,.38,z],[.02,.009,.019]);}
    }
    for(let i=0;i<100;i++){const z=-16+rand()*32,x=trailCenter(z+offset)+(rand()-.5)*3.2;p.add(lowRock,i%2?'#c8b897':'#a89a78',[x,.037,z],[.015+rand()*.04,.008,.02+rand()*.025]);}
    for(let i=0;i<8;i++){const x=-3.7,z=-14+i*4;p.add(box,'#8b714d',[x,.46,z],[.11,.9,.12]);if(i<7)p.tube([x,.71,z],[x,.71,z+4],.035,'#b29a68');}
    p.add(rod,'#856449',[-4.6,.3,-10],[.24,2.6,.24],[0,0,Math.PI/2]);p.add(rod,'#c2aa7b',[-3.295,.3,-10],[.2,.012,.2],[0,0,Math.PI/2]);
    p.add(rod,'#9c744e',[-3.95,.24,-11],[.22,.48,.22]).add(rod,'#e2c58e',[-3.95,.487,-11],[.225,.014,.225]);
    if(cabinZ!==undefined)this.cabin(p,group,-7.5,cabinZ,seed);
    const light=new T.InstancedMesh(new T.PlaneGeometry(1,1),this.forestLight,22);light.userData.ownedGeometry=true;group.add(light);this.dappled.push(light);
    for(let i=0;i<22;i++){const z=-15+rand()*30;this.dummy.position.set(-4.8+rand()*8,.041,z);this.dummy.rotation.set(-Math.PI/2,0,rand()*6);this.dummy.scale.set(.45+rand()*1.6,.4+rand()*1.4,1);this.dummy.updateMatrix();light.setMatrixAt(i,this.dummy.matrix);}
    p.finish(group);this.windMesh(leaves,group);
    this.addDeer(group,-4.65,seed%2?7:-3,seed*2.7);
    this.addRabbit(group,-3.3,4,seed*1.9);this.addRabbit(group,1.8,-9,seed*1.9+2.4);
    this.addSquirrel(group,-3.95,-11,seed*1.3);
    return group;
  }
  private addDeer(parent:T.Group,x:number,z:number,phase:number){
    const root=new T.Group(),body=new Part(this.actor,this.edge),head=new T.Group(),legs:T.Group[]=[];root.position.set(x,0,z);root.rotation.y=.9;root.add(head);parent.add(root);
    body.add(round,'#bd895b',[0,.77,0],[.30,.35,.58]).add(round,'#eee1b9',[0,.65,.34],[.23,.18,.18]).add(round,'#ede3c7',[0,.89,-.55],[.12,.11,.10]);
    for(const side of [-1,1])for(let i=0;i<5;i++)body.add(round,'#f7ebcb',[side*.28,.84+Math.sin(i*1.4)*.07,-.38+i*.15],[.025,.037,.038]);body.finish(root);
    head.position.set(0,1.05,.36);new Part(this.actor,this.edge).add(round,'#c3986a',[0,.12,.07],[.22,.30,.20]).add(round,'#dfbf8e',[0,-.06,.24],[.16,.13,.22]).add(round,'#443c38',[0,-.06,.427],[.09,.06,.04]).finish(head);
    const detail=new Part(this.actor);for(const side of [-1,1]){detail.add(round,'#453c36',[side*.197,.17,.17],[.034,.049,.033]).add(round,'#fff4d6',[side*.216,.186,.181],[.012,.015,.012]);detail.add(round,'#b68459',[side*.25,.38,.01],[.10,.23,.085],[0,0,-side*.5]).add(round,'#eed5b7',[side*.255,.393,.035],[.052,.14,.028],[0,0,-side*.5]);}detail.finish(head);
    for(const xx of [-.19,.19])for(const zz of [-.34,.34]){const leg=new T.Group();leg.position.set(xx,.67,zz);root.add(leg);new Part(this.actor).add(rod,'#b58a60',[0,-.3,0],[.042,.60,.042]).add(box,'#50463e',[0,-.635,.018],[.09,.085,.12]).finish(leg);legs.push(leg);}
    this.creatures.push({kind:'deer',root,animate:time=>{const t=time+phase,walk=(t%16)>10;root.position.x=x+(walk?Math.sin((t%16-10)*.6)*.38:0);root.position.z=z+(walk?Math.sin(t*.6)*.35:0);head.rotation.x=walk?-.12:.33+Math.sin(t*.6)*.27;head.rotation.y=Math.sin(t*.42)*.12;legs.forEach((l,i)=>l.rotation.x=walk?Math.sin(t*3.4+i%2*Math.PI)*.23:0);}});
  }
  private addRabbit(parent:T.Group,x:number,z:number,phase:number){
    const root=new T.Group(),ears=new T.Group(),p=new Part(this.actor,this.edge);root.position.set(x,.02,z);root.rotation.y=-.5;root.add(ears);parent.add(root);
    p.add(round,'#e7dcc5',[0,.18,0],[.18,.17,.29]).add(round,'#f1e7d3',[0,.31,.23],[.16,.17,.16]).add(round,'#fbf1df',[0,.22,-.27],[.08,.085,.075]);
    for(const side of [-1,1]){p.add(round,'#eedfc2',[side*.12,.05,.15],[.08,.04,.12]);p.add(round,'#303849',[side*.134,.35,.30],[.019,.029,.02]);p.add(round,'#e6b2a2',[side*.072,.20,.37],[.032,.014,.014]);}p.add(round,'#d59291',[0,.28,.385],[.025,.017,.018]);p.finish(root);
    new Part(this.actor,this.edge).add(round,'#f2e9d3',[-.072,.56,.20],[.052,.22,.058],[0,0,-.1]).add(round,'#f2e9d3',[.072,.56,.20],[.052,.22,.058],[0,0,.1]).add(round,'#ddb4a6',[-.075,.57,.252],[.024,.15,.009],[0,0,-.1]).add(round,'#ddb4a6',[.075,.57,.252],[.024,.15,.009],[0,0,.1]).finish(ears);
    this.creatures.push({kind:'rabbit',root,animate:time=>{const t=time*.8+phase,hopping=t%9<2.7;root.position.y=.02+(hopping?Math.abs(Math.sin(t*8))*.14:0);root.position.z=z+(hopping?Math.sin(t*2)*.45:0);root.rotation.x=hopping?Math.sin(t*8)*.12:0;ears.rotation.z=Math.sin(t*2.1)*.065;}});
  }
  private addSquirrel(parent:T.Group,x:number,z:number,phase:number){
    const root=new T.Group(),tail=new T.Group(),p=new Part(this.actor,this.edge);parent.add(root);root.position.set(x,.51,z);root.add(tail);
    p.add(round,'#b78250',[0,.13,0],[.12,.17,.19]).add(round,'#e5c79a',[0,.14,.15],[.08,.12,.07]).add(round,'#bb8b58',[0,.31,.15],[.14,.13,.13]);
    for(const side of [-1,1])p.add(round,'#332d28',[side*.115,.33,.23],[.022,.027,.022]).add(round,'#ae794c',[side*.11,.44,.13],[.05,.074,.037]);p.add(round,'#6e4630',[0,.29,.28],[.06,.025,.036]).add(round,'#be975f',[0,.1,.22],[.072,.09,.058]);p.finish(root);
    new Part(this.actor,this.edge).add(round,'#af7948',[0,.22,-.21],[.12,.27,.15],[-.5,0,0]).add(round,'#c29764',[0,.42,-.32],[.14,.17,.12],[.6,0,0]).finish(tail);
    this.creatures.push({kind:'squirrel',root,animate:time=>{tail.rotation.z=Math.sin(time*2.4+phase)*.19;root.rotation.y=Math.sin(time*.75+phase)*.4;root.position.y=.51+Math.sin(time*2+phase)*.01;}});
  }
  private addBird(parent:T.Group,x:number,y:number,z:number,phase:number){
    const root=new T.Group(),wings:T.Group[]=[];root.position.set(x,y,z);parent.add(root);new Part(this.actor).add(round,'#f4f0da',[0,0,0],[.11,.13,.27]).add(round,'#fff9e7',[0,.12,.19],[.1,.11,.10]).add(cone,'#e9b258',[0,.1,.34],[.055,.15,.04],[Math.PI/2,0,0]).add(round,'#253446',[.08,.14,.255],[.015,.021,.017]).finish(root);
    for(const side of [-1,1]){const w=new T.Group();w.position.x=side*.08;root.add(w);new Part(this.actor).add(round,'#eeeede',[side*.27,0,-.01],[.35,.035,.15],[0,side*.18,0]).add(round,'#77818a',[side*.5,0,-.04],[.16,.034,.1]).finish(w);wings.push(w);}
    this.creatures.push({kind:'seagull',root,animate:time=>{const a=time*.22+phase;root.position.set(x+Math.sin(a)*2,y+Math.sin(time*.6+phase)*.25,z+Math.cos(a)*3);root.rotation.y=Math.sin(a)*.6;wings.forEach((w,i)=>w.rotation.z=Math.sin(time*3.5+phase)*(i===0?-.45:.45));}});
  }
  update(time:number,travel=0){
    this.time.value=time;this.travel.value=travel;this.creatures.forEach(c=>c.animate(time));
    for(const puff of this.smoke)for(let i=0;i<8;i++){const age=(time*.19+i/8+puff.phase)%1;this.dummy.position.set(puff.x+age*.7+Math.sin(time*.6+i)*age*.17,5.42+age*2.4,puff.z+age*.25);this.dummy.scale.setScalar((.11+age*.27)*Math.sin(age*Math.PI));this.dummy.updateMatrix();puff.mesh.setMatrixAt(i,this.dummy.matrix);puff.mesh.instanceMatrix.needsUpdate=true;}
  }
  get stats(){return{theme:this.map==='coast'?'tropical-beach':this.map==='forest'?'woodland-trail':'city',pathWidth:this.map==='town'?8.4:3.8,ocean:this.root.visible,palms:this.map==='coast'?12:0,cabins:this.smoke.length,windTime:this.time.value,waveTime:this.root.visible?this.time.value:0,shoreTravel:this.travel.value,animals:this.creatures.map(c=>({kind:c.kind,x:c.root.position.x,y:c.root.position.y,z:c.root.position.z,head:c.root.rotation.x}))};}
  dispose(){this.ocean.geometry.dispose();(this.ocean.material as T.Material).dispose();this.foliage.dispose();this.foliageDepth.dispose();this.smokeMaterial.dispose();this.sandMaterial.dispose();this.forestLight.dispose();}
}
