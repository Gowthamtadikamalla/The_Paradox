import * as THREE from 'three';
import { SparkRenderer } from '@sparkjsdev/spark';
import { WORLD_CONFIG } from './game/worldConfig';
import { GameState } from './game/gameState';
import { WorldManager } from './game/worldManager';
import { PlayerController } from './game/playerController';
import { TriggerSystem } from './game/triggerSystem';
import { InteractionSystem } from './game/interactionSystem';
import { TransitionSystem } from './game/transitionSystem';
import { ObjectiveMarkers } from './game/objectiveMarkers';
import { UI } from './game/ui';
import './styles/app.css';

// ---- Renderer ----

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app')!.appendChild(renderer.domElement);

// ---- Scene & Camera ----

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808);
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const clock = new THREE.Clock();

// SparkRenderer: proper splat depth sorting and float16 precision near camera
const spark = new SparkRenderer({ renderer });
camera.add(spark);
scene.add(camera);

// ---- Systems ----

const gameState = new GameState();
const ui = new UI();
const worldManager = new WorldManager(scene);
const player = new PlayerController(camera, renderer.domElement);
const triggerSystem = new TriggerSystem(gameState, ui);
const interactionSystem = new InteractionSystem(gameState, ui);
const objectiveMarkers = new ObjectiveMarkers(gameState);
const transitionSystem = new TransitionSystem(
  worldManager,
  player,
  gameState,
  ui,
  () => {
    triggerSystem.clear();
    interactionSystem.clear();
    objectiveMarkers.clear();
  },
  () => {
    // This is called after World 2 loads
    const root = worldManager.getWorldRoot();
    if (root) {
      interactionSystem.setupWorld2(root, () => {
        // Future logic for what happens after World 2 puzzle is solved
      });
    }
  }
);

// Expose to window for debugging
(window as any).gameDebug = {
  gameState, ui, worldManager, player, scene, triggerSystem, interactionSystem, objectiveMarkers, transitionSystem
};

// ---- Window resize ----

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- R key: reset to spawn ----

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && !transitionSystem.isTransitioning()) {
    const spawn =
      gameState.currentWorld === 'world1'
        ? WORLD_CONFIG.world1.spawn
        : WORLD_CONFIG.world2.spawn;
    player.resetToSpawn(spawn);
  }
});

// ---- Boot ----

async function init(): Promise<void> {
  ui.showLoading('Loading Dream District...');

  await worldManager.loadWorld('world1');
  const root = worldManager.getWorldRoot()!;

  player.setOctree(worldManager.getOctree());
  player.resetToSpawn(WORLD_CONFIG.world1.spawn);

  triggerSystem.setupWorld1(root, () => {
    transitionSystem.startTransition();
  });
  // We skip interactionSystem.setupWorld1 entirely since we don't need the totem anymore.
  objectiveMarkers.setupWorld1(root);



  gameState.currentWorld = 'world1';
  ui.setObjective('Find the dream fractures');
  ui.updateFractures(gameState.world1);

  ui.hideLoading();

  // ---- Game loop ----

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!transitionSystem.isTransitioning()) {
      player.update(dt);
      const pos = player.getPosition();
      triggerSystem.check(pos);
      interactionSystem.update(dt, pos, camera);
      objectiveMarkers.update(pos, camera);
      transitionSystem.checkPortal(pos);
      ui.updateDebugPos(pos.x, pos.y, pos.z);
    }

    transitionSystem.updateVisuals();
    ui.update(dt);
    renderer.render(scene, camera);
  });
}

init().catch((err) => {
  console.error('Failed to initialize game:', err);
  ui.showLoading('Error loading world. Check console.');
});
