import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {NatureWorld} from '../src/nature.ts';
function nature(){return new NatureWorld(new T.MeshToonMaterial({vertexColors:true}),new T.MeshToonMaterial({vertexColors:true}),new T.MeshBasicMaterial({side:T.BackSide}),new T.MeshBasicMaterial());}
function dispose(group:T.Group){const seen=new Set<T.BufferGeometry>();group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();if(o instanceof T.Mesh&&!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}});}
function shoreAt(group:T.Group,z:number){
  const mesh=group.children.find(o=>o instanceof T.Mesh)! as T.Mesh,positions=mesh.geometry.getAttribute('position'),colors=mesh.geometry.getAttribute('color'),sand=new T.Color('#fff0c8');let min=Infinity;
  for(let i=0;i<positions.count;i++)if(Math.abs(positions.getZ(i)-z)<1e-6&&Math.abs(colors.getX(i)-sand.r)<1e-5&&Math.abs(colors.getY(i)-sand.g)<1e-5)min=Math.min(min,positions.getX(i));
  assert.ok(Number.isFinite(min));return min;
}
test('beach shoreline edges join seamlessly, including the infinite loop boundary',()=>{
  const world=nature(),chunks=Array.from({length:4},(_,i)=>world.buildChunk('coast',i));
  for(let i=0;i<4;i++)assert.ok(Math.abs(shoreAt(chunks[i],16)-shoreAt(chunks[(i+1)%4],-16))<1e-6);
  for(const chunk of chunks){chunk.traverse(o=>{if(o instanceof T.Mesh&&o.geometry.getAttribute('windWeight')){const weights=o.geometry.getAttribute('windWeight');assert.equal(weights.count,o.geometry.getAttribute('position').count);for(let i=0;i<weights.count;i++)assert.ok(weights.getX(i)>=0&&weights.getX(i)<=1);}});dispose(chunk);}world.dispose();
});
test('forest scenery has two complete cabins and moving animals that stay outside the cycle path',()=>{
  const world=nature(),chunks=Array.from({length:4},(_,i)=>world.buildChunk('forest',i));
  assert.equal(chunks.filter(g=>g.userData.cabin).length,2);assert.equal(world.stats.animals.length,16);
  world.update(1.5,12);const a=world.stats.animals;world.update(2.3,17);const b=world.stats.animals;assert.notDeepEqual(a,b);
  assert.ok(b.every(c=>c.x<-2.9||c.x>1.1),'Animals must leave space for the rider');
  assert.equal(world.stats.shoreTravel,17);world.reset();assert.equal(world.stats.animals.length,0);assert.equal(world.stats.cabins,0);assert.equal(world.stats.shoreTravel,0);
  chunks.forEach(dispose);world.dispose();
});
