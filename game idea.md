This is the Implementation Plan for "Goti: Daily Circuit," designed for the Antigravity (Agent-based) workflow.

Since you are targeting the Reddit Hackathon, this walkthrough focuses on the Pre-Calculation Architecture required to make physics work within Devvit’s constraints, combined with the specific "Virtual Hand" visual you requested.

Project Overview
Game Engine: React + SVG (SVG is better than Divs for round marbles and smooth scaling).

Physics Model: 2D Elastic Collision (Pool Billiards logic).

Input: "Slingshot" mechanic (Drag back to power up).

Visual Hook: A static hand asset that rotates and pulls back visually to mimic a real Indian street game throw.

Phase 1: The Physics Agent (The "Brain")
Goal: Create a pure mathematical simulation that calculates the entire turn in 10ms.

Antigravity/AI Prompt:

TypeScript
// Role: Physics Engine Architect
// Task: Create a 'physics.ts' utility for a marble game.

// 1. Define Interfaces:
interface Marble { id: string; x: number; y: number; vx: number; vy: number; radius: number; mass: number; type: 'STRIKER' | 'TARGET'; }
interface Hole { x: number; y: number; radius: number; }
interface Wall { x: number; y: number; width: number; height: number; bounceFactor: number; }

// 2. The Core Function:
// Function: simulateShot(striker: Marble, targets: Marble[], power: number, angle: number, holes: Hole[], walls: Wall[])
// Output: An array of 'Frame' objects. Each Frame contains the positions of ALL marbles at that time step.

// 3. Physics Rules:
// - Use Conservation of Momentum for Marble-to-Marble collisions (Elastic).
// - Apply friction (velocity * 0.98) per frame.
// - If a marble's center is inside a Hole's radius, mark it as 'potted' and remove from simulation.
// - Stop simulation when all marbles stop moving (velocity < 0.1).

// Constraint: Do not use any DOM/Window APIs. Pure Math only.
Phase 2: The Input Agent (The "Hand")
Goal: The visual flair. Instead of just a line, we want a hand grabbing the marble.

Visual Concept:

Asset: You need an image of a hand with the index finger and thumb pinching (top-down view).

Logic: The Hand is an "overlay" that sits on top of the Striker marble.

Animation: When the user drags, the Hand sprite moves away from the marble (opposite to the aim direction) to simulate "winding up" the arm.

Antigravity/AI Prompt:

TypeScript
// Role: UI Component Specialist
// Task: Create a 'SlingshotControl' React component.

// Props: 
// - marblePosition: {x, y}
// - onShoot: (power, angle) => void

// Logic:
// 1. Detect 'pointerdown' on the Striker marble.
// 2. On 'pointermove', calculate the distance between the marble and the pointer.
// 3. Render a dashed SVG line showing the trajectory (opposite to drag).
// 4. Render a 'HandCursor' image.
//    - Rotation: Matching the angle between pointer and marble.
//    - Position: Clamped to a max distance (e.g., 100px) from the marble.
// 5. On 'pointerup', trigger onShoot with the calculated vector.
Phase 3: The Environment Agent (The "Landscape")
Goal: Defining the daily challenge. Since we discussed "Circuit Boards," the holes will be "sockets" or "ports."

Antigravity/AI Prompt:

TypeScript
// Role: Level Designer
// Task: Create a 'LevelGenerator.ts' utility.

// Input: A Date object (for the daily seed).
// Output: A Level Configuration object containing:
// 1. holes: Array of coordinates (e.g., 4 corner pockets, 2 side pockets).
// 2. walls: Array of obstacles (e.g., a 'CPU Chip' in the center acting as a bumper).
// 3. frictionZones: Areas where friction is higher (Rough patches) or lower (Ice/Copper traces).

// Requirement: Ensure the 'Striker' always spawns in a safe 'D' zone at the bottom of the board.
Phase 4: Integration (The "Game Loop")
This is where you stitch it together in your App.tsx.

State:

gameState: 'AIMING' | 'ANIMATING' | 'GAME_OVER'

marbles: Array of current positions.

animationQueue: The array of frames returned by the Physics Agent.

The "Turn" Logic:

User Action: Drags Hand -> Releases.

Calculation: physics.simulateShot(...) runs instantly. It returns 300 frames of data (representing 5 seconds of movement).

Animation: You use a useEffect with a setInterval (or requestAnimationFrame wrapper provided by Devvit) to peel one frame off the animationQueue every 16ms and update the React State.

Result: The user sees a smooth movie of the physics calculation.

Phase 5: The Challenge & Scoring
To make it a "Reddit Daily Game," the scoring needs to be streak-based.

Rules to implement:

Potting: +100 points for every Target marble in a hole.

Foul: -50 points if the Striker goes in a hole (and the Striker respawns at start).

Efficiency: Bonus points for clearing the board in fewer shots.

The "Golden Shot": A specific hard-to-reach hole on the map gives 5x points.

Technical Checklist for Devvit
Before you finish, run this check:

[ ] SVG ViewBox: Ensure your game board uses a consistent coordinate system (e.g., viewBox="0 0 500 800"). This guarantees the physics match the visuals on all phone screen sizes.

[ ] Hitboxes: Make sure your collision radius in the math (Phase 1) matches the SVG circle radius in the UI. A common bug is the marble looking like it hit, but the math saying it missed.

[ ] Redis: Save the user's High Score to context.redis, not the whole game history.