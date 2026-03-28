import * as THREE from 'three';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';
import type { Vec3 } from './worldConfig';

const GRAVITY = 30;
const JUMP_SPEED = 10;
const PLAYER_SPEED = 25;
const AIR_SPEED_MULT = 0.3;
const SUBSTEPS = 5;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_START_Y = 0.35;
const CAPSULE_END_Y = 1.7;

export class PlayerController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private capsule: Capsule;
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private onFloor = false;
  private octree: Octree | null = null;
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private keys: Record<string, boolean> = {};
  private frozen = false;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.capsule = new Capsule(
      new THREE.Vector3(0, CAPSULE_START_Y, 0),
      new THREE.Vector3(0, CAPSULE_END_Y, 0),
      CAPSULE_RADIUS,
    );

    domElement.addEventListener('click', () => {
      if (!this.frozen) domElement.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== domElement || this.frozen) return;
      this.euler.y -= e.movementX * 0.002;
      this.euler.x -= e.movementY * 0.002;
      this.euler.x = THREE.MathUtils.clamp(
        this.euler.x,
        -Math.PI / 2 + 0.01,
        Math.PI / 2 - 0.01,
      );
      this.camera.quaternion.setFromEuler(this.euler);
    });

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  setOctree(octree: Octree | null): void {
    this.octree = octree;
  }

  resetToSpawn(spawn: Vec3): void {
    this.capsule.start.set(spawn.x, spawn.y + CAPSULE_START_Y, spawn.z);
    this.capsule.end.set(spawn.x, spawn.y + CAPSULE_END_Y, spawn.z);
    this.velocity.set(0, 0, 0);
    this.onFloor = false;
    this.camera.position.copy(this.capsule.end);
  }

  getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

  freeze(): void {
    this.frozen = true;
    if (document.pointerLockElement) document.exitPointerLock();
  }

  unfreeze(): void {
    this.frozen = false;
  }

  isFrozen(): boolean {
    return this.frozen;
  }

  // ---- internal helpers ----

  private getForwardVector(): THREE.Vector3 {
    this.camera.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();
    return this.direction;
  }

  private getSideVector(): THREE.Vector3 {
    this.camera.getWorldDirection(this.direction);
    this.direction.y = 0;
    this.direction.normalize();
    this.direction.cross(this.camera.up);
    return this.direction;
  }

  private applyControls(dt: number): void {
    if (this.frozen) return;
    const speed = dt * (this.onFloor ? PLAYER_SPEED : PLAYER_SPEED * AIR_SPEED_MULT);

    if (this.keys['KeyW']) this.velocity.add(this.getForwardVector().multiplyScalar(speed));
    if (this.keys['KeyS']) this.velocity.add(this.getForwardVector().multiplyScalar(-speed));
    if (this.keys['KeyA']) this.velocity.add(this.getSideVector().multiplyScalar(-speed));
    if (this.keys['KeyD']) this.velocity.add(this.getSideVector().multiplyScalar(speed));

    if (this.onFloor && this.keys['Space']) {
      this.velocity.y = JUMP_SPEED;
    }
  }

  private collide(): void {
    if (!this.octree) return;
    const result = this.octree.capsuleIntersect(this.capsule);
    this.onFloor = false;

    if (result) {
      this.onFloor = result.normal.y > 0;
      if (!this.onFloor) {
        this.velocity.addScaledVector(result.normal, -result.normal.dot(this.velocity));
      } else {
        this.velocity.y = Math.max(0, this.velocity.y);
      }
      this.capsule.translate(result.normal.multiplyScalar(result.depth));
    }
  }

  private stepPhysics(dt: number): void {
    let damping = Math.exp(-4 * dt) - 1;
    if (!this.onFloor) {
      this.velocity.y -= GRAVITY * dt;
      damping *= 0.1;
    }
    this.velocity.addScaledVector(this.velocity, damping);

    const delta = this.velocity.clone().multiplyScalar(dt);
    this.capsule.translate(delta);
    this.collide();
  }

  update(dt: number): void {
    if (this.frozen) return;

    const subDt = dt / SUBSTEPS;
    for (let i = 0; i < SUBSTEPS; i++) {
      this.applyControls(subDt);
      this.stepPhysics(subDt);
    }

    // Respawn if fallen into the void
    if (this.capsule.end.y < -100) {
      this.velocity.set(0, 0, 0);
      this.capsule.start.y = 20 + CAPSULE_START_Y;
      this.capsule.end.y = 20 + CAPSULE_END_Y;
    }

    this.camera.position.copy(this.capsule.end);
  }
}
