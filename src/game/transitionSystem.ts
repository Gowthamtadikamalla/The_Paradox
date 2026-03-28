import * as THREE from 'three';
import { WORLD_CONFIG, SHOW_DEBUG_HELPERS } from './worldConfig';
import type { WorldManager } from './worldManager';
import type { PlayerController } from './playerController';
import type { GameState } from './gameState';
import type { UI } from './ui';

export class TransitionSystem {
  private worldManager: WorldManager;
  private player: PlayerController;
  private gameState: GameState;
  private ui: UI;
  private beforeTransition: () => void;
  private afterTransition: () => void;

  private portalPos: THREE.Vector3 | null = null;
  private portalRadius = 0;
  private portalActive = false;
  private portalGroup: THREE.Group | null = null;
  private _transitioning = false;

  constructor(
    worldManager: WorldManager,
    player: PlayerController,
    gameState: GameState,
    ui: UI,
    beforeTransition: () => void,
    afterTransition: () => void,
  ) {
    this.worldManager = worldManager;
    this.player = player;
    this.gameState = gameState;
    this.ui = ui;
    this.beforeTransition = beforeTransition;
    this.afterTransition = afterTransition;
  }

  // Portal logic removed because we now transition directly.
  activatePortal(worldRoot: THREE.Group): void {
    // No-op
  }

  checkPortal(playerPos: THREE.Vector3): void {
    // No-op
  }

  updateVisuals(): void {
    // No-op
  }

  isTransitioning(): boolean {
    return this._transitioning;
  }

  addDebugPortalMarker(worldRoot: THREE.Group): void {
    // No-op
  }

  public async startTransition(): Promise<void> {
    if (this._transitioning) return;
    this._transitioning = true;
    this.player.freeze();

    this.ui.showNotification('"Reality fractures. The transition begins."', 4000);
    await this.ui.fadeOut(2000);

    this.beforeTransition();
    this.clearPortal();
    this.worldManager.unloadCurrentWorld();

    this.ui.showLoading('Loading Signal Observatory...');
    await this.worldManager.loadWorld('world2');
    this.ui.hideLoading();

    this.player.setOctree(this.worldManager.getOctree());
    this.player.resetToSpawn(WORLD_CONFIG.world2.spawn);
    this.gameState.currentWorld = 'world2';
    
    this.afterTransition();

    await this.ui.fadeIn(1500);

    this.ui.showWorldTitle(
      'Layer Two: The Signal Observatory.',
      'Gravity never forgot the path.',
    );
    this.ui.setObjective('Explore the Signal Observatory');

    this.player.unfreeze();
    this._transitioning = false;
  }

  private clearPortal(): void {
    // No-op
  }
}
