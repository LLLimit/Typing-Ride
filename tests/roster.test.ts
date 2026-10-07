import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCyclist,createCar} from '../src/models.ts';
import {RIDERS,DEFAULT_SETTINGS,loadSave,persist} from '../src/data.ts';
const material=new T.MeshBasicMaterial({vertexColors:true}),edge=new T.MeshBasicMaterial({side:T.BackSide});
const tip=(bone:T.Object3D,length:number)=>new T.Vector3(0,-length,0).applyQuaternion(bone.quaternion).add(bone.position);
function dispose(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh&&o.userData.ownedGeometry&&!o.userData.outline)o.geometry.dispose();});}

test('both new mascot riders maintain hand and foot contact while standing and sitting',()=>{
  for(const index of [1,2]){
    const b=createCyclist(index,material,edge);
    for(const standing of [0,.35,.7,1])for(let i=0;i<36;i++){
      b.animate(i/36*Math.PI*2,standing);b.root.updateMatrixWorld(true);
      for(const side of [-1,1]){
        const arm=b.root.getObjectByName(`upper-arm-${side}`)!,forearm=b.root.getObjectByName(`forearm-${side}`)!,hand=b.root.getObjectByName(`hand-${side}`)!;
        assert.ok(tip(arm,.55).distanceTo(forearm.position)<1e-9);assert.ok(tip(forearm,.57).distanceTo(hand.position)<1e-9);
        const thigh=b.root.getObjectByName(`thigh-${side}`)!,shin=b.root.getObjectByName(`shin-${side}`)!,foot=b.root.getObjectByName(`foot-${side}`)!,pedal=b.root.getObjectByName(`pedal-${side}`)!;
        assert.ok(tip(thigh,.71).distanceTo(shin.position)<1e-9);assert.ok(tip(shin,.7).distanceTo(foot.position.clone().add(new T.Vector3(0,0,-.08)))<1e-9);
        assert.ok(foot.position.clone().sub(pedal.position).distanceTo(new T.Vector3(0,.095,.08))<1e-9);
      }
      b.root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.computeBoundingBox();assert.ok(Number.isFinite(o.geometry.boundingBox!.min.y));}});
    }
    if(index===1)assert.ok(b.root.getObjectByName('ear-1'));dispose(b.root);
  }
});

test('all four car styles retain fixed wheel planes, separate glass and human-scale dimensions',()=>{
  const variants=new Set<string>();
  for(let i=0;i<4;i++){
    const c=createCar(i,material,edge);variants.add(c.root.userData.vehicle);
    const size=new T.Box3().setFromObject(c.root).getSize(new T.Vector3());assert.ok(size.z<4.5&&size.z>3.9);assert.ok(size.y<1.9&&size.y>1.4);
    assert.ok(c.root.children.some(o=>o instanceof T.Mesh&&(o.material as T.Material).transparent),'Cabin glazing must be its own transparent surface');
    for(let j=0;j<18;j++)for(const w of c.wheels){w.rotation.y=-j*Math.PI/3;const axis=new T.Vector3(0,1,0).applyQuaternion(w.quaternion).applyQuaternion(w.parent!.quaternion);assert.ok(axis.distanceTo(new T.Vector3(-1,0,0))<1e-9);}
    dispose(c.root);
  }
  assert.equal(variants.size,4);
});

test('retired numeric rider slots migrate to the retained student while new character IDs persist',()=>{
  let raw='';const previous=globalThis.localStorage;
  Object.defineProperty(globalThis,'localStorage',{value:{getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}},configurable:true});
  try{
    for(const slot of [0,1,2]){raw=JSON.stringify({settings:{...DEFAULT_SETTINGS,rider:slot}});assert.equal(loadSave().settings.rider,0);}
    assert.deepEqual(RIDERS.map(r=>r.id),['lin','mango','pudding']);
    const save=loadSave();save.settings.rider=2;assert.ok(persist(save));assert.equal(loadSave().settings.rider,2);
    raw=JSON.stringify({settings:{...DEFAULT_SETTINGS,rider:2,riderId:'li'}});assert.equal(loadSave().settings.rider,0);
  }finally{Object.defineProperty(globalThis,'localStorage',{value:previous,configurable:true});}
});
