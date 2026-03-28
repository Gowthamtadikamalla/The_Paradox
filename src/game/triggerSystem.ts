import * as THREE from 'three';
import { WORLD_CONFIG, SHOW_DEBUG_HELPERS, type Vec3 } from './worldConfig';
import type { GameState } from './gameState';
import type { UI } from './ui';

interface TriggerZone {
  id: string;
  position: THREE.Vector3;
  radius: number;
  fired: boolean;
  onEnter: () => void;
}

export class TriggerSystem {
  private zones: TriggerZone[] = [];
  private chamberGlow: THREE.Mesh | null = null;
  private debugMeshes: THREE.Object3D[] = [];
  private gameState: GameState;
  private ui: UI;

  constructor(gameState: GameState, ui: UI) {
    this.gameState = gameState;
    this.ui = ui;
  }

  setupWorld1(worldRoot: THREE.Group, onAllFound: () => void): void {
    const triggers = WORLD_CONFIG.world1.triggers;
    const entries: { key: 'mirrorFound' | 'stairsFound' | 'clockFound'; cfg: typeof triggers.mirrorZone }[] = [
      { key: 'mirrorFound', cfg: triggers.mirrorZone },
      { key: 'stairsFound', cfg: triggers.stairsZone },
      { key: 'clockFound', cfg: triggers.clockZone },
    ];

    for (const { key, cfg } of entries) {
      const pos = new THREE.Vector3(cfg.position.x, cfg.position.y, cfg.position.z);
      this.zones.push({
        id: key,
        position: pos,
        radius: cfg.radius,
        fired: false,
        onEnter: () => {
          this.gameState.world1[key] = true;
          this.ui.showNotification(cfg.clue, 5000);
          this.ui.updateFractures(this.gameState.world1);
          
          if (this.gameState.checkAllCluesFound()) {
            onAllFound();
          }
        },
      });

      if (SHOW_DEBUG_HELPERS) {
        const marker = this.makeWireMarker(pos, cfg.radius, 0x00ff88);
        worldRoot.add(marker);
        this.debugMeshes.push(marker);
      }
    }
  }

  check(playerPos: THREE.Vector3): void {
    for (const zone of this.zones) {
      if (zone.fired) continue;
      if (playerPos.distanceTo(zone.position) < zone.radius) {
        zone.fired = true;
        zone.onEnter();
      }
    }

    if (this.chamberGlow) {
      const s = 1 + Math.sin(Date.now() * 0.003) * 0.25;
      this.chamberGlow.scale.setScalar(s);
    }
  }

  clear(): void {
    this.zones = [];
    this.chamberGlow = null;
    this.debugMeshes = [];
  }

  private makeWireMarker(pos: THREE.Vector3, radius: number, color: number): THREE.Mesh {
    const geo = new THREE.SphereGeometry(radius, 16, 8);
    const mat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(pos);
    return m;
  }
}
