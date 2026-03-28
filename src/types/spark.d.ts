declare module '@sparkjsdev/spark' {
  import type { Object3D, Color, WebGLRenderer, Clock } from 'three';

  export interface SplatMeshOptions {
    url?: string;
    fileBytes?: Uint8Array | ArrayBuffer;
    fileType?: string;
    onLoad?: (mesh: SplatMesh) => void;
    onFrame?: (params: { mesh: SplatMesh; time: number; deltaTime: number }) => void;
    maxSplats?: number;
    editable?: boolean;
  }

  export class SplatMesh extends Object3D {
    constructor(options?: SplatMeshOptions);
    initialized: Promise<void>;
    isInitialized: boolean;
    recolor: Color;
    opacity: number;
    numSplats: number;
    dispose(): void;
  }

  export interface SparkRendererOptions {
    renderer: WebGLRenderer;
    clock?: Clock;
    autoUpdate?: boolean;
    maxStdDev?: number;
    enable2DGS?: boolean;
  }

  export class SparkRenderer extends Object3D {
    constructor(options: SparkRendererOptions);
    dispose(): void;
  }
}
