// ---------------------------------------------------------------------------
// World Config -- all positions, radii, and asset paths in one place.
// Adjust coordinates here after inspecting your actual world geometry.
// Enable SHOW_DEBUG_HELPERS to render wireframe markers at every zone.
// ---------------------------------------------------------------------------

export const SHOW_DEBUG_HELPERS = true;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TriggerConfig {
  position: Vec3;
  radius: number;
  clue: string;
  label: string;
}

export interface ZoneConfig {
  position: Vec3;
  radius: number;
}

export interface WorldBaseConfig {
  spz: string;
  collider: string;
  spawn: Vec3;
}

export interface World1Config extends WorldBaseConfig {
  triggers: {
    mirrorZone: TriggerConfig;
    stairsZone: TriggerConfig;
    clockZone: TriggerConfig;
  };
  chamberMarker: ZoneConfig;
  totemPedestal: ZoneConfig;
  portalToWorld2: ZoneConfig;
}

export interface World2Config extends WorldBaseConfig {
  leftMetronomePos: Vec3;
  rightMetronomePos: Vec3;
  dampenerStartPos: Vec3;
}

export const WORLD_CONFIG: { world1: World1Config; world2: World2Config } = {

  // ---- WORLD 1: Dream City Paradox Architecture ----
  world1: {
    spz: '/worlds/world1.spz',
    collider: '/worlds/world1-collider.glb',

    // Player spawn -- place in an open area of your world
    spawn: { x: 9.7, y: 4.3, z: 10.2 },

    // Trigger zones -- move these onto your world's landmarks
    triggers: {
      mirrorZone: {
        position: { x: 0.5, y: -7.3, z: -10.4 },
        radius: 4,
        clue: '"Reflection lies. Truth is where symmetry breaks."',
        label: 'Anomaly Origin',
      },
      stairsZone: {
        position: { x: -4.5, y: 4.0, z: -0.4 },
        radius: 4,
        clue: '"The path is not forward. The path is upward."',
        label: 'Rotating Room',
      },
      clockZone: {
        position: { x: 0.5, y: 1.7, z: 1.4 },
        radius: 4,
        clue: '"When time stops, the door appears."',
        label: 'Clock Courtyard',
      },
    },

    // Chamber glow -- visible beacon after all 3 clues found
    chamberMarker: {
      position: { x: -5, y: 2, z: -30 },
      radius: 5,
    },

    // Totem pedestal -- interact with E after chamber unlocks
    totemPedestal: {
      position: { x: -5, y: 2, z: -33 },
      radius: 3,
    },

    // Portal to World 2 -- activates after totem interaction
    portalToWorld2: {
      position: { x: -5, y: 2, z: -40 },
      radius: 3,
    },
  },

  // ---- WORLD 2: Desolate Exoplanet Observatory ----
  world2: {
    spz: '/worlds/world2.spz',
    collider: '/worlds/world2-collider.glb',
    spawn: { x: 0, y: 5, z: 0 },
    // Center objective at x: 1.1, y: 1.6, z: 5.5
    leftMetronomePos: { x: -0.9, y: 2.1, z: 5.5 },  // 2 units left
    rightMetronomePos: { x: 3.1, y: 2.1, z: 5.5 },  // 2 units right
    dampenerStartPos: { x: 1.1, y: 2.1, z: 7.5 },   // 2 units forward
  },
};
