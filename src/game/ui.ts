import type { World1State } from './gameState';
import { SHOW_DEBUG_HELPERS } from './worldConfig';

export class UI {
  private objectiveText: HTMLElement;
  private fractureItems: NodeListOf<Element>;
  private notification: HTMLElement;
  private interactionHint: HTMLElement;
  private inventoryPanel: HTMLElement;
  private inventoryItems: HTMLElement;
  private fadeOverlay: HTMLElement;
  private worldTitleOverlay: HTMLElement;
  private worldTitle: HTMLElement;
  private worldSubtitle: HTMLElement;
  private loadingOverlay: HTMLElement;
  private loadingText: HTMLElement;
  private debugPos: HTMLElement;

  private notifTimer: number | null = null;

  constructor() {
    this.objectiveText = document.getElementById('objective-text')!;
    this.fractureItems = document.querySelectorAll('.fracture-item');
    this.notification = document.getElementById('notification')!;
    this.interactionHint = document.getElementById('interaction-hint')!;
    this.inventoryPanel = document.getElementById('inventory-panel')!;
    this.inventoryItems = document.getElementById('inventory-items')!;
    this.fadeOverlay = document.getElementById('fade-overlay')!;
    this.worldTitleOverlay = document.getElementById('world-title-overlay')!;
    this.worldTitle = document.getElementById('world-title')!;
    this.worldSubtitle = document.getElementById('world-subtitle')!;
    this.loadingOverlay = document.getElementById('loading-overlay')!;
    this.loadingText = document.getElementById('loading-text')!;
    this.debugPos = document.getElementById('debug-pos')!;

    if (!SHOW_DEBUG_HELPERS) {
      document.getElementById('debug-panel')!.style.display = 'none';
    }
  }

  // ---- Objective ----

  setObjective(text: string): void {
    this.objectiveText.textContent = text;
  }

  // ---- Fractures ----

  updateFractures(state: World1State): void {
    this.fractureItems.forEach((el) => {
      const id = (el as HTMLElement).dataset.id;
      if (id === 'mirror') el.classList.toggle('found', state.mirrorFound);
      if (id === 'stairs') el.classList.toggle('found', state.stairsFound);
      if (id === 'clock') el.classList.toggle('found', state.clockFound);
    });
  }

  // ---- Notification ----

  showNotification(text: string, durationMs = 4000): void {
    this.notification.textContent = text;
    this.notification.style.opacity = '1';
    if (this.notifTimer !== null) clearTimeout(this.notifTimer);
    this.notifTimer = window.setTimeout(() => {
      this.notification.style.opacity = '0';
      this.notifTimer = null;
    }, durationMs);
  }

  // ---- Interaction Hint ----

  showInteractionHint(text: string): void {
    this.interactionHint.textContent = text;
    this.interactionHint.style.opacity = '1';
  }

  hideInteractionHint(): void {
    this.interactionHint.style.opacity = '0';
  }

  // ---- Inventory ----

  updateInventory(items: string[]): void {
    this.inventoryItems.innerHTML = items
      .map((i) => `<div class="inventory-item">${i}</div>`)
      .join('');
    this.inventoryPanel.classList.toggle('visible', items.length > 0);
  }

  // ---- Fade ----

  fadeOut(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      this.fadeOverlay.style.transition = `opacity ${durationMs}ms ease`;
      this.fadeOverlay.style.pointerEvents = 'all';
      requestAnimationFrame(() => {
        this.fadeOverlay.style.opacity = '1';
        setTimeout(resolve, durationMs + 50);
      });
    });
  }

  fadeIn(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      this.fadeOverlay.style.transition = `opacity ${durationMs}ms ease`;
      requestAnimationFrame(() => {
        this.fadeOverlay.style.opacity = '0';
        setTimeout(() => {
          this.fadeOverlay.style.pointerEvents = 'none';
          resolve();
        }, durationMs + 50);
      });
    });
  }

  // ---- World Title ----

  showWorldTitle(title: string, subtitle: string, showDuration = 5000): void {
    this.worldTitle.textContent = title;
    this.worldSubtitle.textContent = subtitle;
    this.worldTitleOverlay.style.opacity = '1';
    setTimeout(() => {
      this.worldTitleOverlay.style.opacity = '0';
    }, showDuration);
  }

  // ---- Coordinate Overlay ----

  showCoordinateOverlay(text: string, showDuration = 6000): void {
    const overlay = document.getElementById('coordinate-overlay')!;
    const textEl = document.getElementById('coordinate-text')!;
    textEl.textContent = text;
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.opacity = '0';
    }, showDuration);
  }

  // ---- Loading ----

  showLoading(text: string): void {
    this.loadingText.textContent = text;
    this.loadingOverlay.classList.remove('hidden');
    this.loadingOverlay.style.opacity = '1';
  }

  hideLoading(): void {
    this.loadingOverlay.style.opacity = '0';
    setTimeout(() => {
      this.loadingOverlay.classList.add('hidden');
    }, 800);
  }

  // ---- Debug position ----

  updateDebugPos(x: number, y: number, z: number): void {
    if (!SHOW_DEBUG_HELPERS) return;
    this.debugPos.textContent =
      `x: ${x.toFixed(1)}  y: ${y.toFixed(1)}  z: ${z.toFixed(1)}`;
  }

  // ---- Per-frame ----

  update(_dt: number): void {
    // reserved for future per-frame HUD animations
  }
}
