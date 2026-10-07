import * as T from 'three';
import {Part} from './models';

const box=new T.BoxGeometry(1,1,1),rod=new T.CylinderGeometry(1,1,1,16),ball=new T.SphereGeometry(1,16,10),ring=new T.TorusGeometry(1,.045,6,32);
const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.3,.25,-.25,.7,0,1);leafShape.bezierCurveTo(.25,.7,.3,.25,0,0);
const leaf=new T.ShapeGeometry(leafShape,8);
export const SHOP_TYPES=['タピオカ茶房','しゃぶしゃぶ鍋屋','青葉書房','ミナトレコード','星空キネマ','青空マルシェ','夕凪ラーメン','こむぎベーカリー'];
const THEMES=[
  {name:SHOP_TYPES[0],en:'KASUGA TEA ROOM',color:'#d27866',sign:'#f8e3ba',ink:'#793f33',menu:['黒糖ミルク / ¥480','抹茶ラテ / ¥520','桃のウーロン / ¥460']},
  {name:SHOP_TYPES[1],en:'NABE & SAKE',color:'#70534b',sign:'#7e2636',ink:'#fff0d3',menu:['お昼の鍋定食 / ¥980','季節の野菜 / ¥480','本日のお酒 / ¥600']},
  {name:SHOP_TYPES[2],en:'AOBA BOOKS · SINCE 1986',color:'#b7bfa5',sign:'#224e4a',ink:'#f4e6bb',menu:['新刊・文庫・雑誌','旅の本と暮らしの本','本日、営業しています']},
  {name:SHOP_TYPES[3],en:'VINYL / CD / GOOD MUSIC',color:'#768fa1',sign:'#153955',ink:'#f4c170',menu:['CITY POP / JAZZ','新着レコードあります','OPEN 11:00 — 21:00']},
  {name:SHOP_TYPES[4],en:'HOSHIZORA CINEMA',color:'#aa665d',sign:'#263e64',ink:'#f5d98c',menu:['海辺の夏 · 13:30','夜行列車 · 16:00','星に手をのばす · 19:30']},
  {name:SHOP_TYPES[5],en:'AOZORA MARCHÉ · 24H',color:'#e7ddc7',sign:'#237c62',ink:'#fff4d8',menu:['できたておにぎり','冷たいドリンク','いつでも、おかえり。']},
  {name:SHOP_TYPES[6],en:'YUNAGI RAMEN',color:'#ceb491',sign:'#274d64',ink:'#fff0d2',menu:['醤油ラーメン / ¥780','味噌ラーメン / ¥850','ぎょうざ / ¥380']},
  {name:SHOP_TYPES[7],en:'KOMUGI · BREAD & COFFEE',color:'#e1c19c',sign:'#884e38',ink:'#fff0cd',menu:['焼きたてクロワッサン','塩バターパン / ¥180','珈琲と、ひと休み。']}
];
function shopAtlas(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;const c=canvas.getContext('2d')!;
  THEMES.forEach((t,row)=>{for(let col=0;col<4;col++){
    c.save();c.translate(col*512,row*256);c.fillStyle=col===1?'#e9dac2':t.sign;c.fillRect(0,0,512,256);
    c.textAlign='center';c.textBaseline='middle';
    if(col===0){
      c.strokeStyle=t.ink;c.lineWidth=3;c.strokeRect(17,17,478,222);c.fillStyle=t.ink;
      c.font='700 59px "Yu Gothic", "Microsoft YaHei", sans-serif';c.fillText(t.name,256,103,455);
      c.font='600 21px sans-serif';c.fillText(t.en,256,167,450);c.font='600 18px sans-serif';c.fillText('·  商 い 中  ·',256,214);
    }else if(col===2){
      c.fillStyle=t.ink;c.font='700 24px "Yu Gothic",sans-serif';c.fillText('— 本日のおすすめ —',256,43);
      c.font='500 28px "Yu Gothic",sans-serif';t.menu.forEach((text,i)=>c.fillText(text,256,103+i*52,458));
    }else if(col===3){
      c.fillStyle=t.ink;c.font='700 72px "Yu Gothic",sans-serif';c.fillText(row===4?'上映中':'営業中',256,97);
      c.font='600 26px sans-serif';c.fillText(row===4?'NOW SHOWING':'WELCOME / OPEN',256,172);
      c.fillRect(116,208,280,3);
    }else{
      // Original miniature shop illustrations and film sleeves share one atlas with all Japanese lettering.
      c.fillStyle=['#e2ad95','#9b393c','#577f76','#d5a44d','#385f89','#8aafa0','#b55339','#c19866'][row];c.fillRect(18,18,476,220);
      c.fillStyle='#f4dfaa';c.beginPath();c.arc(385,70,42,0,Math.PI*2);c.fill();
      if(row===0){
        c.fillStyle='#f7e5c8';c.fillRect(213,63,94,135);c.fillStyle='#9a6c47';c.fillRect(217,105,86,90);c.fillStyle='#402e29';for(let i=0;i<9;i++){c.beginPath();c.arc(231+i%3*26,150+Math.floor(i/3)*14,6,0,Math.PI*2);c.fill();}c.fillStyle='#f6f2df';c.fillRect(206,61,108,12);c.fillStyle='#316b6c';c.fillRect(278,32,10,83);
      }else if(row===3){
        c.fillStyle='#192e43';c.beginPath();c.arc(246,119,88,0,Math.PI*2);c.fill();c.strokeStyle='#5c686c';c.lineWidth=2;for(let i=0;i<6;i++){c.beginPath();c.arc(246,119,48+i*6,0,Math.PI*2);c.stroke();}c.fillStyle='#de7552';c.beginPath();c.arc(246,119,30,0,Math.PI*2);c.fill();c.fillStyle='#f5e6ba';c.fillRect(240,115,12,8);
      }else if(row===2){
        for(let i=0;i<5;i++){c.fillStyle=['#daa45e','#db785b','#acc3b0','#eed8a1','#516e87'][i];c.save();c.translate(163+i*43,120);c.rotate((i-2)*.05);c.fillRect(-18,-73,34,139);c.fillStyle='#f9e6bf';c.fillRect(-14,-45,27,4);c.restore();}
      }else if(row===4){
        c.fillStyle='#e5b28b';c.fillRect(18,172,476,66);c.fillStyle='#1b354a';c.beginPath();c.moveTo(18,182);c.quadraticCurveTo(210,100,494,177);c.lineTo(494,203);c.lineTo(18,202);c.fill();
        for(let i=0;i<3;i++){c.fillStyle=['#f0d5b0','#d98a70','#709aaf'][i];c.beginPath();c.ellipse(159+i*78,107+i*11,20,33,0,0,Math.PI*2);c.fill();c.fillRect(144+i*78,131+i*11,35,45);}
      }else{
        c.fillStyle='#f3dfad';c.beginPath();c.ellipse(260,140,104,44,0,0,Math.PI*2);c.fill();c.fillStyle=row===7?'#ac713d':'#c47543';c.beginPath();c.ellipse(260,126,80,32,0,0,Math.PI*2);c.fill();c.strokeStyle='#fbefd5';c.lineWidth=7;for(let i=0;i<4;i++){c.beginPath();c.moveTo(225+i*25,110);c.lineTo(212+i*25,130);c.stroke();}
      }
      c.fillStyle='#fff0ce';c.font='700 27px "Yu Gothic",sans-serif';c.fillText(row===4?'海辺の夏':t.en.split(' · ')[0],256,220,440);
    }
    c.restore();
  }});
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  return new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,toneMapped:false});
}
function labelGeometry(row:number,col:number){
  const g=new T.PlaneGeometry(1,1),uv=g.getAttribute('uv');
  for(let i=0;i<uv.count;i++)uv.setXY(i,(col+.012+uv.getX(i)*.976)/4,(7-row+.015+uv.getY(i)*.97)/8);
  return g;
}
const LABELS=THEMES.map((_,row)=>[0,1,2,3].map(col=>labelGeometry(row,col)));

/** Open-front shops are actual rooms. Geometry and all signage are merged per recycled block. */
export class TownWorld {
  private labels:T.MeshBasicMaterial;private windows=new T.MeshPhongMaterial({color:'#a3cfdb',transparent:true,opacity:.13,depthWrite:false,shininess:70,side:T.DoubleSide,vertexColors:true});
  private steamMaterial=new T.MeshBasicMaterial({color:'#fff1dc',transparent:true,opacity:.19,depthWrite:false});
  private steam:{mesh:T.InstancedMesh,x:number,z:number}[]=[];private dummy=new T.Object3D();private shopCount=0;private night={value:0};private shopMaterial:T.Material;
  constructor(mat:T.Material,private edge:T.Material,private glow?:T.Material){
    this.labels=shopAtlas();this.shopMaterial=mat.clone();
    const lantern=new T.Color('#b9413d');
    this.shopMaterial.onBeforeCompile=(shader,renderer)=>{
      mat.onBeforeCompile(shader,renderer);shader.uniforms.uShopNight=this.night;
      shader.vertexShader='varying float vShopRoom;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvShopRoom=step(-11.08,position.x)*(1.-step(-6.83,position.x))*(1.-step(2.9,position.y));');
      shader.fragmentShader='varying float vShopRoom;uniform float uShopNight;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * vec3(1.,.77,.51)*vShopRoom*(.11+uShopNight*.82);\nfloat lanternGlow=1.-step(.018,distance(vColor.rgb,vec3(${lantern.r},${lantern.g},${lantern.b})));\ntotalEmissiveRadiance += vec3(1.,.19,.045)*lanternGlow*uShopNight*.75;`);
    };
    this.shopMaterial.customProgramCacheKey=()=> 'open-japanese-shops-v2';
  }
  configure(time:string){this.night.value=time==='night'?1:time==='sunset'?.35:0;}
  reset(){this.steam=[];this.shopCount=0;}
  populate(group:T.Group,seed:number){
    const p=new Part(this.shopMaterial,this.edge),text=new Part(this.labels),glass=new Part(this.windows);
    for(let i=0;i<4;i++)this.shop(p,text,glass,group,(seed*4+i)%8,-12+i*8);
    p.finish(group);const signs=text.finish(group);signs.castShadow=signs.receiveShadow=false;
    const windows=glass.finish(group);windows.castShadow=false;
    if(this.glow){
      const light=new Part(this.glow),plane=new T.PlaneGeometry(1,1);
      for(let i=0;i<4;i++)light.add(plane,'#ffffff',[-5.54,.247,-12+i*8],[2.21,5.45,1],[-Math.PI/2,0,0]);
      plane.dispose();const spill=light.finish(group);spill.castShadow=spill.receiveShadow=false;spill.userData.nightGlow=true;
    }
  }
  private label(text:Part,type:number,col:number,x:number,y:number,z:number,w:number,h:number){text.add(LABELS[type][col],'#ffffff',[x,y,z],[w,h,1],[0,Math.PI/2,0]);}
  private cup(p:Part,x:number,y:number,z:number,color:string){
    p.add(rod,'#f5dfb7',[x,y+.135,z],[.076,.25,.076]).add(rod,color,[x,y+.14,z],[.078,.16,.078]);
    p.add(rod,'#f7f1db',[x,y+.269,z],[.089,.024,.089]).tube([x+.024,y+.27,z],[x+.04,y+.42,z],.009,'#324752');
    for(let i=0;i<5;i++)p.add(ball,'#362922',[x+Math.cos(i*1.25)*.056,y+.045+i%2*.026,z+Math.sin(i*1.25)*.057],[.015,.016,.015]);
  }
  private shelf(p:Part,x:number,y:number,z:number,w:number,rows:number,color:string){
    p.add(box,color,[x-.13,y+(rows-1)*.4,z],[.055,rows*.43,w]);
    for(const dz of [-w/2,w/2])p.add(box,color,[x,y+(rows-1)*.4,z+dz],[.36,rows*.43,.055]);
    for(let i=0;i<=rows;i++)p.add(box,color,[x,y-.2+i*.42,z],[.35,.045,w]);
  }
  private barista(p:Part,x:number,z:number,type:number){
    p.add(box,'#f3dbb0',[x,1.875,z],[.3,.34,.29]);p.add(box,'#443130',[x,2.035,z],[.33,.085,.32]);
    p.add(box,'#faf0da',[x,1.53,z],[.34,.4,.32]);p.add(box,type===0?'#8b5550':'#224c53',[x+.17,1.51,z],[.018,.32,.28]);
    for(const dz of [-.08,.08])p.add(box,'#322f36',[x+.157,1.92,z+dz],[.013,.049,.024]);
    for(const side of [-1,1])p.tube([x,1.68,z+side*.22],[x+.3,1.35,z+side*.2],.055,'#f5dcba');
    p.add(box,'#f8e1b5',[x+.325,1.36,z+.18],[.14,.09,.13]);
  }
  private shop(p:Part,text:Part,glass:Part,group:T.Group,type:number,z:number){
    this.shopCount++;const t=THEMES[type],front=-6.62,back=-10.95,x=(front+back)/2,height=type===4?8.1:type===3?6.4:5.65+(type%3)*.63;
    const wood=type===1?'#573c32':type===3?'#374455':'#8b654d',cream='#f1e4cc',w=6.7;
    // No facade box across the ground floor: side walls, back wall and a ceiling surround the shop interior.
    p.add(box,'#b49677',[x,.2,z],[4.4,.22,w]);p.add(box,type===4?'#802f42':'#d8bf9c',[x,.327,z],[4.26,.024,6.42]);
    p.add(box,t.color,[back,1.79,z],[.22,2.95,w]);
    for(const dz of [-3.25,3.25])p.add(box,t.color,[x,1.83,z+dz],[4.35,3.03,.2]);
    p.add(box,t.color,[x,(height+3.14)*.5,z],[4.35,height-3.14,w]);
    p.add(box,cream,[x,height+.09,z],[4.55,.18,6.91]);
    p.add(box,'#81908e',[x,height+.22,z],[4.4,.11,6.8]);
    for(const dz of [-3.28,3.28])p.add(box,'#c9c7b6',[x,height+.43,z+dz],[4.4,.38,.1]);
    p.add(rod,'#afbab4',[x-.62,height+.61,z+1.94],[.42,.67,.42]);p.add(rod,'#d6dac9',[x-.62,height+.96,z+1.94],[.46,.065,.46]);
    p.tube([x-.62,height+.65,z+1.94],[x-.2,height+.65,z+1.94],.026,'#647b7b');
    for(const dz of [-3.02,3.02]){
      p.add(box,wood,[front+.017,1.58,z+dz],[.23,2.57,.19]);
      p.add(box,'#cbb18c',[front+.15,1.6,z+dz],[.022,2.6,.027]);
    }
    p.add(box,wood,[front+.013,2.78,z],[.23,.22,6.21]);
    p.add(box,wood,[front+.01,.36,z],[.24,.085,6.22]);
    // A partly opened glass door and wide shop windows; thin reflections leave the merchandise visible.
    glass.add(box,'#ffffff',[front+.055,1.56,z+.94],[.016,2.19,3.47]);
    for(const dz of [-.79,1.03,2.72])p.add(box,wood,[front+.077,1.56,z+dz],[.04,2.2,.042]);
    glass.add(box,'#ffffff',[front+.035,1.56,z-2.2],[.015,2.16,1.02],[0,-.34,0]);
    p.add(box,wood,[front+.083,1.55,z-1.63],[.063,2.27,.058]);
    p.add(box,wood,[front+.13,2.63,z-2.14],[.06,.069,1.11],[0,-.34,0]);
    p.add(box,wood,[front+.13,.45,z-2.14],[.06,.069,1.11],[0,-.34,0]);
    p.tube([front+.32,1.02,z-1.85],[front+.32,1.36,z-1.85],.022,'#d6c99d');
    p.add(box,'#f1d391',[front+.15,.27,z-2.17],[.52,.12,1.18]);
    // Warm ceiling luminaires are modelled inside each room.
    for(const dz of [-1.1,1.1]){
      p.add(rod,'#4d4e47',[x+.35,2.855,z+dz],[.13,.07,.13]);
      p.add(rod,'#f5df9a',[x+.35,2.808,z+dz],[.17,.032,.17]);
    }
    this.label(text,type,2,back+.135,2.08,z,4.05,.91);
    this.label(text,type,3,front+.135,1.94,z-2.15,.79,.36);
    if(type!==4){
      p.add(box,wood,[front+.13,3.34,z],[.3,.86,6.12]);
      this.label(text,type,0,front+.293,3.35,z,5.89,.75);
      // Layered eaves, fabric awnings and scalloped valances establish a Japanese shopping street.
      const cloth=type===1?'#8e303c':type===3?'#304d65':type===2?'#355b4d':type===7?'#a9744f':'#f4dab1';
      p.add(box,cloth,[front+.43,2.88,z],[.89,.12,6.37],[0,0,-.13]);
      p.add(box,cloth,[front+.868,2.727,z],[.056,.22,6.37]);
      for(let i=0;i<15;i++){
        p.add(box,i%2?cloth:'#ebd7b3',[front+.445,2.928,z-3.1+i*.44],[.88,.019,.058],[0,0,-.13]);
        p.add(rod,cloth,[front+.867,2.642,z-3.07+i*.437],[.119,.048,.119],[0,0,Math.PI/2]);
      }
    }
    if(type===0){
      p.add(box,'#a16752',[x+.6,.77,z+.48],[.8,.86,3.57]);p.add(box,'#f2ddbc',[x+.6,1.214,z+.48],[.94,.072,3.7]);
      for(let i=0;i<6;i++)this.cup(p,x+.77,1.25,z-.9+i*.51,['#b68f4a','#9caf64','#d9a487'][i%3]);
      p.add(box,'#243b47',[x+.6,1.41,z-1.23],[.18,.27,.27],[0,0,.22]);p.add(box,'#8bcbd2',[x+.72,1.42,z-1.23],[.019,.18,.2],[0,0,.22]);
      this.barista(p,x-.22,z+.1,type);
      this.shelf(p,back+.55,.85,z+.8,2.8,3,'#b27d5c');
      for(let row=0;row<3;row++)for(let i=0;i<6;i++)p.add(rod,['#f7dfb0','#bb825d','#708f74'][i%3],[back+.71,.7+row*.42,z-.35+i*.45],[.08,.26,.08]);
      p.add(rod,'#ecd5ab',[front+.17,3.41,z-3.23],[.275,.65,.275]);p.add(rod,'#fff3da',[front+.17,3.766,z-3.23],[.315,.046,.315]);
      p.tube([front+.17,3.76,z-3.12],[front+.15,4.13,z-3.12],.024,'#236f77');
      for(let i=0;i<8;i++)p.add(ball,'#4b3027',[front+.37,3.23+i%2*.05,z-3.38+(i%4)*.09],[.04,.04,.04]);
      p.add(box,'#b18465',[front+.65,.57,z+2.42],[.44,.63,.75]);
      this.label(text,type,1,front+.882,.67,z+2.42,.63,.48);
    }else if(type===1||type===6){
      for(const dz of [-1.63,.37,2.05]){
        p.add(rod,'#825139',[x+.4,.74,z+dz],[.54,.065,.54]);p.add(rod,'#4c3c36',[x+.4,.495,z+dz],[.065,.49,.065]);
        p.add(rod,'#bec7c0',[x+.4,.805,z+dz],[.205,.065,.205]);p.add(rod,'#97562b',[x+.4,.849,z+dz],[.172,.015,.172]);
        p.add(ring,'#d7ddd0',[x+.4,.868,z+dz],[.19,.19,.19],[Math.PI/2,0,0]);
        for(let i=0;i<6;i++)p.add(ball,i%2?'#73a052':'#e0a781',[x+.4+Math.cos(i)*.12,.86,z+dz+Math.sin(i)*.12],[.053,.018,.036]);
        for(const side of [-1,1]){
          p.add(rod,'#6b4935',[x+.42,.49,z+dz+side*.72],[.22,.05,.22]);
          p.add(rod,'#342c2b',[x+.42,.36,z+dz+side*.72],[.04,.32,.04]);
          p.add(rod,'#e8e3d3',[x+.74,.835,z+dz+side*.25],[.085,.047,.085]);
          p.tube([x+.72,.825,z+dz+side*.31],[x+.92,.825,z+dz+side*.31],.005,'#472e23');
        }
        if(type===1){const steam=new T.InstancedMesh(ball,this.steamMaterial,5);steam.userData.ownedGeometry=false;steam.frustumCulled=false;group.add(steam);this.steam.push({mesh:steam,x:x+.4,z:z+dz});}
      }
      for(const dz of [-2.46,1.68,2.58]){
        p.add(ball,'#b9413d',[front+.83,2.34,z+dz],[.211,.33,.211]);
        p.add(rod,'#392e32',[front+.83,2.677,z+dz],[.14,.038,.14]);p.add(rod,'#392e32',[front+.83,2.007,z+dz],[.115,.037,.115]);
        for(let j=0;j<7;j++)p.add(ring,'#953137',[front+.83,2.1+j*.077,z+dz],[.205,.205,.205],[Math.PI/2,0,0]);
      }
      for(let i=0;i<4;i++)p.add(box,type===1?'#793a38':'#315465',[front+.22,2.336,z-1.47+i*.69],[.026,.59,.66]);
      this.label(text,type,3,front+.25,2.35,z-.44,2.5,.44);
      this.barista(p,back+.62,z-2.4,type);
    }else if(type===2){
      for(const sz of [-1.42,1.52]){
        this.shelf(p,x-.65,.74,z+sz,2.64,4,'#6d4e3d');
        for(let row=0;row<4;row++)for(let col=0;col<16;col++){
          const zz=z+sz-1.14+col*.147,y=.69+row*.42,h=.25+(col%3)*.036;
          p.add(box,['#668989','#d4b76c','#d58065','#d9d5ad','#526e87'][col%5],[x-.52,y,zz],[.23,h,.12]);
          p.add(box,'#f1e1ba',[x-.397,y+.06,zz],[.009,.015,.071]);
          p.add(box,'#e1d4b1',[x-.514,y+h*.5,zz],[.195,.018,.096]);
        }
      }
      p.add(box,'#927253',[front+.53,.93,z+.81],[.6,1.26,1.35]);
      for(let row=0;row<3;row++)for(let j=0;j<3;j++){
        p.add(box,['#4c7b78','#d99764','#7498a1'][j],[front+.873,.52+row*.41,z+.31+j*.49],[.043,.34,.43],[0,0,-.14]);
        this.label(text,type,1,front+.898,.52+row*.41,z+.31+j*.49,.35,.25);
      }
      p.add(box,wood,[x+1,.7,z-1],[.91,.07,1.75]);
      for(let i=0;i<4;i++)p.add(box,['#b87453','#78897a'][i%2],[x+1,.755+i*.045,z-.9],[.57,.041,.65]);
      this.barista(p,x-.8,z-2.76,type);
    }else if(type===3){
      this.shelf(p,back+.5,.75,z+.58,4.69,4,'#3d5060');
      for(let row=0;row<4;row++)for(let j=0;j<13;j++){
        const zz=z-1.61+j*.343,y=.73+row*.42;
        p.add(box,['#daa165','#779b9e','#cb765c','#e8d9ae'][j%4],[back+.665,y,zz],[.046,.29,.28]);
        this.label(text,type,1,back+.69,y,zz,.255,.265);
      }
      for(const dz of [-1.02,.26,1.54]){
        p.add(box,'#b38e65',[x+.88,.86,z+dz],[.87,.84,1.09]);
        p.add(box,'#e7cd9e',[x+.88,1.298,z+dz],[.99,.059,1.18]);
        for(let j=0;j<6;j++){
          p.add(box,['#ecb477','#a2b6aa','#bf6956'][j%3],[x+.6+j*.102,1.45,z+dz],[.031,.32,.68],[0,0,-.17]);
        }
        this.label(text,type,1,x+1.025,1.457,z+dz,.61,.29);
      }
      for(const dz of [-2.59,2.59]){
        p.add(box,'#263740',[front-.16,.92,z+dz],[.33,1.13,.4]);
        for(const y of [.72,1.19])p.add(rod,'#1b2630',[front+.015,y,z+dz],[.13,.03,.13],[0,0,Math.PI/2]);
        p.add(rod,'#6d8088',[front+.038,.72,z+dz],[.064,.014,.064],[0,0,Math.PI/2]);
      }
      p.add(rod,'#172b3a',[front+.34,4.424,z],[.54,.041,.54],[0,0,Math.PI/2]);
      p.add(rod,'#e7a266',[front+.365,4.424,z],[.19,.044,.19],[0,0,Math.PI/2]);
      p.add(ring,'#567481',[front+.39,4.424,z],[.39,.39,.39],[0,Math.PI/2,0]);
    }else if(type===4){
      p.add(box,'#253e56',[front+.12,3.68,z],[.89,1.28,6.6]);
      p.add(box,'#d6b77c',[front+.6,4.338,z],[1.23,.1,6.83]);
      p.add(box,'#d6b77c',[front+.6,3.023,z],[1.23,.1,6.83]);
      this.label(text,type,0,front+.587,3.71,z,6.36,1.04);
      for(let i=0;i<25;i++)for(const y of [3.145,4.219])p.add(ball,'#f5df9a',[front+.61,y,z-3.01+i*.251],[.038,.038,.038]);
      for(let i=0;i<3;i++){
        const zz=z-2.05+i*2.05;p.add(box,'#dcc393',[front+.07,5.825,zz],[.19,2.53,1.71]);
        this.label(text,type,1,front+.174,5.825,zz,1.55,2.32);
      }
      p.add(box,'#a73b4c',[front+.6,.26,z-2.08],[1.84,.052,1.57]);
      for(const dz of [-2.91,-1.22]){
        p.add(rod,'#e7ce8f',[front+.74,.78,z+dz],[.045,1.04,.045]);p.add(ball,'#d9c480',[front+.74,1.32,z+dz],[.08,.08,.08]);
      }
      p.tube([front+.74,1.22,z-2.91],[front+.74,1.22,z-1.22],.032,'#a73b4c');
      p.add(box,'#425366',[front-.1,1.19,z+2.07],[.2,1.45,1.58]);
      glass.add(box,'#ffffff',[front+.024,1.98,z+2.07],[.014,.91,1.36]);
      p.add(box,'#dfc28a',[front+.11,1.512,z+2.07],[.43,.051,1.67]);
      this.label(text,type,3,front+.055,1.017,z+2.07,1.36,.49);
      this.barista(p,front-.61,z+2.07,type);
      for(let row=0;row<2;row++)for(let col=0;col<4;col++){
        p.add(box,'#9f3e45',[x-.58+row*.64,.72,z-1.5+col*.78],[.44,.38,.52]);
        p.add(box,'#b45853',[x-.81+row*.64,1.06,z-1.5+col*.78],[.07,.54,.49]);
      }
      this.label(text,type,1,back+.135,1.79,z,3.47,1.18);
    }else if(type===5){
      for(const sz of [-1.51,.24,1.94]){
        this.shelf(p,x-.6,.8,z+sz,1.49,4,'#dbd7be');
        for(let row=0;row<4;row++)for(let j=0;j<7;j++)p.add(box,['#c7654e','#6a9679','#d6b356','#718fa8'][j%4],[x-.426,.74+row*.42,z+sz-.59+j*.195],[.185,.2,.145]);
      }
      p.add(box,'#728f8d',[front-.47,.89,z+1.79],[.66,.91,1.18]);p.add(box,'#e9e3cc',[front-.44,1.37,z+1.79],[.74,.058,1.23]);
      this.barista(p,x-.9,z-2.35,type);
    }else{
      this.shelf(p,x-.79,.77,z+.45,3.28,3,'#9b724b');
      for(let row=0;row<3;row++)for(let j=0;j<7;j++){
        p.add(rod,'#dbb374',[x-.604,.64+row*.42,z-.91+j*.46],[.135,.018,.135]);
        p.add(ball,'#c9944c',[x-.604,.71+row*.42,z-.91+j*.46],[.112,.075,.127]);
        for(let k=0;k<3;k++)p.add(box,'#edd297',[x-.508,.765+row*.42,z-.96+j*.46+k*.042],[.022,.012,.021]);
      }
      p.add(box,'#b2845a',[x+.79,.72,z+.69],[.84,.78,2.94]);p.add(box,'#e4c496',[x+.79,1.142,z+.69],[.94,.065,3.08]);
      this.barista(p,x-.38,z-1.69,type);
    }
    if(type!==4){
      const levels=Math.floor((height-3.64)/1.88);
      for(let floor=0;floor<levels;floor++)for(const dz of [-1.77,1.27]){
        const y=4.63+floor*1.86;
        p.add(box,'#d9d1bb',[front+.065,y,z+dz],[.16,1.3,1.65]);
        p.add(box,'#375b68',[front+.153,y,z+dz],[.029,1.1,1.43]);
        p.add(box,'#bad5ce',[front+.174,y+.2,z+dz+.37],[.009,.63,.034],[0,0,-.22]);
        p.add(box,cream,[front+.187,y,z+dz],[.035,1.15,.065]);
        p.add(box,cream,[front+.187,y,z+dz],[.038,.048,1.48]);
        p.add(box,'#dbcfb5',[front+.14,y-.65,z+dz],[.32,.095,1.86]);
        if(type===2||type===7){
          p.add(box,wood,[front+.27,y-.4,z+dz],[.42,.23,1.4]);
          for(let j=0;j<7;j++)p.add(ball,['#e3b79c','#87995e','#d6a770'][j%3],[front+.31,y-.23,z+dz-.54+j*.17],[.09,.16,.09]);
        }
      }
      // Hand-laid facade joints, external air conditioner, copper downpipe and a tiny balcony.
      for(let row=0;row<6;row++)p.add(box,type===3?'#647e8e':'#ad9981',[front+.007,3.94+row*.18,z],[.011,.011,6.43]);
      const ay=height-.7;p.add(box,'#d9d6c9',[front+.16,ay,z+2.57],[.44,.48,.89]);
      p.add(rod,'#5b6f73',[front+.392,ay,z+2.75],[.159,.023,.159],[0,0,Math.PI/2]);
      for(let i=0;i<8;i++)p.add(box,'#8a9590',[front+.4,ay-.159+i*.045,z+2.34],[.017,.01,.23]);
      p.add(box,'#708980',[front+.42,ay,z+2.75],[.011,.014,.28]);
      p.tube([front-.02,.53,z+3.24],[front-.02,height,z+3.24],.037,'#82735f');
    }
    p.add(box,'#6a5947',[front+.58,.485,z+3.18],[.4,.41,.69]);
    for(let i=0;i<9;i++){
      const zz=z+3.18+Math.sin(i*2.4)*.17,xx=front+.58+Math.cos(i*2.4)*.11;
      p.tube([front+.58,.64,z+3.18],[xx,.91+i%3*.04,zz],.009,'#6e8f58');
      p.add(leaf,i%2?'#9ead70':'#617e55',[xx,.71,zz],[.47,.48+i%3*.046,.47],[i%3*.2,Math.PI/2,-.52+Math.sin(i*2.4)*.57]);
    }
  }
  update(time:number){
    for(const {mesh,x,z}of this.steam)for(let i=0;i<5;i++){
      const t=(time*.45+i/5)%1,s=.038+t*.075;
      this.dummy.position.set(x+Math.sin(time*.8+i)*t*.07,.9+t*.49,z+Math.cos(i+time)*t*.065);this.dummy.scale.set(s,s*.76,s);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);
      if(i===4)mesh.instanceMatrix.needsUpdate=true;
    }
  }
  get stats(){return{shops:this.shopCount,types:[...SHOP_TYPES],openInteriors:true,signAtlasTextures:1,steamPuffs:this.steam.length*5};}
  dispose(){this.labels.map?.dispose();this.labels.dispose();this.windows.dispose();this.steamMaterial.dispose();this.shopMaterial.dispose();}
}
