import * as THREE from 'three';
import { SplatMesh } from '@sparkjsdev/spark';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { WORLD_CONFIG, type WorldBaseConfig } from './worldConfig';

export class WorldManager {
  private scene: THREE.Scene;
  private worldRoot: THREE.Group | null = null;
  private splatMesh: SplatMesh | null = null;
  private octree: Octree | null = null;
  private gltfLoader = new GLTFLoader();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async loadWorld(worldId: string): Promise<void> {
    const config: WorldBaseConfig =
      worldId === 'world1' ? WORLD_CONFIG.world1 : WORLD_CONFIG.world2;

    this.worldRoot = new THREE.Group();
    this.worldRoot.name = `world-${worldId}`;
    this.scene.add(this.worldRoot);

    const splat = new SplatMesh({ url: config.spz });
    this.splatMesh = splat;
    this.worldRoot.add(splat);

    const gltfPromise = this.gltfLoader.loadAsync(config.collider);

    const [, gltf] = await Promise.all([splat.initialized, gltfPromise]);

    gltf.scene.visible = false;
    gltf.scene.updateMatrixWorld(true);
    this.worldRoot.add(gltf.scene);

    this.octree = new Octree();
    this.octree.fromGraphNode(gltf.scene);
  }

  unloadCurrentWorld(): void {
    if (!this.worldRoot) return;

    if (this.splatMesh) {
      this.splatMesh.dispose();
      this.splatMesh = null;
    }

    this.worldRoot.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else if (mat) {
          (mat as THREE.Material).dispose();
        }
      }
    });

    this.scene.remove(this.worldRoot);
    this.worldRoot = null;
    this.octree = null;
  }

  getOctree(): Octree | null {
    return this.octree;
  }

  getWorldRoot(): THREE.Group | null {
    return this.worldRoot;
  }
}
