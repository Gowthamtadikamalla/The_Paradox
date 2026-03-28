import * as THREE from 'three';
import { WORLD_CONFIG, SHOW_DEBUG_HELPERS } from './worldConfig';
import type { GameState } from './gameState';
import type { UI } from './ui';

interface Interactable {
  id: string;
  position: THREE.Vector3;
  radius: number;
  hint: string;
  canInteract: () => boolean;
  onInteract: () => void;
}

export class InteractionSystem {
  private interactables: Interactable[] = [];
  private gameState: GameState;
  private ui: UI;
  private eJustPressed = false;

  // Time Dilation Puzzle State
  private w2WorldRoot: THREE.Group | null = null;
  private w2LeftPendulum: THREE.Object3D | null = null;
  private w2RightPendulum: THREE.Object3D | null = null;
  private w2Dampener: THREE.Mesh | null = null;
  private w2PendulumTime = 0;
  private w2SyncDuration = 0;
  private w2Camera: THREE.PerspectiveCamera | null = null;
  private w2OnSolved: (() => void) | null = null;

  constructor(gameState: GameState, ui: UI) {
    this.gameState = gameState;
    this.ui = ui;

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && !e.repeat) {
        this.eJustPressed = true;
      }
    });
  }

  setupWorld1(worldRoot: THREE.Group, onSolved: () => void): void {
    const cfg = WORLD_CONFIG.world1.totemPedestal;
    const pos = new THREE.Vector3(cfg.position.x, cfg.position.y, cfg.position.z);

    const pedestal = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8),
      new THREE.MeshBasicMaterial({ color: 0x554477 }),
    );
    base.position.y = 0.15;
    pedestal.add(base);

    const totem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 1.2, 6),
      new THREE.MeshBasicMaterial({ color: 0x9966cc }),
    );
    totem.position.y = 0.9;
    pedestal.add(totem);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.25, 0),
      new THREE.MeshBasicMaterial({ color: 0xcc88ff, transparent: true, opacity: 0.75 }),
    );
    crystal.position.y = 1.7;
    pedestal.add(crystal);

    pedestal.position.copy(pos);
    worldRoot.add(pedestal);

    this.interactables.push({
      id: 'totemPedestal',
      position: pos,
      radius: cfg.radius,
      hint: 'Press [E] to touch the Totem',
      canInteract: () => this.gameState.world1.chamberUnlocked && !this.gameState.world1.solved,
      onInteract: () => {
        this.gameState.world1.solved = true;
        this.gameState.addToInventory('Dream Symbol');
        this.ui.showNotification(
          '"Layer One complete. Gravity remembers the next path."',
          5000,
        );
        this.ui.updateInventory(this.gameState.inventory);
        this.ui.setObjective('Enter the portal');
        onSolved();
      },
    });

    if (SHOW_DEBUG_HELPERS) {
      const wire = new THREE.Mesh(
        new THREE.SphereGeometry(cfg.radius, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0x9944ff, wireframe: true, transparent: true, opacity: 0.2 }),
      );
      wire.position.copy(pos);
      worldRoot.add(wire);
    }
  }

  setupWorld2(worldRoot: THREE.Group, onSolved: () => void): void {
    const cfg = WORLD_CONFIG.world2;
    this.w2WorldRoot = worldRoot;
    this.w2OnSolved = onSolved;
    this.w2PendulumTime = 0;
    this.w2SyncDuration = 0;

    // Left Metronome (Blue)
    const leftGroup = new THREE.Group();
    leftGroup.position.copy(cfg.leftMetronomePos as THREE.Vector3);
    const leftBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x2222ff }));
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2), new THREE.MeshBasicMaterial({ color: 0x4444ff }));
    leftArm.position.y = -1;
    leftGroup.add(leftBase);
    leftGroup.add(leftArm);
    this.w2LeftPendulum = leftGroup;
    worldRoot.add(leftGroup);

    // Right Metronome (Red)
    const rightGroup = new THREE.Group();
    rightGroup.position.copy(cfg.rightMetronomePos as THREE.Vector3);
    const rightBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
    rightArm.position.y = -1;
    rightGroup.add(rightBase);
    rightGroup.add(rightArm);
    this.w2RightPendulum = rightGroup;
    worldRoot.add(rightGroup);

    // Gravity Dampener
    const dampenerGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const dampenerMat = new THREE.MeshBasicMaterial({ color: 0x44ffaa, wireframe: true });
    this.w2Dampener = new THREE.Mesh(dampenerGeo, dampenerMat);
    this.w2Dampener.position.copy(cfg.dampenerStartPos as THREE.Vector3);
    worldRoot.add(this.w2Dampener);

    const dampenerInteractable: Interactable = {
      id: 'dampener',
      position: this.w2Dampener.position, // We will update this dynamically
      radius: 3,
      hint: 'Press [E] to pick up the Gravity Dampener',
      canInteract: () => !this.gameState.world2.puzzleSolved,
      onInteract: () => {
        this.gameState.world2.dampenerPickedUp = !this.gameState.world2.dampenerPickedUp;
        if (this.gameState.world2.dampenerPickedUp) {
          if (this.w2Camera && this.w2Dampener) {
            this.w2Camera.add(this.w2Dampener);
            this.w2Dampener.position.set(0, -0.4, -1.0);
            dampenerInteractable.hint = 'Press [E] to drop the Dampener';
          }
        } else {
          if (this.w2WorldRoot && this.w2Dampener && this.w2Camera) {
            this.w2WorldRoot.add(this.w2Dampener);
            const worldPos = new THREE.Vector3();
            this.w2Camera.getWorldPosition(worldPos);
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.w2Camera.quaternion);
            worldPos.add(dir.multiplyScalar(1.5));
            worldPos.y = Math.max(0.3, worldPos.y - 0.5); // Ensure it doesn't fall below floor
            this.w2Dampener.position.copy(worldPos);
            dampenerInteractable.hint = 'Press [E] to pick up the Gravity Dampener';
          }
        }
      },
    };
    this.interactables.push(dampenerInteractable);
  }

  update(dt: number, playerPos: THREE.Vector3, camera?: THREE.PerspectiveCamera): void {
    if (camera && this.gameState.currentWorld === 'world2') {
      this.w2Camera = camera;
    }

    // Dynamic interactable positions (like the carried dampener)
    const dampenerInteractable = this.interactables.find(i => i.id === 'dampener');
    if (dampenerInteractable && this.w2Dampener) {
      if (this.gameState.world2.dampenerPickedUp) {
        dampenerInteractable.position.copy(playerPos);
      } else {
        dampenerInteractable.position.copy(this.w2Dampener.position);
      }
    }

    let nearest: Interactable | null = null;
    let nearestDist = Infinity;

    for (const inter of this.interactables) {
      if (!inter.canInteract()) continue;
      // Use player position for distance checking. For dropping dampener, player is always close to themselves.
      const interactPos = inter.id === 'dampener' && this.gameState.world2.dampenerPickedUp ? playerPos : inter.position;
      const dist = playerPos.distanceTo(interactPos);
      if (dist < inter.radius && dist < nearestDist) {
        nearest = inter;
        nearestDist = dist;
      }
    }

    if (nearest) {
      this.ui.showInteractionHint(nearest.hint);
      if (this.eJustPressed) {
        nearest.onInteract();
      }
    } else {
      this.ui.hideInteractionHint();
    }

    this.eJustPressed = false;

    // World 2 Time Dilation Puzzle Logic
    if (this.gameState.currentWorld === 'world2' && this.w2LeftPendulum && this.w2RightPendulum && this.w2Dampener && !this.gameState.world2.puzzleSolved) {
      this.w2PendulumTime += dt;
      
      const leftSpeed = 1.0;
      this.w2LeftPendulum.rotation.z = Math.sin(this.w2PendulumTime * leftSpeed) * 1.5;

      const dampenerWorldPos = new THREE.Vector3();
      this.w2Dampener.getWorldPosition(dampenerWorldPos);
      
      const rightPendulumWorldPos = new THREE.Vector3();
      this.w2RightPendulum.getWorldPosition(rightPendulumWorldPos);

      // Calculate distance on the XZ plane only so vertical floor dropping doesn't fail the check
      const distToDampener = Math.hypot(
        dampenerWorldPos.x - rightPendulumWorldPos.x,
        dampenerWorldPos.z - rightPendulumWorldPos.z
      );

      let rightSpeed: number;
      // If the dampener is within 2.5 units on the ground, snap to perfect sync!
      if (distToDampener <= 2.5) {
        rightSpeed = 1.0;
      } else {
        rightSpeed = 10.0 - (20.0 / (distToDampener + 1.0));
        rightSpeed = Math.max(1.0, rightSpeed);
      }

      this.w2RightPendulum.rotation.z = Math.sin(this.w2PendulumTime * rightSpeed) * 1.5;

      if (Math.abs(leftSpeed - rightSpeed) < 0.05) {
        this.w2SyncDuration += dt;
        if (this.w2SyncDuration >= 0.5) {
          this.gameState.world2.puzzleSolved = true;
          // Lock the dampener in place
          if (this.gameState.world2.dampenerPickedUp && this.w2Camera && this.w2WorldRoot) {
            this.gameState.world2.dampenerPickedUp = false;
            this.w2WorldRoot.add(this.w2Dampener);
            const worldPos = new THREE.Vector3();
            this.w2Camera.getWorldPosition(worldPos);
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.w2Camera.quaternion);
            worldPos.add(dir.multiplyScalar(1.5));
            worldPos.y = Math.max(0.3, worldPos.y - 0.5);
            this.w2Dampener.position.copy(worldPos);
          }
          
          console.log("[Audio] Clunk!");
          console.log("[Audio] Violent cracking ice!");
          
          this.ui.showCoordinateOverlay('The paradox is solved');
          if (this.w2OnSolved) this.w2OnSolved();
        }
      } else {
        this.w2SyncDuration = 0;
      }
    }
  }

  clear(): void {
    this.interactables = [];
    this.ui.hideInteractionHint();
    this.w2WorldRoot = null;
    this.w2LeftPendulum = null;
    this.w2RightPendulum = null;
    this.w2Dampener = null;
    this.w2Camera = null;
    this.w2OnSolved = null;
  }
}
