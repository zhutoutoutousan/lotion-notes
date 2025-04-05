declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera, EventDispatcher } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(camera: Camera, domElement?: HTMLElement);
    enabled: boolean;
    target: { x: number; y: number; z: number };
    enableDamping: boolean;
    dampingFactor: number;
    update(): void;
    dispose(): void;
  }
} 