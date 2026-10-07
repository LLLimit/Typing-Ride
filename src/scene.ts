import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MAPS, RIDERS, type Settings, type MapId } from './data';
import { NatureWorld } from './nature';
import {TownWorld} from './town';
import { createCyclist, createCar, createWalker, RIDER_SCALE, type Cyclist, type TrafficCar, type Walker } from './models';

const box = new T.BoxGeometry(1, 1, 1);
const rounded = new RoundedBoxGeometry(1, 1, 1, 3, 0.12);
const sphere = new T.IcosahedronGeometry(1, 1);
const cone = new T.ConeGeometry(1, 1, 8);
const cylinder = new T.CylinderGeometry(1, 1, 1, 10);
const wheelGeometry = new T.TorusGeometry(0.6, 0.066, 6, 24);
const rimGeometry = new T.TorusGeometry(0.49, 0.021, 4, 24);
const roofGeometry = new T.ConeGeometry(1, 1, 4);
const gradient = new T.DataTexture(new Uint8Array([100, 100, 100, 175, 175, 175, 230, 230, 230, 255, 255, 255]), 4, 1, T.RGBFormat);
gradient.minFilter = gradient.magFilter = T.NearestFilter; gradient.needsUpdate = true;
const staticMaterial = new T.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
const nightUniform = { value: 0 };
const windowColors = ['#375b68', '#284958', '#769aa6', '#aec8c7', '#edcc84', '#f5df9a'].map(c => {
  const v = new T.Color(c); return `vec3(${v.r.toFixed(5)},${v.g.toFixed(5)},${v.b.toFixed(5)})`;
});
staticMaterial.onBeforeCompile = shader => {
  shader.uniforms.uNight = nightUniform;
  shader.fragmentShader = 'uniform float uNight;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>\nfloat windowMask = 0.0;\n${windowColors.map(c => `windowMask = max(windowMask, 1.0 - step(0.012, distance(vColor.rgb, ${c})));`).join('\n')}\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0,0.62,0.2), windowMask * uNight);`);
  shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.52, 0.16) * windowMask * uNight * 0.9;');
};
const actorMaterial = new T.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });
actorMaterial.onBeforeCompile = shader => {
  shader.uniforms.uNight = nightUniform;
  shader.fragmentShader = 'uniform float uNight;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * (0.08 + uNight * 0.48);');
};
function makeOutlineMaterial(width: number) {
  const mat = new T.MeshBasicMaterial({ color: '#283743', side: T.BackSide });
  mat.onBeforeCompile = shader => { shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed += normal * ${width.toFixed(4)};`); };
  mat.customProgramCacheKey = () => `outline-${width}`;
  return mat;
}
const worldOutline = makeOutlineMaterial(0.018);
const riderOutline = makeOutlineMaterial(0.007);
function outline(mesh: T.Mesh, parent: T.Object3D, actor = false) {
  const edge = new T.Mesh(mesh.geometry, actor ? riderOutline : worldOutline);
  edge.position.copy(mesh.position); edge.quaternion.copy(mesh.quaternion); edge.scale.copy(mesh.scale); edge.renderOrder = -1;
  edge.userData.outline = true; parent.add(edge);
}
const matCache = new Map<string, T.MeshToonMaterial>();
function material(color: string) {
  if (!matCache.has(color)) matCache.set(color, new T.MeshToonMaterial({ color, gradientMap: gradient }));
  return matCache.get(color)!;
}
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
class Batch {
  geometries: T.BufferGeometry[] = []; private dummy = new T.Object3D();
  add(geometry: T.BufferGeometry, color: string, position: number[], scale: number[], rotation = [0, 0, 0]) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone(); this.dummy.position.set(position[0], position[1], position[2]); this.dummy.scale.set(scale[0], scale[1], scale[2]);
    this.dummy.rotation.set(rotation[0], rotation[1], rotation[2]); this.dummy.updateMatrix(); g.applyMatrix4(this.dummy.matrix);
    const c = new T.Color(color), colors = new Float32Array(g.getAttribute('position').count * 3);
    for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; }
    g.setAttribute('color', new T.BufferAttribute(colors, 3)); this.geometries.push(g);
  }
  finish() {
    const geometry = mergeGeometries(this.geometries, false); this.geometries.forEach(g => g.dispose());
    if (!geometry) throw new Error('地图合并失败');
    const mesh = new T.Mesh(geometry, staticMaterial); mesh.receiveShadow = true; mesh.castShadow = true; return mesh;
  }
}
function mesh(parent: T.Object3D, geometry: T.BufferGeometry, color: string, pos: number[], scale: number[], rotation = [0, 0, 0]) {
  const m = new T.Mesh(geometry, material(color)); m.position.set(pos[0], pos[1], pos[2]); m.scale.set(scale[0], scale[1], scale[2]); m.rotation.set(rotation[0], rotation[1], rotation[2]); m.castShadow = true; parent.add(m); return m;
}
function tube(parent: T.Object3D, a: number[], b: number[], radius: number, color: string) {
  const av = new T.Vector3(...a as [number, number, number]), bv = new T.Vector3(...b as [number, number, number]);
  const m = mesh(parent, cylinder, color, av.clone().add(bv).multiplyScalar(0.5).toArray(), [radius, av.distanceTo(bv), radius]);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), bv.sub(av).normalize()); return m;
}
function labelTexture(text: string, bg: string, fg = '#fff8e8') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const c = canvas.getContext('2d')!; c.fillStyle = bg; c.fillRect(0, 0, 512, 128); c.fillStyle = fg;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 46px sans-serif'; c.fillText(text, 256, 65);
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; return texture;
}
function softShadowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d')!, g = c.createRadialGradient(32, 32, 3, 32, 32, 32); g.addColorStop(0, 'rgba(28,45,34,.4)'); g.addColorStop(1, 'rgba(28,45,34,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new T.CanvasTexture(canvas);
}
function lightPoolTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d')!, g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,235,174,.9)'); g.addColorStop(0.4, 'rgba(255,215,140,.35)'); g.addColorStop(1, 'rgba(255,215,140,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new T.CanvasTexture(canvas);
}
export class RideScene {
  renderer: T.WebGLRenderer; scene = new T.Scene(); camera = new T.PerspectiveCamera(38, 1, 0.1, 160);
  private sun = new T.DirectionalLight('#fff0d1', 3.2); private ambient = new T.HemisphereLight('#fff9e9', '#68766a', 2.3);
  private fill = new T.DirectionalLight('#e1edff', 0.7);
  private glowMaterial = new T.MeshBasicMaterial({ color: '#ffc870', map: lightPoolTexture(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.48 });
  private nature!: NatureWorld; private town!:TownWorld;
  private chunks: T.Group[] = []; private rider = new T.Group(); private body = new T.Group();
  private cyclist!: Cyclist; private cars: TrafficCar[] = []; private walkers: Walker[] = [];
  private rain!: T.LineSegments; private ripples!: T.InstancedMesh; private splash!: T.LineSegments;
  private wetRoad!: T.InstancedMesh; private sparks!: T.Points; private sparkLife = 0;
  private rainSeeds = new Float32Array(960 * 4); private weatherDummy = new T.Object3D();
  private rippleSeeds = new Float32Array(90 * 4);
  private rippleColor = new T.Color();
  private clouds = new T.Group(); private backdrop = new T.Group(); private particles: T.Points;
  private shadow: T.Mesh; private clock = 0; private worldTravel = 0; private pedalAngle = 0; private wheelAngle = 0; private cameraMode = 0; private sprint = 0;
  private settings: Settings; private frameCount = 0; private frameTime = 0; private fps = 60; private qualityDpr = 1.5;
  private flash = 0; private targetFlash = new T.Color('#fff3cf'); private background = new T.Color('#e8eadd');
  private observer: ResizeObserver; private width = 1; private height = 1; private stopped = false;
  private dirty = true;
  private desiredMenu = true; private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  onContextLost?: () => void;
  constructor(container: HTMLElement, settings: Settings) {
    this.settings = { ...settings };
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    container.append(this.renderer.domElement); this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); this.stopped = true; this.onContextLost?.(); });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => { location.reload(); });
    this.scene.add(this.ambient, this.sun, this.fill); this.sun.position.set(9, 18, 5); this.sun.castShadow = true; this.fill.position.set(13, 7, 20);
    this.sun.shadow.mapSize.set(1024, 1024); this.sun.shadow.camera.left = -22; this.sun.shadow.camera.right = 22;
    this.sun.shadow.camera.top = 22; this.sun.shadow.camera.bottom = -22; this.sun.shadow.camera.near = 0.5; this.sun.shadow.camera.far = 70;
    this.sun.shadow.normalBias = 0.018; this.sun.shadow.bias = -0.0001;
    this.sun.shadow.autoUpdate = false; this.sun.shadow.needsUpdate = true;
    const positions = new Float32Array(240 * 3); const random = rng(38);
    for (let i = 0; i < positions.length; i += 3) { positions[i] = random() * 38 - 19; positions[i + 1] = random() * 18; positions[i + 2] = random() * 50 - 30; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(positions, 3));
    this.particles = new T.Points(geo, new T.PointsMaterial({ color: '#ffffff', size: 0.1, transparent: true, opacity: 0.7, depthWrite: false })); this.scene.add(this.particles);
    this.shadow = new T.Mesh(new T.PlaneGeometry(1.2, 2.3), new T.MeshBasicMaterial({ map: softShadowTexture(), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.set(-2, 0.033, 2); this.scene.add(this.shadow);
    this.town = new TownWorld(staticMaterial,worldOutline,this.glowMaterial);
    this.nature = new NatureWorld(staticMaterial, actorMaterial, riderOutline, this.glowMaterial); this.scene.add(this.nature.root);
    this.scene.add(this.clouds, this.backdrop, this.rider); this.buildRider(); this.buildTraffic(); this.buildWeather(); this.buildMap(); this.setEnvironment(); this.setQuality();
    this.observer = new ResizeObserver(() => this.resize(container.clientWidth, container.clientHeight)); this.observer.observe(container); this.resize(container.clientWidth, container.clientHeight);
  }
  private resize(width: number, height: number) { this.width = Math.max(width, 1); this.height = Math.max(height, 1); this.camera.aspect = this.width / this.height; this.camera.updateProjectionMatrix(); this.renderer.setSize(this.width, this.height); this.dirty = true; }
  configure(s: Settings) {
    const mapChanged = s.map !== this.settings.map, riderChanged = s.rider !== this.settings.rider;
    this.settings = { ...s }; if (mapChanged) this.buildMap(); if (riderChanged) this.buildRider(); this.setEnvironment(); this.setQuality(); this.dirty = true;
  }
  setMenu(menu: boolean) { this.desiredMenu = menu; this.dirty = true; }
  private setQuality() {
    const s = this.settings.quality; this.qualityDpr = s === 'low' ? 1 : s === 'high' ? Math.min(devicePixelRatio, 2) : Math.min(devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(this.qualityDpr); this.renderer.shadowMap.enabled = s !== 'low'; this.sun.shadow.needsUpdate = true;
  }
  private setEnvironment() {
    const { time, weather, map } = this.settings;
    const color = time === 'night' ? '#17283e' : time === 'sunset' ? '#edb995' : map === 'coast' ? '#95cee2' : map === 'forest' ? '#bdd5ba' : '#b4d4dd';
    this.background.set(color); this.scene.background = this.background.clone(); this.scene.fog = new T.Fog(color, time === 'night' ? 35 : 56, 130);
    this.sun.color.set(time === 'sunset' ? '#ffb375' : time === 'night' ? '#8cacf4' : '#ffe9cc');
    this.sun.intensity = time === 'night' ? 1.5 : weather === 'rain' ? 2.3 : 3.7;
    this.ambient.intensity = time === 'night' ? 0.78 : 1.55; this.ambient.color.set(time === 'night' ? '#92ace0' : '#d4e7f2');
    this.ambient.groundColor.set(time === 'night' ? '#222736' : '#a3a18d');
    this.fill.color.set(time === 'night' ? '#efd4a5' : '#e5eeff'); this.fill.intensity = time === 'night' ? 1.8 : 0.9;
    nightUniform.value = time === 'night' ? 1 : time === 'sunset' ? 0.3 : 0;
    this.scene.traverse(o => { if (o.userData.nightGlow) o.visible = time !== 'day'; });
    this.renderer.toneMappingExposure = time === 'night' ? 1.2 : 1.4;
    const pm = this.particles.material as T.PointsMaterial; pm.color.set(weather === 'rain' ? '#d5e5e9' : '#ffffff'); pm.size = weather === 'snow' ? 0.1 : 0.035;
    this.particles.visible = weather === 'snow'; this.rain.visible = this.ripples.visible = this.splash.visible = weather === 'rain';
    this.wetRoad.visible = weather === 'rain' && map === 'town';
    (this.rain.material as T.LineBasicMaterial).opacity = time === 'night' ? .42 : .38;
    (this.wetRoad.material as T.MeshBasicMaterial).opacity = time === 'night' ? .55 : .17;
    this.walkers.forEach(w => w.umbrella.visible = weather === 'rain');
    this.cars.forEach(c => c.root.visible = map === 'town'); this.walkers.forEach(w => w.root.visible = map === 'town'); this.nature.configure(this.settings);this.town.configure(time);
    this.clouds.visible = weather !== 'rain';
    if(weather === 'rain') { this.background.lerp(new T.Color('#5b7891'),.3); this.scene.background = this.background.clone(); this.scene.fog!.color.copy(this.background); this.sun.intensity *= .65; }
    this.sun.shadow.needsUpdate = true;
  }
  private clearGroup(group: T.Group) {
    group.traverse(obj => {
      if (obj instanceof T.InstancedMesh) obj.dispose();
      if (obj instanceof T.SkinnedMesh) obj.skeleton.dispose();
      if (obj instanceof T.Mesh && obj.userData.ownedGeometry && !obj.userData.outline) obj.geometry.dispose();
      if (obj instanceof T.Mesh && obj.userData.disposable) { obj.geometry.dispose(); const m = obj.material as T.MeshBasicMaterial; m.map?.dispose(); m.dispose(); }
    });
    group.clear();
  }
  private buildMap() {
    for (const chunk of this.chunks) { chunk.traverse(o => { if (o instanceof T.Mesh && o.material === staticMaterial && !o.userData.ownedGeometry) o.geometry.dispose(); }); this.clearGroup(chunk); this.scene.remove(chunk); }
    this.chunks = []; this.worldTravel = 0; this.nature.reset(); this.town.reset(); this.clearGroup(this.clouds); this.clearGroup(this.backdrop);
    for (let i = 0; i < 4; i++) { const chunk = this.buildChunk(this.settings.map, i); chunk.position.z = -64 + i * 32; this.scene.add(chunk); this.chunks.push(chunk); }
    const b = new Batch(); const random = rng(876);
    for (let i = 0; i < 9; i++) {
      const x = this.settings.map === 'coast' ? -55-random()*30 : random()*80-40, z = -25-random()*50;
      b.add(sphere, this.settings.map === 'coast' ? '#9ebdb9' : '#aaba9b', [x, this.settings.map === 'coast' ? -4 : -2, z], [12 + random()*12, this.settings.map === 'coast' ? 5+random()*5 : 8+random()*7, 12]);
    }
    const bg = b.finish(); bg.castShadow = false; bg.receiveShadow = false; bg.userData.ownedGeometry = true; this.backdrop.add(bg);
    for (let i = 0; i < 7; i++) {
      const cloud = new T.Group(); for (let j = 0; j < 4; j++) mesh(cloud, sphere, '#f6f3e7', [j * 1.1, j % 2 * 0.3, 0], [1.5, 0.75, 0.8]);
      cloud.position.set(-22 + i * 8, 12 + i % 3 * 1.4, -25 - i % 3 * 8); this.clouds.add(cloud);
    }
    this.bake(this.clouds, true); this.clouds.children.forEach(o => o.castShadow = false);
    this.sun.shadow.needsUpdate = true;
  }
  private tree(b: Batch, x: number, z: number, scale: number, forest = false) {
    b.add(cylinder, '#89745b', [x, scale * 1.5, z], [0.17 * scale, scale * 3, 0.17 * scale]);
    if (forest) {
      for (let i = 0; i < 3; i++) b.add(cone, ['#4a745e', '#61836b', '#7b9b71'][i], [x, (2.4 + i * 0.85) * scale, z], [(1.5 - i * 0.33) * scale, 2.1 * scale, (1.5 - i * 0.33) * scale]);
    } else {
      b.add(sphere, '#648746', [x, 3.5 * scale, z], [1.3 * scale, 1.45 * scale, 1.3 * scale]);
      b.add(sphere, '#91ad57', [x + 0.7 * scale, 3.3 * scale, z + 0.25], [0.9 * scale, 1.1 * scale, 0.9 * scale]);
      b.add(sphere, '#769c4d', [x - 0.4 * scale, 3.8 * scale, z - 0.45], [0.75 * scale, 0.9 * scale, 0.8 * scale]);
    }
    b.add(cylinder, '#a9b39a', [x, 0.055, z], [1.1 * scale, 0.06, 1.1 * scale]);
  }
  private lamp(b: Batch, x: number, z: number) {
    b.add(cylinder, '#59655c', [x, 2.0, z], [0.065, 4, 0.065]); b.add(box, '#59655c', [x + 0.2, 4.05, z], [0.6, 0.09, 0.1]);
    b.add(rounded, '#f5df9a', [x + 0.4, 3.95, z], [0.4, 0.19, 0.4]);
  }
  private sign(group: T.Group, text: string, color: string, x: number, y: number, z: number, width: number, rotate = Math.PI / 2) {
    const m = new T.Mesh(new T.PlaneGeometry(width, width / 4), new T.MeshBasicMaterial({ map: labelTexture(text, color), side: T.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = rotate; m.userData.disposable = true; group.add(m);
  }
  private buildChunk(map: MapId, seed: number) {
    if (map !== 'town') return this.nature.buildChunk(map, seed);
    const group = new T.Group(), b = new Batch(), random = rng(271 + seed * 391);
    const grass = '#d9dfc4';
    b.add(box, grass, [0,-.16,0], [48,.3,32]);
    const road = '#596372';
    b.add(box, road, [0, 0.005, 0], [8.4, 0.035, 32]);
    {
      for (let z = -14; z < 16; z += 5.3) b.add(box, '#f5edd3', [0, 0.029, z], [0.11, 0.012, 2.0]);
      for (const x of [-3.8, 3.8]) b.add(box, '#eee4ce', [x, 0.025, 0], [0.09, 0.01, 32]);
    }
    if (map === 'town') {
      for (const x of [-5.4, 5.4]) {
        b.add(box, '#d9d3c3', [x, 0.11, 0], [2.35, 0.23, 32]);
        b.add(box, '#efe7d3', [x > 0 ? 4.3 : -4.3, 0.14, 0], [0.19, 0.28, 32]);
        for (let z = -16; z < 16; z += 1.6) b.add(box, '#c5c4b6', [x, 0.23, z], [2.2, 0.01, 0.018]);
      }
      this.town.populate(group,seed);
      for (let i = 0; i < 3; i++) {
        const z = -12 + i * 12; this.tree(b, 7.0, z, 0.48 + random() * 0.08); this.lamp(b, -4.85, z + 2.2);
        b.add(cylinder, '#505d61', [-4.88, 2.3, z + 2.2], [0.17, 0.12, 0.17]);
        b.add(box, '#537e69', [-4.62, 3.25, z + 2.2], [0.06, 0.8, 0.6]);
      }
      const pools: T.BufferGeometry[] = [];
      for (let i = 0; i < 3; i++) {
        const plane = new T.PlaneGeometry(5.2, 5.8); plane.rotateX(-Math.PI / 2); plane.translate(-3.4, 0.049, -9.8 + i * 12); pools.push(plane);
      }
      const poolMesh = new T.Mesh(mergeGeometries(pools)!, this.glowMaterial); pools.forEach(g => g.dispose());
      poolMesh.userData.nightGlow = true; poolMesh.userData.ownedGeometry = true; poolMesh.visible = this.settings.time !== 'day'; group.add(poolMesh);
      // Fine asphalt flecks and pavement joints add scale without a texture download.
      for (let i = 0; i < 95; i++) b.add(box, i % 3 ? '#66737b' : '#758089', [-3.6 + random() * 7.2, 0.025, -16 + random() * 32], [0.025 + random() * 0.075, 0.003, 0.018]);
      for (let i = 0; i < 8; i++) b.add(box, '#e3ddc4', [-2.9 + i * 0.8, 0.031, -15.5], [0.48, 0.01, 1.85]);
      b.add(box, '#70726a', [-3.8, 0.033, 7], [0.3, 0.01, 0.8]);
      for (let i = 0; i < 6; i++) b.add(box, '#3b474d', [-3.8, 0.04, 6.7 + i * 0.12], [0.27, 0.007, 0.025]);
      for (let i = 0; i < 2; i++) {
        const z = -5 + i * 15; b.add(box, '#907b5d', [6.2, 0.7, z], [0.65, 0.14, 1.8]); b.add(box, '#907b5d', [6.6, 1.1, z], [0.1, 0.65, 1.8]);
        for (const dz of [-0.6, 0.6]) b.add(box, '#687563', [6.2, 0.35, z + dz], [0.12, 0.7, 0.13]);
      }
      // Street furniture: vending machines, illuminated sign blades, railings and cables.
      const mz=-7+seed*2;
      b.add(rounded,'#c43858',[-6.1,1.25,mz],[.6,2.0,1.05]);
      b.add(box,'#edeeee',[-5.79,1.5,mz],[.018,1.13,.82]);
      for(let row=0;row<3;row++)for(let col=0;col<5;col++)b.add(cylinder,['#3b8ac4','#f5b94d','#dc5473'][col%3],[-5.763,1.15+row*.28,mz-.32+col*.16],[.037,.16,.037]);
      b.add(box,'#172c4a',[-5.758,.55,mz],[.023,.17,.52]);b.add(box,'#e5c58b',[-5.755,1.07,mz+.42],[.025,.21,.055]);
      this.sign(group,'DRINKS / 24H','#cb3153',-5.75,2.03,mz,.93);
      for(let z=-16;z<16;z+=2.2){
        b.add(cylinder,'#34445d',[4.57,.8,z],[.045,1.45,.045]);b.add(sphere,'#88a1b7',[4.57,1.54,z],[.07,.07,.07]);
        b.add(box,'#73849b',[4.57,1.25,z+1.1],[.045,.055,2.2]);b.add(box,'#73849b',[4.57,.63,z+1.1],[.045,.045,2.2]);
      }
      b.add(box,'#193b61',[-6.47,4.5,7],[.47,1.5,1.05]);
      this.sign(group,'OPEN','#1469b0',-6.22,4.5,7,1.05);
      for(let i=0;i<12;i++)b.add(cylinder,'#27364b',[-6.0,7.6-Math.sin(i/11*Math.PI)*.45,-16+i*2.9],[.018,2.9,.018],[Math.PI/2,0,0]);
      // Background apartment towers, with repeated mullions and balconies.
      for(let i=0;i<2;i++){
        const tz=-11+i*18,h=10+(seed+i)%3*2;b.add(box,['#7890b0','#a7b8ce'][i],[ -14,h/2,tz],[5,h,7]);
        for(let floor=0;floor<h/2-1;floor++)for(let col=0;col<4;col++){
          b.add(box,'#284958',[-11.48,1.4+floor*2,tz-2.3+col*1.5],[.035,1.0,.95]);
          b.add(box,'#c5cfdb',[-11.43,1.4+floor*2,tz-2.3+col*1.5],[.06,.06,1.0]);
        }
      }
    }
    const groundMesh = b.finish(); group.add(groundMesh); outline(groundMesh, group); return group;
  }
  private buildRider() {
    this.clearGroup(this.rider);
    this.cyclist = createCyclist(this.settings.rider, actorMaterial, riderOutline);
    this.rider.add(this.cyclist.root); this.body = this.cyclist.body;
    this.rider.position.set(-2,0,2); this.rider.rotation.y = Math.PI;
    this.rider.scale.setScalar(RIDER_SCALE); this.sun.shadow.needsUpdate = true;
  }
  private buildTraffic() {
    for(let i=0;i<4;i++) {
      const car=createCar(i,actorMaterial,riderOutline);car.root.position.set(i%2?2.4:.15,0,-28+i*17);car.root.rotation.y=car.velocity<0?Math.PI:0;
      const beam=new T.Mesh(new T.PlaneGeometry(3.5,6),this.glowMaterial);beam.rotation.x=-Math.PI/2;beam.position.set(0,.051,4.0);beam.userData.nightGlow=true;beam.userData.ownedGeometry=true;car.root.add(beam);
      this.scene.add(car.root);this.cars.push(car);
    }
    for(let i=0;i<6;i++) {
      const walker=createWalker(i,actorMaterial,riderOutline);walker.root.position.set(i%2?5.35:-5.35,.24,-21+i*7);walker.root.rotation.y=walker.velocity<0?Math.PI:0;this.scene.add(walker.root);this.walkers.push(walker);
    }
  }
  private buildWeather() {
    const random=rng(8472),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(960*6),3).setUsage(T.DynamicDrawUsage));
    this.rain=new T.LineSegments(geo,new T.LineBasicMaterial({color:'#b9e5ff',transparent:true,opacity:.4,depthWrite:false}));this.rain.frustumCulled=false;this.scene.add(this.rain);
    for(let i=0;i<960;i++){this.rainSeeds.set([random()*32-16,random()*18,random()*58-40,.4+random()*.5],i*4);}
    this.ripples=new T.InstancedMesh(new T.RingGeometry(.18,.195,16),new T.MeshBasicMaterial({color:'#bedaff',transparent:true,opacity:.3,depthWrite:false,side:T.DoubleSide}),90);this.ripples.instanceMatrix.setUsage(T.DynamicDrawUsage);this.ripples.frustumCulled=false;this.scene.add(this.ripples);
    for(let i=0;i<90;i++)this.rippleSeeds.set([random()*7.4-3.7,random()*42-27,random(),.65+random()*.8],i*4);
    const splashes=new T.BufferGeometry();splashes.setAttribute('position',new T.BufferAttribute(new Float32Array(90*18),3).setUsage(T.DynamicDrawUsage));
    this.splash=new T.LineSegments(splashes,new T.LineBasicMaterial({color:'#d3edff',transparent:true,opacity:.38,depthWrite:false}));this.splash.frustumCulled=false;this.scene.add(this.splash);
    this.wetRoad=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:'#ffcf92',map:lightPoolTexture(),transparent:true,opacity:.3,depthWrite:false,blending:T.AdditiveBlending}),35);this.wetRoad.frustumCulled=false;this.scene.add(this.wetRoad);
    for(let i=0;i<35;i++){this.weatherDummy.position.set(i%2===0?-3.6+random()*.8:random()*6-3,.047,-32+random()*64);this.weatherDummy.rotation.set(-Math.PI/2,0,0);this.weatherDummy.scale.set(.25+random()*.65,2+random()*3,1);this.weatherDummy.updateMatrix();this.wetRoad.setMatrixAt(i,this.weatherDummy.matrix);}
    const sparks=new T.BufferGeometry();sparks.setAttribute('position',new T.BufferAttribute(new Float32Array(32*3),3).setUsage(T.DynamicDrawUsage));
    this.sparks=new T.Points(sparks,new T.PointsMaterial({color:'#4eeaff',size:.065,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));this.sparks.frustumCulled=false;this.scene.add(this.sparks);
    this.updateRain(0,0);
  }
  private updateRain(dt:number,moving:number) {
    const lines=this.rain.geometry.getAttribute('position') as T.BufferAttribute, count=this.settings.quality==='low'?420:960;this.rain.geometry.setDrawRange(0,count*2);
    const arr=lines.array as Float32Array;
    for(let i=0;i<count;i++){
      const at=i*4,j=i*6;this.rainSeeds[at+1]-=dt*(18+this.rainSeeds[at+3]*12);this.rainSeeds[at+2]+=dt*moving;
      if(this.rainSeeds[at+1]<0){this.rainSeeds[at+1]=18;this.rainSeeds[at+2]=(this.rainSeeds[at+2]+40)%58-40;}
      const x=this.rainSeeds[at],y=this.rainSeeds[at+1],z=this.rainSeeds[at+2],len=this.rainSeeds[at+3];arr[j]=x;arr[j+1]=y;arr[j+2]=z;arr[j+3]=x+.09;arr[j+4]=y-len;arr[j+5]=z+.12;
    }lines.needsUpdate=true;
    const drops=this.splash.geometry.getAttribute('position') as T.BufferAttribute,da=drops.array as Float32Array;
    for(let i=0;i<90;i++){
      const j=i*4,age=(this.clock*.85+this.rippleSeeds[j+2])%1,x=this.rippleSeeds[j],z=this.rippleSeeds[j+1];
      this.weatherDummy.position.set(x,.052,z);this.weatherDummy.rotation.set(-Math.PI/2,0,0);this.weatherDummy.scale.setScalar(.1+age*2.5*this.rippleSeeds[j+3]);this.weatherDummy.updateMatrix();this.ripples.setMatrixAt(i,this.weatherDummy.matrix);
      this.ripples.setColorAt(i,this.rippleColor.setScalar(Math.max(.05,1-age)));
      for(let k=0;k<3;k++){const a=k*Math.PI*2/3+i,b=i*18+k*6,reach=age<.23?age*.8:0,height=age<.23?Math.sin(age/.23*Math.PI)*.14:0;da[b]=x;da[b+1]=.06;da[b+2]=z;da[b+3]=x+Math.cos(a)*reach;da[b+4]=.06+height;da[b+5]=z+Math.sin(a)*reach;}
    }drops.needsUpdate=true;this.ripples.instanceMatrix.needsUpdate=true;if(this.ripples.instanceColor)this.ripples.instanceColor.needsUpdate=true;
  }
  private bake(parent: T.Group, recursive: boolean) {
    parent.updateWorldMatrix(true, true);
    const meshes: T.Mesh[] = [];
    if (recursive) parent.traverse(o => { if (o instanceof T.Mesh) meshes.push(o); });
    else parent.children.forEach(o => { if (o instanceof T.Mesh) meshes.push(o); });
    if (!meshes.length) return;
    const inverse = parent.matrixWorld.clone().invert(), geometries: T.BufferGeometry[] = [];
    for (const m of meshes) {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));
      const color = (m.material as T.MeshToonMaterial).color;
      if (!g.getAttribute('color')) {
        const colors = new Float32Array(g.getAttribute('position').count * 3);
        for (let i = 0; i < colors.length; i += 3) { colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b; }
        g.setAttribute('color', new T.BufferAttribute(colors, 3));
      }
      geometries.push(g);
    }
    const geometry = mergeGeometries(geometries, false)!; geometries.forEach(g => g.dispose());
    if (recursive) parent.clear(); else meshes.forEach(m => parent.remove(m));
    const merged = new T.Mesh(geometry, parent === this.clouds ? staticMaterial : actorMaterial); merged.castShadow = true; merged.receiveShadow = true; merged.userData.ownedGeometry = true; parent.add(merged);
    if (parent !== this.clouds) outline(merged, parent, true);
  }
  pulse(correct: boolean) { this.flash = correct ? 0.035 : 0.18; this.targetFlash.set(correct ? '#73eaff' : '#e95178');this.sparkLife=.42; (this.sparks.material as T.PointsMaterial).color.set(correct?'#5deaff':'#ff3865'); }
  update(dt: number, speed: number, instability: number, falling: boolean, running: boolean, paused: boolean, sprinting = false) {
    if (this.stopped || document.hidden) return;
    if (paused && !this.dirty && Math.abs(this.cameraMode - (this.desiredMenu ? 0 : 1)) < 0.001) return;
    const safeDt = Math.min(dt, 0.1); if (!paused) { this.clock += safeDt; this.sprint += ((sprinting && running && !falling ? 1 : 0) - this.sprint) * (1 - Math.exp(-safeDt * 5)); }
    this.cameraMode += ((this.desiredMenu ? 0 : 1) - this.cameraMode) * Math.min(1, safeDt * 4);
    const menu = 1 - this.cameraMode;
    const narrow = this.width <= 700;
    const menuAimX = narrow ? -2 : -2 + 2.8 * Math.min(1.3,Math.max(.4,this.width / this.height / 1.6));
    const cameraDistance = narrow ? 1.1 : 1, boost = this.sprint * this.cameraMode;
    // A close menu camera presents the hero without changing the world's proportions.
    this.camera.position.set((9.2+(3.7-9.2)*menu+boost*1.1)*cameraDistance,(5-menu*2.2-boost*.55)*cameraDistance,(11.4-menu*16.4+boost*1.35)*cameraDistance);
    this.camera.lookAt(-1.2+(menuAimX+1.2)*menu,.8+menu*(narrow?-1.35:.55),1.5);
    this.camera.fov = 38 - (narrow ? 0 : menu * 7) + boost * (this.reducedMotion ? 4 : 8); this.camera.updateProjectionMatrix();
    if (!this.reducedMotion) this.camera.rotateZ(Math.sin(this.pedalAngle)*boost*.003);
    const moving = paused ? 0 : running ? speed : this.reducedMotion ? 0 : 2.3;
    this.worldTravel += moving * safeDt;
    if (moving > 0) for (const chunk of this.chunks) { chunk.position.z += moving * safeDt; if (chunk.position.z > 48) chunk.position.z -= 128; }
    this.pedalAngle += moving * safeDt * (.8 + this.sprint * .12);
    this.wheelAngle += moving * safeDt / (.664 * RIDER_SCALE);
    this.cyclist.animate(this.pedalAngle, this.sprint, this.wheelAngle);
    if(!paused && !this.reducedMotion){
      // Preview traffic stays behind the hero, leaving the bicycle silhouette clear.
      const trafficMin=this.desiredMenu?10:-51,trafficMax=this.desiredMenu?74:37,trafficSpan=trafficMax-trafficMin;
      this.cars.forEach(car=>{car.root.position.z+=(moving+car.velocity)*safeDt;if(car.root.position.z>trafficMax)car.root.position.z-=trafficSpan;if(car.root.position.z<trafficMin)car.root.position.z+=trafficSpan;car.phase-=Math.abs(car.velocity)*safeDt/.38;car.wheels.forEach(w=>w.rotation.y=car.phase);});
      this.walkers.forEach(w=>{w.root.position.z+=(moving+w.velocity)*safeDt;if(w.root.position.z>25)w.root.position.z-=66;if(w.root.position.z<-41)w.root.position.z+=66;w.phase+=safeDt*3.2;w.legs.forEach((l,i)=>l.rotation.x=Math.sin(w.phase+i*Math.PI)*.35);w.arms.forEach((a,i)=>a.rotation.x=-Math.sin(w.phase+i*Math.PI)*.27);w.root.position.y=.24+Math.abs(Math.sin(w.phase))*.023;});
    }
    if (!paused) {
      const sway = Math.sin(this.clock * (7 + instability * 8)) * instability * 0.39;
      const effortRoll = this.reducedMotion ? 0 : Math.sin(this.pedalAngle) * this.sprint * .055;
      this.rider.rotation.z += ((falling ? -1.5 : sway + effortRoll + Math.sin(this.clock * 2) * 0.009) - this.rider.rotation.z) * Math.min(1, safeDt * (falling ? 3 : 10));
      this.rider.position.x = -2+Math.sin(this.clock * 5) * instability * 0.38;
    }
    if (!falling && !running) this.rider.rotation.z *= 0.9;
    this.shadow.position.x = this.rider.position.x;
    if (!paused) {this.nature.update(this.reducedMotion ? 0 : this.clock, this.worldTravel);this.town.update(this.reducedMotion?0:this.clock);}
    if (!paused && !this.reducedMotion) this.clouds.position.x = Math.sin(this.clock * 0.015) * 4;
    if (this.particles.visible && !paused) {
      const attr = this.particles.geometry.getAttribute('position') as T.BufferAttribute;
      for (let i = 0; i < attr.count; i++) { const y = attr.getY(i) - safeDt * (this.settings.weather === 'rain' ? 16 : 1.8); attr.setY(i, y < 0 ? 18 : y); if (this.settings.weather === 'snow') attr.setX(i, attr.getX(i) + Math.sin(this.clock + i) * safeDt * 0.18); }
      attr.needsUpdate = true;
    }
    if(this.rain.visible && !paused)this.updateRain(safeDt,moving);
    if(this.sparkLife>0 && !paused){
      this.sparkLife=Math.max(0,this.sparkLife-safeDt);const age=.42-this.sparkLife,attr=this.sparks.geometry.getAttribute('position') as T.BufferAttribute;
      for(let i=0;i<32;i++){const a=i/32*Math.PI*2;attr.setXYZ(i,this.rider.position.x+Math.cos(a)*age*1.6,.26+Math.sin(a)*age*.7+age,2+RIDER_SCALE+Math.sin(a*3)*age*1.8);}
      attr.needsUpdate=true;(this.sparks.material as T.PointsMaterial).opacity=this.sparkLife/.42;
    }
    if (this.flash > 0) { this.flash = Math.max(0, this.flash - safeDt * 0.45); (this.scene.background as T.Color).copy(this.background).lerp(this.targetFlash, this.flash); }
    // Refresh the single shadow atlas at 15 Hz, rather than every rendered frame.
    if (this.frameCount % 4 === 0 && !paused) this.sun.shadow.needsUpdate = true;
    this.renderer.render(this.scene, this.camera); this.dirty = false; this.frameCount++; this.frameTime += dt;
    if (this.frameTime >= 2) {
      this.fps = Math.round(this.frameCount / this.frameTime); this.frameCount = 0; this.frameTime = 0;
      if (this.settings.quality === 'auto' && this.fps < 42 && this.qualityDpr > 0.8) { this.qualityDpr = Math.max(0.8, this.qualityDpr - 0.15); this.renderer.setPixelRatio(this.qualityDpr); }
    }
  }
  get stats() {
    const head=new T.Vector3(0,1.18,.23).applyMatrix4(this.body.matrixWorld).project(this.camera);
    const wheelAxis=(w:T.Group,axis:T.Vector3)=>axis.transformDirection(w.matrix).transformDirection(w.parent!.matrix).toArray();
    return { fps: this.fps, drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures, pixelRatio: this.renderer.getPixelRatio(), direction: '-Z', riderYaw: this.rider.rotation.y, riderScale:RIDER_SCALE, sprint:this.sprint, cameraFov:this.camera.fov, hips:this.cyclist.hips.toArray(), pedalAngle:this.pedalAngle, bicycleWheelAngle:this.wheelAngle, bicycleAxes:this.cyclist.wheels.map(w=>wheelAxis(w,new T.Vector3(0,0,1))), carAxes:this.cars.map(c=>c.wheels.map(w=>wheelAxis(w,new T.Vector3(0,1,0)))), riderScreen:{x:(head.x+1)/2,y:(1-head.y)/2}, traffic: this.cars.filter(c=>c.root.visible).map(c=>({z:c.root.position.z,velocity:c.velocity,model:c.root.userData.vehicle})), pedestrians:this.walkers.filter(w=>w.root.visible).map(w=>({z:w.root.position.z,step:w.phase})), rainStreaks:this.rain.visible?this.rain.geometry.drawRange.count/2:0, nature:this.nature.stats,town:this.settings.map==='town'?this.town.stats:null,riderId:RIDERS[this.settings.rider].id };
  }
  get mapName() { return MAPS.find(m => m.id === this.settings.map)!.name; }
  dispose() {
    this.observer.disconnect(); this.scene.traverse(obj => { if (obj instanceof T.Mesh) obj.geometry.dispose();if(obj instanceof T.SkinnedMesh)obj.skeleton.dispose(); }); this.nature.dispose(); this.town.dispose(); this.renderer.dispose();
  }
}
