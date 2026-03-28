import * as THREE from 'three';
import { WORLD_CONFIG, type TriggerConfig } from './worldConfig';
import type { GameState } from './gameState';

// ---------------------------------------------------------------------------
// ObjectiveMarkers – glowing beacon pillars + HUD direction arrow
// Provides strong visual guidance toward undiscovered objectives.
// ---------------------------------------------------------------------------

interface Beacon {
  key: 'mirrorFound' | 'stairsFound' | 'clockFound';
  label: string;
  position: THREE.Vector3;
  group: THREE.Group;
  pillar: THREE.Mesh;
  ring: THREE.Mesh;
  orb: THREE.Mesh;
  particles: THREE.Points;
}

export class ObjectiveMarkers {
  private beacons: Beacon[] = [];
  private gameState: GameState;
  private compassEl: HTMLElement;
  private compassArrow: HTMLElement;
  private compassLabel: HTMLElement;
  private compassDist: HTMLElement;

  constructor(gameState: GameState) {
    this.gameState = gameState;

    // ---- Build HUD compass indicator ----
    this.compassEl = document.createElement('div');
    this.compassEl.id = 'objective-compass';
    this.compassEl.innerHTML = `
      <div id="compass-arrow">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <defs>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <polygon points="20,4 30,32 20,26 10,32"
            fill="rgba(100,220,255,0.9)" stroke="rgba(100,220,255,0.4)" stroke-width="1"
            filter="url(#glow-filter)"/>
        </svg>
      </div>
      <div id="compass-label"></div>
      <div id="compass-dist"></div>
    `;
    document.getElementById('hud')!.appendChild(this.compassEl);

    this.compassArrow = document.getElementById('compass-arrow')!;
    this.compassLabel = document.getElementById('compass-label')!;
    this.compassDist = document.getElementById('compass-dist')!;
  }

  setupWorld1(worldRoot: THREE.Group): void {
    const triggers = WORLD_CONFIG.world1.triggers;
    const entries: { key: 'mirrorFound' | 'stairsFound' | 'clockFound'; cfg: TriggerConfig }[] = [
      { key: 'mirrorFound', cfg: triggers.mirrorZone },
      { key: 'stairsFound', cfg: triggers.stairsZone },
      { key: 'clockFound', cfg: triggers.clockZone },
    ];

    for (const { key, cfg } of entries) {
      const pos = new THREE.Vector3(cfg.position.x, cfg.position.y, cfg.position.z);
      const beacon = this.createBeacon(pos, cfg.label, key);
      worldRoot.add(beacon.group);
      this.beacons.push(beacon);
    }
  }

  private createBeacon(
    position: THREE.Vector3,
    label: string,
    key: 'mirrorFound' | 'stairsFound' | 'clockFound',
  ): Beacon {
    const group = new THREE.Group();
    group.position.copy(position);

    // ---- Vertical light pillar (tall, so it's visible from far away) ----
    const pillarHeight = 60;
    const pillarGeo = new THREE.CylinderGeometry(0.15, 0.4, pillarHeight, 8, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x44ddff,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = pillarHeight / 2;
    group.add(pillar);

    // ---- Glowing ring at the base ----
    const ringGeo = new THREE.TorusGeometry(1.8, 0.12, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x44ddff,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);

    // ---- Floating orb ----
    const orbGeo = new THREE.SphereGeometry(0.45, 24, 24);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0x88eeff,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 3.0;
    group.add(orb);

    // ---- Rising particles ----
    const particleCount = 40;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.4 + Math.random() * 1.2;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x88eeff,
      size: 0.18,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    return { key, label, position, group, pillar, ring, orb, particles };
  }

  update(playerPos: THREE.Vector3, camera: THREE.PerspectiveCamera): void {
    const t = Date.now() * 0.001;
    let nearestBeacon: Beacon | null = null;
    let nearestDist = Infinity;

    for (const beacon of this.beacons) {
      const found = this.gameState.world1[beacon.key];

      // Hide beacons for already-found objectives
      beacon.group.visible = !found;
      if (found) continue;

      // ---- Animate beacon ----
      const pulse = 0.8 + Math.sin(t * 2.5) * 0.2;

      // Pillar pulse
      (beacon.pillar.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 1.5) * 0.1;

      // Ring rotation + pulse
      beacon.ring.rotation.z = t * 0.5;
      beacon.ring.scale.setScalar(pulse);
      (beacon.ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 3) * 0.2;

      // Orb bob
      beacon.orb.position.y = 3.0 + Math.sin(t * 2) * 0.5;
      beacon.orb.scale.setScalar(0.9 + Math.sin(t * 3.5) * 0.15);

      // Rising particles animation
      const posArr = beacon.particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < posArr.length / 3; i++) {
        posArr[i * 3 + 1] += 0.03;
        if (posArr[i * 3 + 1] > 20) posArr[i * 3 + 1] = 0;
      }
      beacon.particles.geometry.attributes.position.needsUpdate = true;

      // Track nearest
      const dist = playerPos.distanceTo(beacon.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestBeacon = beacon;
      }
    }

    // ---- Update HUD compass ----
    if (nearestBeacon) {
      this.compassEl.style.opacity = '1';

      // Calculate angle from camera forward to beacon direction on XZ plane
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      cameraDir.y = 0;
      cameraDir.normalize();

      const toBeacon = new THREE.Vector3()
        .subVectors(nearestBeacon.position, playerPos);
      toBeacon.y = 0;
      toBeacon.normalize();

      // Signed angle using atan2
      const angle = Math.atan2(
        cameraDir.x * toBeacon.z - cameraDir.z * toBeacon.x,
        cameraDir.x * toBeacon.x + cameraDir.z * toBeacon.z,
      );

      this.compassArrow.style.transform = `rotate(${-angle * (180 / Math.PI)}deg)`;
      this.compassLabel.textContent = nearestBeacon.label;
      this.compassDist.textContent = `${Math.round(nearestDist)}m`;

      // Proximity glow intensity
      const proximity = THREE.MathUtils.clamp(1 - nearestDist / 50, 0, 1);
      const r = Math.round(100 + proximity * 55);
      const g = Math.round(220 + proximity * 35);
      this.compassEl.style.borderColor = `rgba(${r}, ${g}, 255, ${0.15 + proximity * 0.35})`;
    } else {
      this.compassEl.style.opacity = '0';
    }
  }

  clear(): void {
    this.beacons = [];
    this.compassEl.style.opacity = '0';
  }

  dispose(): void {
    for (const beacon of this.beacons) {
      beacon.group.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mat = mesh.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else (mat as THREE.Material).dispose();
        }
      });
    }
    this.beacons = [];
    this.compassEl.remove();
  }
}
