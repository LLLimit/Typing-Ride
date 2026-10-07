import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCar,createCyclist,RIDER_SCALE} from '../src/models.ts';

const material=new T.MeshBasicMaterial({vertexColors:true});
const edge=new T.MeshBasicMaterial({side:T.BackSide});
function cyclist(){return createCyclist(0,material,edge,new T.Texture());}
function dispose(root:T.Object3D){const geometries=new Set<T.BufferGeometry>();root.traverse(o=>{if(o instanceof T.Mesh)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());}
function tip(bone:T.Object3D,length:number){return new T.Vector3(0,-length,0).applyQuaternion(bone.quaternion).add(bone.position);}

test('car and bicycle wheel axles stay fixed through multiple revolutions',()=>{
  const bike=cyclist(),car=createCar(0,material,edge);
  for(let i=0;i<=48;i++){
    const a=i/48*Math.PI*6;bike.animate(a,0,a);car.wheels.forEach(w=>w.rotation.y=-a);
    for(const [wheels,normal,expected] of [[bike.wheels,new T.Vector3(0,0,1),new T.Vector3(1,0,0)],[car.wheels,new T.Vector3(0,1,0),new T.Vector3(-1,0,0)]] as const){
      for(const w of wheels){const axis=normal.clone().applyQuaternion(w.quaternion).applyQuaternion(w.parent!.quaternion);assert.ok(axis.distanceTo(expected)<1e-12,'A rotating wheel must remain in the vehicle side plane');}
    }
  }
  // A point at the bottom of either tyre moves backwards as the vehicle drives forwards.
  for(const [wheel,spinAxis]of [[bike.wheels[0],'z'],[car.wheels[0],'y']]as const){
    wheel.rotation.set(0,0,0);const base=new T.Vector3(0,-.3,0).applyQuaternion(wheel.parent!.quaternion.clone().invert());
    const before=base.clone().applyQuaternion(wheel.parent!.quaternion);wheel.rotation[spinAxis]=spinAxis==='z'?.01:-.01;
    const after=base.clone().applyQuaternion(wheel.quaternion).applyQuaternion(wheel.parent!.quaternion);assert.ok(after.z<before.z,'Tyre contact motion must oppose forward travel');
  }
  dispose(bike.root);dispose(car.root);
});

test('standing pose preserves grip contact, pedal contact and fixed bone lengths throughout a full crank cycle',()=>{
  const bike=cyclist();
  for(const standing of [0,.25,.6,1])for(let i=0;i<32;i++){
    bike.animate(i/32*Math.PI*2,standing);
    for(const side of [-1,1]){
      const upper=bike.root.getObjectByName(`upper-arm-${side}`)!,lower=bike.root.getObjectByName(`forearm-${side}`)!,hand=bike.root.getObjectByName(`hand-${side}`)!;
      assert.ok(tip(upper,.55).distanceTo(lower.position)<1e-9);assert.ok(tip(lower,.57).distanceTo(hand.position)<1e-9,'The sleeve must reach the fixed grip without stretching');
      assert.ok(hand.position.distanceTo(new T.Vector3(side*.44,1.9,.65))<1e-9);
      const thigh=bike.root.getObjectByName(`thigh-${side}`)!,shin=bike.root.getObjectByName(`shin-${side}`)!,foot=bike.root.getObjectByName(`foot-${side}`)!,pedal=bike.root.getObjectByName(`pedal-${side}`)!;
      assert.ok(tip(thigh,.71).distanceTo(shin.position)<1e-9);
      assert.ok(tip(shin,.7).distanceTo(foot.position.clone().add(new T.Vector3(0,0,-.08)))<1e-9);
      assert.ok(foot.position.clone().sub(pedal.position).distanceTo(new T.Vector3(0,.095,.08))<1e-9);
    }
    if(standing===1){assert.ok(bike.hips.y>1.95);assert.ok(bike.body.rotation.x>.2);}
  }
  dispose(bike.root);
});

test('a bicycle has roughly half a car length and the seated rider stays below 2.5 world metres',()=>{
  const bike=cyclist(),car=createCar(0,material,edge);bike.root.scale.setScalar(RIDER_SCALE);
  const b=new T.Box3().setFromObject(bike.root).getSize(new T.Vector3()),c=new T.Box3().setFromObject(car.root).getSize(new T.Vector3());
  assert.ok(b.z>1.7&&b.z<2.3);assert.ok(c.z/b.z>1.7&&c.z/b.z<2.5);
  assert.ok(b.y<2.5);assert.ok(c.y>1.4&&c.y<1.8);assert.ok(b.x<c.x*.5);
  dispose(bike.root);dispose(car.root);
});
