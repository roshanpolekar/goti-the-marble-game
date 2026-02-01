// Physics Types for Goti: Daily Circuit

export interface Vector2 {
    x: number;
    y: number;
}

export interface Marble {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    mass: number;
    type: 'STRIKER' | 'TARGET';
    color: string;
    potted: boolean;
}

export interface Hole {
    id: string;
    x: number;
    y: number;
    radius: number;
    isGolden?: boolean;
}

export interface Wall {
    x: number;
    y: number;
    width: number;
    height: number;
    bounceFactor: number;
}

export interface FrictionZone {
    x: number;
    y: number;
    width: number;
    height: number;
    friction: number; // Multiplier: <1 = slippery, >1 = rough
}

export interface Frame {
    timestamp: number;
    marbles: MarbleState[];
    pottedThisFrame: string[];
}

export interface MarbleState {
    id: string;
    x: number;
    y: number;
    potted: boolean;
}

export interface SimulationResult {
    frames: Frame[];
    pottedMarbles: string[];
    strikerPotted: boolean;
    totalFrames: number;
}

export interface LevelConfig {
    holes: Hole[];
    walls: Wall[];
    frictionZones: FrictionZone[];
    targetMarbles: Marble[];
    strikerStart: Vector2;
    boardWidth: number;
    boardHeight: number;
    rings: { x: number; y: number; radius: number; }[];
}

export interface GameState {
    phase: 'AIMING' | 'ANIMATING' | 'TURN_END' | 'GAME_OVER';
    marbles: Marble[];
    score: number;
    shots: number;
    streak: number;
    currentFrame: number;
    animationQueue: Frame[];
}
