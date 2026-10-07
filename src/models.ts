import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RIDERS } from './data';

// Reused primitives, sculpted profiles and merged parts keep detail inexpensive.
const cube = new T.BoxGeometry(1, 1, 1);
const soft = new RoundedBoxGeometry(1, 1, 1, 2, .13);
const voxel = new RoundedBoxGeometry(1, 1, 1, 1, .025);
const ball = new T.SphereGeometry(1, 16, 10);
const carTyre = new T.CylinderGeometry(1, 1, 1, 40);
const rod = new T.CylinderGeometry(1, 1, 1, 12);
const taper = new T.CylinderGeometry(.8, 1, 1, 12);
const tyre = new T.TorusGeometry(.6, .064, 8, 48);
const rim = new T.TorusGeometry(.51, .017, 5, 48);
const fender = new T.TorusGeometry(.665, .039, 5, 36, Math.PI * 1.05);
const smallRing = new T.TorusGeometry(1, .09, 5, 32);
function profile(points: number[][], depth: number, bevel = .03) {
  const shape = new T.Shape(); points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
  const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSegments: 2, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 6 }); g.translate(0, 0, -depth / 2); return g;
}
const jacket = profile([[-.36,.36],[-.45,.19],[-.32,-.42],[.3,-.42],[.45,.19],[.35,.36],[.13,.4],[-.13,.4]], .43, .05);
const lapel = profile([[0,.2],[.16,0],[.03,-.22],[-.11,.07]], .025, .008);
const tie = profile([[-.06,.23],[.06,.23],[.04,-.22],[0,-.3],[-.05,-.22]], .03, .006);
const cone = new T.ConeGeometry(1, .46, 12);
const dummy = new T.Object3D();
function blockProfile(points:number[][],depth:number){
  const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:false,curveSegments:1});g.translate(0,0,-depth/2);return g;
}
// Character surfaces are strictly square: no bevels, rounded boxes or softened silhouettes.
const block=cube;
const mascotTorso=blockProfile([[-.54,-.16],[.54,-.16],[.54,.66],[.47,.66],[.47,.78],[.36,.78],[.36,.86],[-.36,.86],[-.36,.78],[-.47,.78],[-.47,.66],[-.54,.66]],.76);
const puddingTorso=blockProfile([[-.67,-.18],[.67,-.18],[.67,.84],[.57,.84],[.57,.98],[.40,.98],[.40,1.04],[-.40,1.04],[-.40,.98],[-.57,.98],[-.57,.84],[-.67,.84]],.98);
const mascotHead=blockProfile([[-.41,-.38],[.41,-.38],[.41,.29],[.31,.29],[.31,.39],[-.31,.39],[-.31,.29],[-.41,.29]],.70);
const pixelBelly=blockProfile([[-.20,.64],[.20,.64],[.20,.59],[.29,.59],[.29,.51],[.35,.51],[.35,.40],[.39,.40],[.39,.18],[.35,.18],[.35,.07],[.27,.07],[.27,0],[-.27,0],[-.27,.07],[-.35,.07],[-.35,.18],[-.39,.18],[-.39,.40],[-.35,.40],[-.35,.51],[-.29,.51],[-.29,.59],[-.20,.59]],.006);
const blockEar=blockProfile([[-.11,0],[.11,0],[.11,.54],[.055,.54],[.055,.64],[-.055,.64],[-.055,.54],[-.11,.54]],.20);
const blockNose=new T.BoxGeometry(.40,.23,.14);
const blockTail=blockProfile([[0,0],[.42,0],[.42,.08],[.60,.08],[.60,.26],[.70,.26],[.70,.56],[.58,.56],[.58,.36],[.47,.36],[.47,.20],[.28,.20],[.28,.14],[0,.14]],.14);
const mascotUpperArm=new T.BoxGeometry(.40,.60,.36).translate(0,-.265,0);
const mascotForearm=new T.BoxGeometry(.37,.60,.34).translate(0,-.275,0);
const goldOutlines=new WeakMap<T.Material,T.Material>();
function goldOutline(edge:T.Material){
  let outline=goldOutlines.get(edge);if(!outline){outline=edge.clone();if(outline instanceof T.MeshBasicMaterial)outline.color.set('#927032');outline.onBeforeCompile=edge.onBeforeCompile;outline.customProgramCacheKey=()=>`gold-voxel-${edge.customProgramCacheKey()}`;goldOutlines.set(edge,outline);}return outline;
}
export class Part {
  private gs: T.BufferGeometry[] = [];
  constructor(private mat: T.Material, private edge?: T.Material) {}
  add(g: T.BufferGeometry, color: string, p: number[], s: number[], r = [0,0,0]) {
    const copy = g.index ? g.toNonIndexed() : g.clone(); dummy.position.set(p[0],p[1],p[2]); dummy.scale.set(s[0],s[1],s[2]); dummy.rotation.set(r[0],r[1],r[2]); dummy.updateMatrix(); copy.applyMatrix4(dummy.matrix);
    const c = new T.Color(color), colors = new Float32Array(copy.getAttribute('position').count * 3);
    for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
    copy.setAttribute('color',new T.BufferAttribute(colors,3)); this.gs.push(copy); return this;
  }
  tube(a: number[], b: number[], radius: number, color: string) {
    const start = new T.Vector3(...a as [number,number,number]), end = new T.Vector3(...b as [number,number,number]);
    dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize()); const rot = new T.Euler().setFromQuaternion(dummy.quaternion);
    return this.add(rod,color,start.clone().add(end).multiplyScalar(.5).toArray(),[radius,start.distanceTo(end),radius],[rot.x,rot.y,rot.z]);
  }
  finish(parent: T.Object3D) {
    const geo = mergeGeometries(this.gs,false)!; this.gs.forEach(g=>g.dispose()); this.gs=[];
    const mesh = new T.Mesh(geo,this.mat); mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.ownedGeometry=true;parent.add(mesh);
    if(this.edge){const outline=new T.Mesh(geo,this.edge);outline.userData.outline=true;parent.add(outline);} return mesh;
  }
}
function studentSculpt(p: Part, r: typeof RIDERS[number]) {
  const navy='#142e68', seam='#e5be69', ivory='#fff7df', hair=r.hair;
  // Small bevels retain the graphic, voxel silhouette; every lock is a separate sculpted strand.
  p.add(jacket,r.jacket,[0,.39,.065],[1,1,1],[.12,0,0]);
  p.add(voxel,'#162a56',[0,-.025,.02],[.62,.13,.44]);
  p.add(voxel,ivory,[0,.66,.315],[.29,.38,.032],[.12,0,0]);
  for(const side of [-1,1]){
    p.add(lapel,navy,[side*.155,.59,.345],[side,1.15,1],[0,0,side*.18]);
    p.tube([side*.34,.69,.27],[side*.21,.57,.36],.011,seam);
    p.tube([side*.21,.57,.36],[side*.28,.29,.335],.008,seam);
    p.add(voxel,ivory,[side*.08,.81,.312],[.13,.13,.035],[0,0,-side*.48]);
    p.add(voxel,navy,[side*.24,.18,.332],[.2,.14,.025],[0,0,side*.07]);
    p.add(voxel,seam,[side*.24,.25,.352],[.21,.012,.012]);
    p.tube([side*.325,.32,.09],[side*.31,.05,.255],.007,'#3b68c1');
  }
  p.add(tie,'#be2442',[0,.54,.36],[.85,1.16,1]).add(voxel,'#f26468',[0,.67,.378],[.047,.15,.015]);
  p.add(voxel,'#a8233a',[0,.775,.35],[.09,.09,.065],[0,0,.55]);
  p.add(voxel,seam,[0,.5,.387],[.092,.022,.013]);
  p.add(voxel,'#e5cf89',[-.265,.55,.365],[.086,.11,.019]);
  p.add(voxel,navy,[-.265,.555,.379],[.057,.072,.008]);
  p.add(voxel,ivory,[-.265,.565,.386],[.008,.045,.007]);
  for(let i=0;i<3;i++)p.add(rod,seam,[.06,.3-i*.1,.336],[.019,.022,.019],[Math.PI/2,0,0]);
  // Backpack: gussets, two zipped compartments, handle, buckles, straps and a hanging record keyring.
  p.add(voxel,'#253046',[0,.43,-.325],[.69,.78,.32],[.12,0,0]);
  p.add(voxel,'#172338',[0,.28,-.511],[.55,.32,.063],[.12,0,0]);
  p.add(voxel,'#364457',[0,.73,-.482],[.54,.16,.05],[.12,0,0]);
  for(const y of [.37,.79]){
    p.add(voxel,'#9ba6b1',[0,y,-.532],[.48,.01,.01]);
    for(let i=0;i<17;i++)p.add(cube,'#cbd2d7',[-.23+i*.028,y,-.54],[.009,.018,.006]);
    p.add(voxel,'#eac977',[.19,y-.035,-.551],[.032,.055,.015]);
  }
  p.tube([-.12,.85,-.33],[-.12,.96,-.33],.02,'#172338').tube([-.12,.96,-.33],[.12,.96,-.33],.02,'#172338').tube([.12,.96,-.33],[.12,.85,-.33],.02,'#172338');
  for(const x of [-.29,.29]){
    p.add(soft,'#162640',[x,.46,.29],[.062,.62,.045],[.22,0,0]);
    p.add(voxel,'#eac977',[x,.27,.365],[.071,.072,.018]);
    p.add(voxel,navy,[x,.27,.382],[.037,.04,.01]);
    p.add(voxel,'#d8dfec',[x,.61,.365],[.065,.02,.008]);
    p.add(soft,'#435369',[x*1.15,.2,-.33],[.09,.29,.19]);
  }
  p.add(smallRing,'#79d9f3',[.375,.03,-.4],[.075,.075,.035]);
  p.add(rod,'#e4e8df',[.375,.03,-.395],[.038,.018,.038],[Math.PI/2,0,0]);
  p.add(voxel,r.skin,[0,.9,.15],[.23,.24,.24]);
  p.add(voxel,r.skin,[0,1.18,.23],[.88,.81,.75]);
  p.add(voxel,'#e6ae7f',[0,.81,.23],[.73,.045,.62]);
  p.add(voxel,hair,[0,1.48,.185],[.94,.24,.83]);
  for(let row=0;row<3;row++)for(let col=0;col<5;col++){
    p.add(voxel,row===0?'#59352c':hair,[-.36+col*.18,1.42-row*.17,-.17],[.2,.23,.14],[0,0,(col-2)*.022]);
  }
  for(const side of [-1,1]){
    p.add(voxel,r.skin,[side*.455,1.15,.21],[.11,.2,.16]);
    p.add(voxel,'#d79071',[side*.513,1.15,.235],[.009,.085,.065]);
    for(let i=0;i<3;i++)p.add(voxel,i===0?'#56312a':hair,[side*(.42-i*.018),1.39-i*.13,.09+i*.075],[.15,.23,.46-i*.055],[0,0,side*.025]);
    p.add(voxel,'#2b211f',[side*.365,1.055,.525],[.1,.17,.11]);
  }
  const lengths=[.32,.43,.36,.45,.32,.4];
  for(let i=0;i<6;i++){
    const x=-.375+i*.148,top=1.6-(i%3)*.018,len=lengths[i];
    p.add(voxel,i%3===0?'#4d2d27':hair,[x,top-len*.5,.563],[.15,len,.12],[0,0,-.1+i*.02]);
    p.add(voxel,'#6b4134',[x-.059,top-len*.5,.626],[.012,len*.86,.011],[0,0,-.1+i*.02]);
    p.add(voxel,'#34221f',[x+.05,top-len*.5-.035,.631],[.012,len*.72,.01],[0,0,-.1+i*.02]);
  }
  for(let i=0;i<4;i++)p.add(voxel,i%2?'#56322b':hair,[-.24+i*.17,1.62+i%2*.036,.05],[.22,.095,.56],[0,0,-.035+i*.03]);
  // Modelled eyes, cheeks and mouth stay sharp at every camera scale, without a decal face.
  for(const side of [-1,1]){
    p.add(voxel,'#fcf2de',[side*.205,1.16,.608],[.143,.208,.014]);
    p.add(voxel,'#362327',[side*.19,1.14,.622],[.075,.158,.018]);
    p.add(voxel,'#765446',[side*.19,1.09,.634],[.063,.032,.009]);
    p.add(voxel,'#ffffff',[side*.19-.018,1.198,.638],[.029,.036,.009]);
    p.add(voxel,'#372426',[side*.203,1.285,.618],[.16,.025,.018],[0,0,side*.06]);
    p.add(voxel,'#e9a0a0',[side*.29,1.015,.612],[.093,.061,.012]);
  }
  p.add(voxel,'#e5a779',[0,1.07,.627],[.045,.047,.042]);
  p.add(voxel,'#883c40',[0,.962,.621],[.13,.087,.017]);
  p.add(voxel,'#fff1dc',[0,.992,.636],[.095,.021,.009]);
  p.add(voxel,'#e98986',[0,.938,.636],[.086,.025,.009]);
  // Square ear pads and a stepped headband share the same voxel language as the hair and face.
  for(const side of [-1,1]){
    p.add(voxel,'#15273f',[side*.505,1.18,.15],[.078,.21,.20]);
    p.add(voxel,'#4894c3',[side*.55,1.18,.15],[.02,.155,.14]);
    p.add(voxel,'#9adef3',[side*.565,1.18,.15],[.009,.07,.075]);
    p.add(voxel,'#162338',[side*.474,1.43,.13],[.035,.42,.09]);
  }
  p.add(voxel,'#162338',[0,1.661,.13],[.95,.042,.10]);
}
function blockMascot(p:Part,r:typeof RIDERS[number],body:T.Group,mat:T.Material,edge:T.Material){
  const mango=r.kind==='mango',gold=mango?'#f7d16b':'#f0cb7a',light=mango?'#ffe199':'#ffdda0',shade=mango?'#dab359':'#d2aa60',cream='#fff6df';
  const headLift=mango?0:.095;
  p.add(mango?mascotTorso:puddingTorso,gold,[0,.08,mango?.08:.10],[1,1,1]);
  p.add(block,shade,[0,mango?-.086:-.087,mango?.08:.10],mango?[1.08,.029,.76]:[1.34,.027,.98]);
  p.add(block,gold,[0,.875+headLift,.10],mango?[.59,.22,.58]:[.65,.24,.70]);
  p.add(mascotHead,gold,[0,1.285+headLift,.155],mango?[1,1,1]:[.97,1,1]);
  // Small flat colour panels retain the hard, stair-step silhouette.
  p.add(cube,light,[0,1.656+headLift,.16],[.57,.017,.64]);
  p.add(cube,shade,[0,.916+headLift,.167],[.71,.018,.66]);
  const details=new Part(mat);
  details.add(pixelBelly,cream,[0,mango?.15:.12,mango?.479:.603],mango?[1,1,1]:[1.25,1.22,1]);
  if(mango){
    p.add(block,gold,[0,1.10,.536],[.55,.265,.17]);
    p.add(blockNose,'#783d20',[0,1.115,.697],[1,1,1]);
    details.add(cube,'#a46334',[-.075,1.177,.776],[.09,.024,.008]);
    for(const side of [-1,1]){
      const ear=new T.Group();ear.name=`ear-${side}`;ear.position.set(side*.27,1.56,.13);body.add(ear);
      const rotation=side<0?.11:-.57,scale=side<0?[1,1.02,1]:[1.12,.94,1];
      new Part(mat,edge).add(blockEar,gold,[0,0,0],scale,[0,0,rotation]).finish(ear);
      new Part(mat).add(blockEar,'#ffdc7b',[0,.055,.108],[scale[0]*.53,scale[1]*.77,.05],[0,0,rotation]).finish(ear);
    }
    p.add(blockTail,gold,[0,.05,-.30],[1,1,1],[0,Math.PI/2,0]);
  }
  for(const side of [-1,1]){
    const x=side*.208,y=1.305+headLift,z=.520;
    details.add(block,mango?'#fff6df':'#8bbb67',[x,y,z],[mango?.153:.173,.181,.018]);
    details.add(cube,mango?'#402820':'#253b2a',[x-side*.009,y-.012,z+.016],[.085,.119,.012]);
    details.add(cube,'#fffbea',[x-.022,y+.037,z+.025],[.026,.030,.009]);
    details.add(cube,mango?'#eab061':'#d69a55',[side*.29,1.14+headLift,z+.007],[.08,.036,.013]);
  }
  const mouthY=mango?.951:1.085+headLift,mouthZ=.526;
  details.add(cube,mango?'#87512a':'#695136',[0,mouthY,mouthZ],[.13,.017,.012]);
  for(const side of [-1,1])details.add(cube,mango?'#87512a':'#695136',[side*.074,mouthY+.012,mouthZ],[.018,.031,.012]);
  p.finish(body).name='voxel-mascot-body';details.finish(body).name='pixel-mascot-details';
}
export const RIDER_SCALE = .65;
export interface Cyclist { root:T.Group;body:T.Group;wheels:T.Group[]; hips:T.Vector3; animate:(phase:number,standing?:number,wheelAngle?:number)=>void }
export function createCyclist(index:number, mat:T.Material, edge:T.Material, _faceMap?:T.Texture):Cyclist {
  const root=new T.Group(),body=new T.Group();const r=RIDERS[index],steel='#ced9e8',dark='#1d2743',b=new Part(mat,edge);root.add(body);body.position.set(0,1.74,-.42);
  const skinMat=mat,characterEdge=r.kind==='student'?edge:goldOutline(edge);
  // Diamond frame, doubled fork and stays, headset, steering stem and rack.
  const rear=[0,.64,-.94],front=[0,.64,.94],crank=[0,.73,-.02],seat=[0,1.53,-.42],head=[0,1.48,.62];
  for(const [a,z] of [[seat,crank],[seat,head],[head,crank]] as number[][][]) b.tube(a,z,.045,r.bike);
  for(const x of [-.11,.11]){b.tube([x,.64,-.94],[x,1.53,-.42],.025,r.bike);b.tube([x,.64,-.94],[x,.73,-.02],.027,r.bike);b.tube([x,1.5,.62],[x,.64,.94],.028,r.bike);}
  b.tube(seat,[0,1.75,-.49],.035,steel).add(soft,dark,[0,1.75,-.5],[.36,.1,.43]);
  b.tube(head,[0,1.92,.66],.038,steel).tube([-.47,1.9,.67],[.47,1.9,.67],.033,steel);
  for(const x of [-.47,.47]){
    b.tube([x,1.9,.67],[x,1.9,.86],.045,dark).tube([x*.85,1.85,.77],[x*.85,1.86,.94],.018,steel);
    b.add(rod,steel,[x*.24,.65,.94],[.08,.075,.08],[0,0,Math.PI/2]);
    b.tube([x*.84,1.85,.85],[x*.44,1.53,.75],.008,dark).tube([x*.44,1.53,.75],[x*.12,1.1,.82],.008,dark);
  }
  b.add(ball,steel,[-.24,1.96,.67],[.07,.05,.07]).add(rod,dark,[0,1.48,.63],[.065,.06,.065]);
  for(const z of [-.94,.94]){
    b.add(fender,r.bike,[0,.64,z],[1,1,1],[0,Math.PI/2,-.1]);
    b.tube([-.11,.64,z],[-.11,1.19,z-.3],.014,steel).tube([.11,.64,z],[.11,1.19,z+.28],.014,steel);
    b.add(soft,steel,[0,1.15,z+.12],[.22,.075,.13]);b.add(soft,dark,[0,1.07,z+.11],[.16,.06,.09]);
  }
  b.add(rod,steel,[0,.73,-.02],[.06,.38,.06],[0,0,Math.PI/2]);
  b.add(rod,steel,[.17,.64,-.94],[.145,.075,.145],[0,0,Math.PI/2]);
  // Real loop-shaped chain and chainring, with visible links and cassette.
  for(let i=0;i<38;i++){const a=i/38*Math.PI*2,z=-.45+Math.cos(a)*.57,y=.7+Math.sin(a)*.13;b.add(soft,steel,[.17,y,z],[.019,.02,.055],[Math.sin(a)*.22,0,0]);}
  b.add(smallRing,steel,[.18,.73,-.02],[.18,.18,.18],[0,Math.PI/2,0]);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;b.add(cube,dark,[.18,.73+Math.sin(a)*.19,-.02+Math.cos(a)*.19],[.036,.035,.035]);}
  for(const x of [-.2,.2]){b.tube([x,.7,-.92],[x,1.34,-1.12],.014,steel);b.tube([x,1.34,-1.12],[x,1.34,-.59],.018,steel);}
  for(let i=0;i<5;i++)b.tube([-.21,1.34,-1.1+i*.1],[.21,1.34,-1.1+i*.1],.013,steel);
  b.add(soft,'#f63661',[0,1.3,-1.14],[.2,.08,.045]).add(ball,'#fff4c4',[0,1.57,1.19],[.08,.07,.05]);
  // Front carrier, fabric seams, insignia and metal support brackets.
  b.add(soft,r.bike,[0,1.56,1.1],[.67,.5,.44]).add(soft,'#eff5ff',[0,1.82,1.1],[.68,.035,.45]);
  b.add(soft,'#163887',[0,1.54,1.325],[.4,.29,.016]).add(cube,'#4be9ff',[0,1.56,1.339],[.15,.06,.016]);
  for(const x of [-.27,.27]){b.tube([x,.67,.94],[x,1.3,1.13],.018,steel);b.add(cube,steel,[x,1.79,1.33],[.05,.1,.016]);}
  b.add(cube,'#d5edff',[0,1.25,.25],[.005,.045,.3],[-.45,0,0]);b.finish(root);
  const crankAssembly=new T.Group();crankAssembly.position.set(0,.73,-.02);root.add(crankAssembly);
  const cp=new Part(mat);for(const side of [-1,1])cp.tube([side*.235,0,0],[side*.235,0,side*.235],.024,steel);cp.finish(crankAssembly);
  const pedals=[new T.Group(),new T.Group()];pedals.forEach((p,i)=>{p.name=`pedal-${i===0?-1:1}`;root.add(p);new Part(mat).add(soft,dark,[0,0,0],[.2,.045,.18]).add(cube,'#ffda65',[0,0,.096],[.15,.025,.009]).finish(p);});
  const wheels:T.Group[]=[];
  for(const z of [-.94,.94]){
    // The mount fixes the axle. Only its child spins in the tyre's local XY plane.
    const mount=new T.Group(),w=new T.Group();mount.position.set(0,.64,z);mount.rotation.y=Math.PI/2;mount.add(w);root.add(mount);const p=new Part(mat);
    p.add(tyre,'#141b2b',[0,0,0],[1,1,1]).add(rim,steel,[0,0,0],[1,1,1]);
    p.add(rod,steel,[0,0,0],[.065,.18,.065],[Math.PI/2,0,0]);
    for(let i=0;i<24;i++){const a=i*Math.PI/12,hub=a+(i%2?.3:-.3);p.tube([Math.cos(hub)*.07,Math.sin(hub)*.07,i%2?.06:-.06],[Math.cos(a)*.51,Math.sin(a)*.51,0],.008,steel);}
    p.add(soft,'#ffdc74',[.34,.16,0],[.075,.025,.035],[0,0,-.5]);p.finish(w);wheels.push(w);
  }
  const torso=new Part(skinMat,characterEdge);
  if(r.kind==='student'){studentSculpt(torso,r);torso.finish(body);}else blockMascot(torso,r,body,skinMat,characterEdge);
  // Separate sleeve bones allow the torso to rise while both grips stay on the bar.
  const arms:{upper:T.Bone;lower:T.Bone;shoulder:T.Vector3;hand:T.Vector3}[]=[];
  for(const side of [-1,1]){
    const upper=new T.Bone(),lower=new T.Bone(),grip=new T.Bone();upper.name=`upper-arm-${side}`;lower.name=`forearm-${side}`;grip.name=`hand-${side}`;root.add(upper,lower,grip);
    grip.position.set(side*.44,1.9,.65);
    if(r.kind==='student'){
      // Broad, rectangular cloth volumes: no spherical joints, cylindrical sleeves or round cuffs.
      new Part(mat,edge).add(voxel,r.jacket,[0,-.26,0],[.30,.59,.34])
        .add(voxel,'#17316a',[side*.151,-.28,0],[.014,.39,.28])
        .add(voxel,'#4568ac',[0,-.26,.171],[.21,.44,.012]).finish(upper);
      const forearm=new Part(mat,edge);
      forearm.add(voxel,r.jacket,[0,-.265,0],[.28,.59,.32]);
      forearm.add(voxel,'#182e69',[side*.144,-.24,0],[.009,.36,.22]);
      forearm.add(voxel,'#fff4df',[0,-.517,0],[.295,.115,.345]);
      forearm.add(voxel,'#e4c786',[0,-.455,.173],[.293,.021,.012]);
      forearm.add(voxel,'#c7c7b4',[0,-.543,.18],[.25,.026,.011]);
      for(let i=0;i<3;i++)forearm.add(voxel,'#e6ca83',[side*.145,-.365+i*.037,.08],[.015,.021,.022]);
      if(side===-1)forearm.add(voxel,'#17293e',[0,-.49,.185],[.17,.068,.048]).add(voxel,'#54efff',[0,-.49,.213],[.1,.04,.013]);
      forearm.finish(lower);
      const hand=new Part(mat,edge).add(voxel,r.skin,[0,0,.01],[.25,.22,.25]);
      hand.add(voxel,'#dfac7f',[side*-.108,-.025,.018],[.056,.14,.17]);
      for(let i=0;i<3;i++)hand.add(cube,'#da9e74',[-.065+i*.063,-.034,.138],[.007,.11,.009]);
      hand.add(voxel,'#f7d6a9',[0,.074,.066],[.19,.024,.13]);hand.finish(grip);
    }else{
      const stout=r.kind==='pudding',gold=stout?'#f0cb7a':'#f7d16b',shade=stout?'#d2aa60':'#dab359';
      new Part(mat,characterEdge).add(mascotUpperArm,gold,[0,0,0],stout?[1.10,1,1.16]:[1,1,1]).finish(upper);
      new Part(mat,characterEdge).add(mascotForearm,gold,[0,0,0],stout?[1.10,1,1.15]:[1,1,1])
        .add(cube,shade,[0,-.485,stout?.202:.18],[stout?.37:.32,.014,.008]).finish(lower);
      const handColor=stout?'#827d65':gold;
      const hand=new Part(mat,characterEdge).add(block,handColor,[0,-.013,.016],stout?[.312,.24,.30]:[.265,.218,.27]);
      for(let i=0;i<3;i++)hand.add(block,handColor,[-.075+i*.075,-.042,.142],[.069,.105,.06]);
      hand.add(block,handColor,[side*-.124,-.008,.07],[.059,.11,.13]);
      for(let i=0;i<2;i++)hand.add(cube,r.kind==='pudding'?'#635f4c':'#b78a28',[-.037+i*.075,-.039,.174],[.007,.06,.006]);
      hand.finish(grip);
    }
    arms.push({upper,lower,shoulder:new T.Vector3(side*(r.kind==='student'?.34:r.kind==='pudding'?.64:.47),r.kind==='pudding'?.73:.64,r.kind==='student'?.09:r.kind==='pudding'?.19:.10),hand:grip.position});
  }
  const limbs:{upper:T.Bone;lower:T.Bone;foot:T.Bone;x:number}[]=[];
  for(const side of [-1,1]){
    const upper=new T.Bone(),lower=new T.Bone(),foot=new T.Bone();upper.name=`thigh-${side}`;lower.name=`shin-${side}`;foot.name=`foot-${side}`;root.add(upper,lower,foot);
    if(r.kind==='student'){
      new Part(mat,edge).add(voxel,dark,[0,-.34,0],[.31,.74,.36])
        .add(voxel,'#334059',[0,-.26,.186],[.22,.25,.018])
        .add(voxel,'#43506b',[side*.158,-.24,.03],[.015,.43,.02]).finish(upper);
      new Part(mat,edge).add(voxel,dark,[0,-.335,0],[.27,.74,.31])
        .add(voxel,'#41506b',[side*.139,-.29,.035],[.012,.49,.02])
        .add(voxel,'#aeb9c7',[0,-.64,0],[.28,.065,.325]).finish(lower);
      const shoe=new Part(mat,edge);
      shoe.add(voxel,'#b82e47',[0,.017,.06],[.285,.205,.395]);
      shoe.add(voxel,'#e65365',[0,.05,.14],[.27,.15,.245]);
      shoe.add(voxel,'#fff3e2',[0,-.086,.07],[.3,.05,.43]);
      shoe.add(voxel,'#272e40',[0,-.12,.07],[.294,.018,.42]);
      shoe.add(voxel,'#f5e7d6',[0,.025,.266],[.28,.137,.065]);
      shoe.add(voxel,'#782942',[0,.127,-.04],[.126,.027,.15]);
      for(let i=0;i<4;i++)shoe.add(voxel,'#fff4e1',[0,.13,.008+i*.043],[.15,.013,.013],[0,.14*(i%2?1:-1),0]);
      for(const x of [-.147,.147]){
        shoe.add(voxel,'#fff3df',[x,.042,-.015],[.01,.086,.12]);
        shoe.add(voxel,'#b43148',[x,.043,-.015],[.013,.049,.086]);
      }
      shoe.add(voxel,'#d64d60',[0,-.085,-.151],[.14,.04,.014]);shoe.finish(foot);
    }else{
      const stout=r.kind==='pudding',gold=stout?'#f0cb7a':'#f7d16b',shade=stout?'#d2aa60':'#dab359';
      new Part(mat,characterEdge).add(block,gold,[0,-.34,0],stout?[.43,.75,.48]:[.345,.75,.40]).finish(upper);
      new Part(mat,characterEdge).add(block,gold,[0,-.34,0],stout?[.39,.74,.425]:[.315,.74,.365])
        .add(cube,shade,[0,-.635,stout?.216:.186],[stout?.35:.28,.018,.008]).finish(lower);
      new Part(mat,characterEdge).add(block,gold,[0,.005,.083],stout?[.43,.235,.50]:[.345,.205,.435])
        .add(cube,shade,[0,stout?-.104:-.089,.093],[stout?.395:.316,.021,stout?.47:.405])
        .add(cube,stout?'#ffdda0':'#ffe199',[0,stout?.125:.11,.13],[stout?.36:.28,.009,stout?.30:.24]).finish(foot);
    }
    limbs.push({upper,lower,foot,x:side*.235});
  }
  const v1=new T.Vector3(),v2=new T.Vector3(),axis=new T.Vector3(0,-1,0),shoulder=new T.Vector3(),direction=new T.Vector3(),bendDirection=new T.Vector3(),elbow=new T.Vector3(),hips=new T.Vector3();
  const animate=(phase:number,standing=0,wheelAngle=phase*1.65)=>{
    wheels.forEach(w=>w.rotation.z=wheelAngle);
    for(const side of [-1,1]){const ear=body.getObjectByName(`ear-${side}`);if(ear)ear.rotation.z=Math.sin(phase*2+side)*.045;}
    const lift=standing*(.25+Math.cos(phase*2)*.012)+(1-standing)*Math.sin(phase*2)*.019;
    body.position.set(0,1.74+lift,-.42+standing*.36);body.rotation.x=standing*.24;
    hips.set(0,1.72+lift,-.42+standing*.36);
    arms.forEach(a=>{
      shoulder.copy(a.shoulder).applyEuler(body.rotation).add(body.position);
      direction.copy(a.hand).sub(shoulder);const distance=direction.length();direction.divideScalar(distance);
      const along=(.55*.55-.57*.57+distance*distance)/(2*distance),bend=Math.sqrt(Math.max(0,.55*.55-along*along));
      bendDirection.set(0,-1,0).addScaledVector(direction,-axis.dot(direction)).normalize();
      elbow.copy(shoulder).addScaledVector(direction,along).addScaledVector(bendDirection,bend);
      a.upper.position.copy(shoulder);a.lower.position.copy(elbow);
      v1.copy(elbow).sub(shoulder).normalize();v2.copy(a.hand).sub(elbow).normalize();
      a.upper.quaternion.setFromUnitVectors(axis,v1);a.lower.quaternion.setFromUnitVectors(axis,v2);
    });
    crankAssembly.rotation.x=phase+Math.PI;
    limbs.forEach((l,i)=>{
      const a=phase+i*Math.PI,fy=.83-Math.sin(a)*.235,fz=-.02+Math.cos(a)*.235,hy=hips.y,hz=hips.z,dy=fy-hy,dz=fz-hz,d=Math.sqrt(dy*dy+dz*dz),along=(.71*.71-.7*.7+d*d)/(2*d),bend=Math.sqrt(Math.max(0,.71*.71-along*along));
      const ky=hy+dy/d*along+dz/d*bend,kz=hz+dz/d*along-dy/d*bend;
      l.upper.position.set(l.x,hy,hz);l.lower.position.set(l.x,ky,kz);l.foot.position.set(l.x,fy,fz+.08);
      v1.set(0,ky-hy,kz-hz).normalize();v2.set(0,fy-ky,fz-kz).normalize();l.upper.quaternion.setFromUnitVectors(axis,v1);l.lower.quaternion.setFromUnitVectors(axis,v2);
      l.foot.rotation.x=Math.sin(a)*.08;
      pedals[i].position.set(l.x,fy-.095,fz);
    });
  };animate(0);return{root,body,wheels,hips,animate};
}
export interface TrafficCar{root:T.Group;wheels:T.Group[];velocity:number;phase:number}
function quad(points:number[][]) {
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>points[i]),3));
  g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,0,1,1,0,1],2));g.computeVertexNormals();return g;
}
// Exterior-facing panes sort independently. They never enter the 15 Hz shadow pass.
const carWindowMaterial=new T.MeshPhongMaterial({color:'#739ead',specular:'#94afb7',shininess:22,transparent:true,opacity:.43,depthWrite:false,depthTest:true,side:T.FrontSide});
const contactShadowMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'varying vec2 vShadowUv;void main(){vShadowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vShadowUv;void main(){vec2 p=(vShadowUv-.5)*2.;float a=(1.-smoothstep(.1,1.,dot(p,p)))*.28;gl_FragColor=vec4(.035,.055,.075,a);}'});
export function createCar(index:number,mat:T.Material,edge:T.Material):TrafficCar{
  const root=new T.Group(),p=new Part(mat,edge),type=index%4;
  const color=['#c83e56','#f0e9d7','#3263a5','#e2b446'][type],trim='#1d2c38',chrome='#cdd8db',van=type===1,taxi=type===3;
  root.userData.vehicle=['city-hatchback','kei-delivery-van','compact-wagon','japanese-taxi'][type];
  const contour=[[-1.99,.32],[-2.0,.66],[-1.72,.83],[1.38,.85],[1.91,.76],[2.01,.57],[1.99,.34],[1.67,.34]];
  for(let i=0;i<=16;i++){const a=i/16*Math.PI;contour.push([1.22+Math.cos(a)*.45,.37+Math.sin(a)*.45]);}
  contour.push([-.77,.34]);for(let i=0;i<=16;i++){const a=i/16*Math.PI;contour.push([-1.22+Math.cos(a)*.45,.37+Math.sin(a)*.45]);}
  contour.push([-1.98,.32]);const shell=profile(contour,1.7,.035);p.add(shell,color,[0,0,0],[1,1,1],[0,-Math.PI/2,0]);shell.dispose();
  const roofY=van?1.71:1.49,roofFront=van?1.36:.57,roofBack=van?-1.65:-.81,baseFront=van?1.79:1.22,baseBack=van?-1.78:-1.41,rx=van?.77:.675,bx=.857;
  // Cabin is a hollow frame: tinted individual panes reveal seats, the dashboard and the steering wheel.
  p.add(soft,color,[0,roofY+.004,(roofFront+roofBack)*.5],[rx*2+.08,.095,roofFront-roofBack+.13]);
  p.add(soft,trim,[0,.82,(baseFront+baseBack)*.5],[1.63,.065,baseFront-baseBack]);
  let paneIndex=0;
  const pane=(points:number[][])=>{
    const a=new T.Vector3(...points[0] as [number,number,number]),b=new T.Vector3(...points[1] as [number,number,number]),c=new T.Vector3(...points[2] as [number,number,number]);
    const normal=b.sub(a).cross(c.sub(a)),center=points.reduce((s,p)=>s.add(new T.Vector3(...p as [number,number,number])),new T.Vector3()).multiplyScalar(.25);center.y=0;
    if(normal.dot(center)<0)points.reverse();
    const mesh=new T.Mesh(quad(points),carWindowMaterial);mesh.name=`car-window-${paneIndex++}`;mesh.castShadow=mesh.receiveShadow=false;mesh.userData.ownedGeometry=true;root.add(mesh);
  };
  pane([[-bx,.865,baseFront],[bx,.865,baseFront],[rx,roofY-.06,roofFront],[-rx,roofY-.06,roofFront]]);
  pane([[bx,.87,baseBack],[-bx,.87,baseBack],[-rx,roofY-.06,roofBack],[rx,roofY-.06,roofBack]]);
  for(const side of [-1,1]){
    const x=side*bx,xr=side*rx;
    p.tube([x,.84,baseFront],[xr,roofY,roofFront],.037,color).tube([xr,roofY,roofFront],[xr,roofY,roofBack],.025,trim).tube([xr,roofY,roofBack],[x,.86,baseBack],.06,color);
    const center=van?-.1:-.18;
    p.tube([x,.845,center],[xr,roofY-.02,center-.04],.031,trim);
    pane([[x,.91,center+.045],[x,.91,baseFront-.085],[xr,roofY-.095,roofFront-.045],[xr,roofY-.095,center+.015]]);
    if(van){
      const panel=quad([[x,.85,baseBack+.015],[x,.85,center-.05],[xr,roofY-.045,center-.05],[xr,roofY-.045,roofBack+.015]]);
      p.add(panel,color,[0,0,0],[1,1,1]);panel.dispose();
      p.tube([side*.858,.878,-.45],[side*.769,1.658,-.45],.011,'#6b7f7e');
      p.tube([side*.858,.9,-1.46],[side*.769,1.655,-1.46],.008,'#a4afa7');
      for(let j=0;j<3;j++)p.tube([side*.849,1.185+j*.044,-1.385],[side*.84,1.185+j*.044,-1.04],.006,'#a2afa7');
      p.add(voxel,'#bd3747',[side*.835,1.44,-.95],[.019,.1,.55]);
      p.add(voxel,'#f1e9d8',[side*.846,1.44,-.95],[.009,.021,.35]);
    }else pane([[x,.91,baseBack+.11],[x,.91,center-.045],[xr,roofY-.095,center-.08],[xr,roofY-.095,roofBack+.09]]);
    p.tube([x,.875,baseBack],[x,.875,baseFront],.018,chrome);
    p.tube([side*.883,.835,baseFront-.16],[side*.883,.43,baseFront-.21],.007,'#263d51');
    p.tube([side*.883,.81,center],[side*.883,.39,center],.007,'#263d51');
    p.tube([side*.883,.4,center],[side*.883,.4,baseBack+.15],.007,'#263d51');
    p.tube([side*.883,.8,baseBack+.09],[side*.883,.4,baseBack+.15],.007,'#263d51');
    for(const z of [center+.22,baseBack+.26]){
      p.add(soft,trim,[side*.889,.754,z],[.015,.047,.22]);p.add(soft,chrome,[side*.902,.765,z+.017],[.024,.03,.16]);
      p.add(rod,'#89989d',[side*.919,.747,z-.072],[.012,.01,.012],[0,0,Math.PI/2]);
    }
    p.tube([side*.84,1.005,baseFront-.12],[side*1.02,1.04,baseFront-.17],.025,trim);
    p.add(soft,color,[side*1.033,1.065,baseFront-.19],[.24,.127,.25]);
    p.add(soft,'#a7c3c8',[side*1.033,1.066,baseFront-.319],[.188,.081,.009]);
    p.add(soft,trim,[side*.87,.298,0],[.07,.085,1.56]);
    p.tube([side*.883,.565,-1.64],[side*.883,.565,1.64],.016,color);
    // Rounded, flared wheel arches follow each tyre instead of intersecting a rectangular body.
    for(const z of [-1.22,1.22])for(let j=0;j<18;j++){
      const a=j/18*Math.PI,q=(j+1)/18*Math.PI;
      p.tube([side*.876,.37+Math.sin(a)*.455,z+Math.cos(a)*.455],[side*.876,.37+Math.sin(q)*.455,z+Math.cos(q)*.455],.019,trim);
      p.tube([side*.87,.38+Math.sin(a)*.495,z+Math.cos(a)*.495],[side*.87,.38+Math.sin(q)*.495,z+Math.cos(q)*.495],.015,color);
    }
    p.add(voxel,'#f0ab42',[side*.883,.78,1.51],[.015,.036,.09]);
    p.add(voxel,'#ff5258',[side*.883,.65,-1.855],[.022,.12,.13]);
    for(const z of [-.62,.38]){
      p.add(soft,trim,[side*.39,.935,z],[.47,.16,.52]);
      p.add(soft,'#354a53',[side*.39,1.115,z-.19],[.43,.44,.13],[.1,0,0]);
      p.add(soft,'#4a5b61',[side*.39,1.365,z-.19],[.23,.13,.09]);
    }
  }
  p.add(soft,trim,[0,.94,baseFront-.11],[1.39,.16,.27]);
  p.add(voxel,'#668392',[0,1.039,baseFront-.23],[.25,.012,.09]);
  p.add(smallRing,'#131f2d',[.39,1.14,baseFront-.35],[.115,.115,.115],[.85,0,0]);
  p.tube([.39,1.1,baseFront-.35],[.39,.94,baseFront-.14],.025,'#25313b');
  p.add(soft,color,[0,.832,(baseFront+1.99)*.5],[1.63,.047,Math.max(.13,1.99-baseFront)]);
  for(const x of [-.69,.69])p.tube([x,.848,baseFront+.04],[x,.803,1.87],.006,'#713e46');
  p.add(soft,color,[0,.823,(baseBack-1.99)*.5],[1.63,.04,Math.max(.1,1.99+baseBack)]);
  // Layered optics, daytime light signatures, lower intakes, grille slats and embossed registration plate.
  for(const side of [-1,1]){
    p.add(soft,trim,[side*.623,.705,1.96],[.405,.167,.073]);
    p.add(soft,'#e9eddd',[side*.623,.719,2.0],[.35,.105,.031]);
    for(const x of [side*.52,side*.71])p.add(rod,'#fcf6d7',[x,.724,2.022],[.047,.014,.047],[Math.PI/2,0,0]);
    p.add(voxel,'#c2edf1',[side*.625,.769,2.028],[.3,.012,.009]);
    p.add(voxel,'#eda74c',[side*.785,.717,2.024],[.036,.07,.011]);
    p.add(soft,trim,[side*.66,.65,-1.993],[.333,.224,.071]);
    p.add(soft,'#bf183e',[side*.66,.69,-2.034],[.287,.097,.027]);
    p.add(soft,'#e86c71',[side*.66,.618,-2.039],[.287,.035,.014]);
    p.add(voxel,'#ffedd3',[side*.591,.653,-2.046],[.098,.025,.009]);
    p.add(voxel,'#c9ecdd',[side*.714,.749,-2.038],[.133,.014,.009]);
    p.add(soft,trim,[side*.678,.43,2.003],[.3,.087,.027]);
    p.add(rod,'#e2e5d1',[side*.678,.43,2.025],[.033,.012,.033],[Math.PI/2,0,0]);
  }
  p.add(soft,trim,[0,.682,2.014],[.708,.178,.027]);
  for(let i=0;i<6;i++)p.add(voxel,chrome,[0,.615+i*.023,2.036],[.65,.009,.01]);
  p.add(rod,chrome,[0,.755,2.048],[.036,.011,.036],[Math.PI/2,0,0]);
  p.add(voxel,trim,[0,.758,2.057],[.01,.036,.007]);
  p.add(soft,trim,[0,.367,1.978],[1.62,.078,.13]);
  p.add(soft,chrome,[0,.514,2.017],[1.61,.049,.037]);
  p.add(soft,trim,[0,.38,-1.98],[1.61,.085,.123]);
  p.add(soft,chrome,[0,.504,-2.003],[1.58,.048,.033]);
  for(const z of [2.046,-2.045]){
    p.add(voxel,'#edf0d8',[0,.516,z],[.385,.127,.014]);
    for(let i=0;i<4;i++)p.add(voxel,'#3b5d45',[-.115+i*.066,.518,z+(z>0?.009:-.009)],[.029,.045,.005]);
    p.add(voxel,'#3b5d45',[0,.555,z+(z>0?.009:-.009)],[.127,.011,.005]);
  }
  p.tube([-.55,.902,baseFront-.012],[-.07,.938,baseFront-.074],.012,trim).tube([.05,.899,baseFront-.012],[.54,.942,baseFront-.074],.012,trim);
  p.add(rod,chrome,[-.59,.268,-1.97],[.048,.19,.048],[Math.PI/2,0,0]);
  if(taxi){
    p.add(soft,'#f5ead1',[0,roofY+.18,-.03],[.45,.26,.22]);
    p.add(voxel,'#278765',[0,roofY+.18,.086],[.33,.095,.015]);
    for(const side of [-1,1])p.add(voxel,'#faf0d7',[side*.885,.645,-.2],[.013,.115,1.82]);
  }
  if(van){
    for(const side of [-1,1]){
      p.add(voxel,'#aa3441',[side*.879,.66,-.67],[.015,.17,.65]);
      p.add(voxel,'#f4e5c2',[side*.89,.664,-.67],[.009,.035,.42]);
      p.tube([side*.882,.61,-1.14],[side*.882,.61,.04],.009,'#a2afa9');
    }
  }
  if(type===2){for(const x of [-.51,.51])p.add(soft,trim,[x,roofY+.072,-.15],[.06,.045,1.3]);}
  p.finish(root);
  const contact=new T.Mesh(new T.PlaneGeometry(2.3,4.38),contactShadowMaterial);contact.rotation.x=-Math.PI/2;contact.position.y=.026;contact.userData.ownedGeometry=true;root.add(contact);
  const wheels:T.Group[]=[];
  for(const x of [-.88,.88])for(const z of [-1.22,1.22]){
    const mount=new T.Group(),w=new T.Group();mount.position.set(x,.38,z);mount.rotation.z=Math.PI/2;mount.add(w);root.add(mount);
    const q=new Part(mat),out=x>0?-.1:.1;
    q.add(carTyre,'#172029',[0,0,0],[.377,.205,.377]);
    q.add(carTyre,'#303740',[0,out,0],[.32,.012,.32]);
    q.add(carTyre,'#192737',[0,out*1.075,0],[.265,.015,.265]);
    q.add(smallRing,chrome,[0,out*1.16,0],[.268,.268,.268],[Math.PI/2,0,0]);
    q.add(carTyre,'#8a959c',[0,out*.83,0],[.223,.008,.223]);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;q.tube([Math.cos(a)*.055,out*1.15,Math.sin(a)*.055],[Math.cos(a+.13)*.239,out*1.15,Math.sin(a+.13)*.239],.014,chrome);
      q.tube([Math.cos(a+.12)*.071,out*1.15,Math.sin(a+.12)*.071],[Math.cos(a+.19)*.232,out*1.15,Math.sin(a+.19)*.232],.01,'#879dad');
    }
    q.add(carTyre,chrome,[0,out*1.22,0],[.066,.025,.066]);
    q.add(carTyre,'#456078',[0,out*1.37,0],[.026,.006,.026]);
    for(let i=0;i<5;i++){const a=i*Math.PI*.4;q.add(carTyre,'#e4e7dc',[Math.cos(a)*.052,out*1.365,Math.sin(a)*.052],[.012,.008,.012]);}
    for(let i=0;i<36;i++){
      const a=i*Math.PI/18;q.add(voxel,'#333c42',[Math.cos(a)*.375,0,Math.sin(a)*.375],[.016,.09,.025],[0,-a,0]);
    }
    q.finish(w);wheels.push(w);
  }
  return{root,wheels,velocity:index%2?7+index:-(5+index),phase:0};
}
export interface Walker{root:T.Group;legs:T.Group[];arms:T.Group[];umbrella:T.Group;phase:number;velocity:number}
export function createWalker(index:number,mat:T.Material,edge:T.Material):Walker{
  const root=new T.Group(),p=new Part(mat,edge),colors=['#ff93b1','#5476b4','#a5cbbf','#ffce79','#b4a0cb','#e9effb'],skin=index%2?'#e9b693':'#f5c9a3',hair=index%3?'#3b293b':'#9c6457';
  p.add(jacket,colors[index%6],[0,1.04,0],[.7,.62,.72]).add(soft,skin,[0,1.62,.03],[.63,.61,.54]).add(soft,hair,[0,1.85,-.03],[.65,.23,.59]);
  for(const x of [-.26,.26])p.add(soft,hair,[x,1.62,-.12],[.12,.36,.38]);for(const x of [-.13,.13])p.add(soft,'#142442',[x,1.62,.311],[.038,.075,.014]);
  p.add(soft,'#c16772',[0,1.5,.31],[.075,.025,.014]).add(soft,'#faf4de',[0,1.19,.175],[.09,.32,.03]);
  p.add(soft,'#293451',[-.27,.98,-.16],[.22,.38,.25]).tube([-.22,1.29,.19],[.15,.77,.19],.019,'#293451');p.finish(root);
  const legs:T.Group[]=[],arms:T.Group[]=[];for(const side of [-1,1]){
    const l=new T.Group();l.position.set(side*.13,.8,0);root.add(l);new Part(mat).add(taper,'#26334e',[0,-.3,0],[.087,.6,.09]).add(soft,'#f3eff5',[0,-.65,.075],[.18,.1,.27]).finish(l);legs.push(l);
    const a=new T.Group();a.position.set(side*.27,1.25,0);root.add(a);new Part(mat).add(taper,colors[index%6],[0,-.2,0],[.077,.4,.08]).add(ball,skin,[0,-.43,0],[.071,.08,.065]).finish(a);arms.push(a);
  }
  const umbrella=new T.Group();umbrella.position.set(.22,0,.11);root.add(umbrella);const u=new Part(mat);u.add(cone,colors[(index+2)%6],[0,2.3,0],[.8,1,.8]).tube([0,1.15,0],[0,2.53,0],.014,'#dfeaff');
  for(let i=0;i<8;i++)u.tube([0,2.51,0],[Math.cos(i*Math.PI/4)*.78,2.08,Math.sin(i*Math.PI/4)*.78],.009,'#c4d1e5');u.finish(umbrella);umbrella.visible=false;
  root.scale.setScalar(.92);return{root,legs,arms,umbrella,phase:index*1.7,velocity:index%2?.85:-.65};
}
