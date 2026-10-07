import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCyclist,createCar} from '../src/models.ts';

const mat=new T.MeshBasicMaterial({vertexColors:true}),edge=new T.MeshBasicMaterial({side:T.BackSide});
function dispose(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh&&o.userData.ownedGeometry&&!o.userData.outline)o.geometry.dispose();if(o instanceof T.SkinnedMesh)o.skeleton.dispose();});}

test('both mascot riders use small, flat-shaded block models with pixel belly patches',()=>{
  for(const id of [1,2]){
    const rider=createCyclist(id,mat,edge),body=rider.body.getObjectByName('voxel-mascot-body') as T.Mesh,details=rider.body.getObjectByName('pixel-mascot-details') as T.Mesh;
    assert.ok(body&&details);assert.equal(body.material,mat);assert.ok(body.geometry.attributes.position.count/3<2000,'The hero torso should remain a lightweight faceted mesh');
    let skinned=0;rider.root.traverse(o=>{if(o instanceof T.SkinnedMesh)skinned++;});assert.equal(skinned,0,'Block characters animate rigid, closed parts rather than a rounded skin');
    for(const name of ['upper-arm--1','forearm--1','thigh--1','shin--1','hand--1','foot--1']){
      const mesh=rider.root.getObjectByName(name)!.children.find(o=>o instanceof T.Mesh&&!o.userData.outline) as T.Mesh,p=mesh.geometry.attributes.position;
      let planar=0,total=0;for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),n=b.sub(a).cross(c.sub(a)),area=n.length()*.5;total+=area;n.normalize();if(Math.max(Math.abs(n.x),Math.abs(n.y),Math.abs(n.z))>.999)planar+=area;}
      assert.ok(planar/total>1-1e-7,`${name} must only have square, flat surfaces without bevels or rounding`);
    }
    const p=details.geometry.attributes.position,c=details.geometry.attributes.color;let pixels=0;
    for(let i=0;i<p.count;i++)if(p.getY(i)<.84&&p.getZ(i)>.47&&c.getX(i)>.95&&c.getY(i)>.86&&c.getZ(i)>.60)pixels++;
    assert.ok(pixels>40,'Cream belly patch must exist on the flat front surface');
    dispose(rider.root);
  }
});

test('voxel student sleeves and trousers predominantly have square planar faces',()=>{
  const rider=createCyclist(0,mat,edge);
  for(const name of ['upper-arm--1','forearm--1','thigh--1','shin--1']){
    const mesh=rider.root.getObjectByName(name)!.children.find(o=>o instanceof T.Mesh&&!o.userData.outline) as T.Mesh,p=mesh.geometry.attributes.position;
    let planar=0,total=0;
    for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),cross=b.sub(a).cross(c.sub(a)),area=cross.length()*.5;total+=area;cross.normalize();if(Math.max(Math.abs(cross.x),Math.abs(cross.y),Math.abs(cross.z))>.999)planar+=area;}
    assert.ok(planar/total>.8,'Most of the visible cloth surface must consist of flat cuboid faces');
  }
  dispose(rider.root);
});

test('car panes are independently sortable, face outward and stay out of shadow rendering',()=>{
  for(let i=0;i<4;i++){
    const car=createCar(i,mat,edge),panes=car.root.children.filter(o=>o.name.startsWith('car-window-')) as T.Mesh[];
    assert.equal(panes.length,i===1?4:6);
    for(const pane of panes){
      assert.equal(pane.castShadow,false);assert.equal(pane.receiveShadow,false);
      const material=pane.material as T.Material;assert.equal(material.side,T.FrontSide);assert.equal(material.depthWrite,false);assert.equal(material.depthTest,true);assert.ok(material.transparent);
      const p=pane.geometry.attributes.position,n=pane.geometry.attributes.normal,center=new T.Vector3();for(let j=0;j<p.count;j++)center.add(new T.Vector3().fromBufferAttribute(p,j));center.divideScalar(p.count);center.y=0;
      assert.ok(center.dot(new T.Vector3().fromBufferAttribute(n,0))>0,'Only the outside face is drawn; opposite panes cannot double blend');
    }
    dispose(car.root);
  }
});
