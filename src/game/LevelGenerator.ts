// Level Generator for Goti - Traditional Indian Marble Game
// Random layout generation for unique daily games

import { Marble, LevelConfig, FrictionZone, Wall } from '../physics/types';

// Seeded random number generator
function seededRandom(seed: number): () => number {
    return () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
}

// Global random marble colors
const MARBLE_COLORS = [
    '#e74c3c', // Red
    '#3498db', // Blue
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Teal
    '#e91e63', // Pink
    '#00bcd4', // Cyan
    '#ff5722', // Deep Orange
    '#8bc34a', // Light Green
];

const BOARD_WIDTH = 500;
const BOARD_HEIGHT = 700;
const MARBLE_RADIUS = 10;

export const RING_CENTER_X = BOARD_WIDTH / 2;
export const RING_CENTER_Y = BOARD_HEIGHT * 0.4;
export const RING_RADIUS = 120;
export const SHOOTING_LINE_Y = BOARD_HEIGHT - 150;

// Generate a random level (or seeded if provided)
// Generate a level based on STAGE
export function generateLevel(stage: number = 1): LevelConfig {
    // Stage 1: Random Single Ring Pattern
    // Stage 2: Double Circle Pattern (15 marbles each)

    // Seeded random for consistency within a game session if needed, 
    // but for now we want fresh random layouts on retry, so we use Math.random()
    const random = seededRandom(Math.random() * 100000);

    const holes: never[] = [];
    const targetMarbles: Marble[] = [];
    const rings: { x: number; y: number; radius: number; }[] = [];
    const walls: Wall[] = [];
    const frictionZones: FrictionZone[] = [];

    if (stage === 2) {
        // --- STAGE 2: DOUBLE CIRCLE ---
        // Two overlapping circles vertically
        const topRing = { x: RING_CENTER_X, y: RING_CENTER_Y - 80, radius: 90 };
        const bottomRing = { x: RING_CENTER_X, y: RING_CENTER_Y + 80, radius: 90 };
        rings.push(topRing, bottomRing);

        const ringsConfig = [topRing, bottomRing];

        let marbleCount = 0;
        ringsConfig.forEach(ring => {
            for (let i = 0; i < 15; i++) {
                // Random scatter within this ring
                const r = Math.sqrt(random()) * (ring.radius - 15);
                const theta = random() * Math.PI * 2;

                targetMarbles.push({
                    id: `marble-${marbleCount++}`,
                    x: ring.x + Math.cos(theta) * r,
                    y: ring.y + Math.sin(theta) * r,
                    vx: 0,
                    vy: 0,
                    radius: MARBLE_RADIUS,
                    mass: 0.8,
                    type: 'TARGET',
                    color: MARBLE_COLORS[marbleCount % MARBLE_COLORS.length],
                    potted: false,
                });
            }
        });

    } else if (stage === 3) {
        // --- STAGE 3: SIDE-BY-SIDE + WALL ---
        // Two rings horizontally separated
        const leftRing = { x: RING_CENTER_X - 110, y: RING_CENTER_Y, radius: 95 };
        const rightRing = { x: RING_CENTER_X + 110, y: RING_CENTER_Y, radius: 95 };
        rings.push(leftRing, rightRing);

        // Central Wall to block direct shots between them
        walls.push({
            x: RING_CENTER_X - 5,
            y: RING_CENTER_Y - 50,
            width: 10,
            height: 100,
            bounceFactor: 0.5
        });

        const ringsConfig = [leftRing, rightRing];
        let marbleCount = 0;

        ringsConfig.forEach(ring => {
            for (let i = 0; i < 15; i++) {
                // Random scatter within this ring
                const r = Math.sqrt(random()) * (ring.radius - 15);
                const theta = random() * Math.PI * 2;

                targetMarbles.push({
                    id: `marble-${marbleCount++}`,
                    x: ring.x + Math.cos(theta) * r,
                    y: ring.y + Math.sin(theta) * r,
                    vx: 0,
                    vy: 0,
                    radius: MARBLE_RADIUS,
                    mass: 0.8,
                    type: 'TARGET',
                    color: MARBLE_COLORS[marbleCount % MARBLE_COLORS.length],
                    potted: false,
                });
            }
        });

    } else if (stage === 4) {
        // --- STAGE 4: GUARDED CIRCLE (Movable Striker) ---
        // Single central circle
        const mainRing = { x: RING_CENTER_X, y: RING_CENTER_Y, radius: RING_RADIUS };
        rings.push(mainRing);

        const r = RING_RADIUS;
        const gap = 30; // Gap between ring and wall
        const wLen = 60; // Wall length
        const wThick = 10;

        // 4 Deflector Walls
        walls.push(
            // Top
            { x: RING_CENTER_X - wLen / 2, y: RING_CENTER_Y - r - gap, width: wLen, height: wThick, bounceFactor: 0.8 },
            // Bottom
            { x: RING_CENTER_X - wLen / 2, y: RING_CENTER_Y + r + gap - wThick, width: wLen, height: wThick, bounceFactor: 0.8 },
            // Left
            { x: RING_CENTER_X - r - gap, y: RING_CENTER_Y - wLen / 2, width: wThick, height: wLen, bounceFactor: 0.8 },
            // Right
            { x: RING_CENTER_X + r + gap - wThick, y: RING_CENTER_Y - wLen / 2, width: wThick, height: wLen, bounceFactor: 0.8 }
        );

        // Random Scatter in center
        const numMarbles = 20;
        for (let i = 0; i < numMarbles; i++) {
            const range = Math.sqrt(random()) * (r - 15);
            const theta = random() * Math.PI * 2;
            const x = RING_CENTER_X + Math.cos(theta) * range;
            const y = RING_CENTER_Y + Math.sin(theta) * range;

            targetMarbles.push({
                id: `marble-${i}`,
                x, y, vx: 0, vy: 0,
                radius: MARBLE_RADIUS,
                mass: 0.8,
                type: 'TARGET',
                color: MARBLE_COLORS[i % MARBLE_COLORS.length],
                potted: false,
            });
        }
    } else if (stage === 5) {
        // --- STAGE 5: THE CHAOS GRID ---
        const mainRing = { x: RING_CENTER_X, y: RING_CENTER_Y, radius: RING_RADIUS };
        rings.push(mainRing);

        // Bumper Grid (The Chaos) - INSIDE THE RING
        const bumperSize = 15;
        // Center the grid around the ring center (280)
        // Row 1: y=220, Row 2: y=280, Row 3: y=340
        const gridCY = RING_CENTER_Y;
        const spacingX = 70; // Slightly tighter to look nice inside
        const spacingY = 60;

        // Row 1
        walls.push(
            { x: RING_CENTER_X - spacingX, y: gridCY - spacingY, width: bumperSize, height: bumperSize, bounceFactor: 1.2 },
            { x: RING_CENTER_X, y: gridCY - spacingY, width: bumperSize, height: bumperSize, bounceFactor: 1.2 },
            { x: RING_CENTER_X + spacingX, y: gridCY - spacingY, width: bumperSize, height: bumperSize, bounceFactor: 1.2 }
        );

        // Row 2 (Offset)
        walls.push(
            { x: RING_CENTER_X - spacingX / 2, y: gridCY, width: bumperSize, height: bumperSize, bounceFactor: 1.2 },
            { x: RING_CENTER_X + spacingX / 2, y: gridCY, width: bumperSize, height: bumperSize, bounceFactor: 1.2 }
        );

        // Row 3
        walls.push(
            { x: RING_CENTER_X - spacingX, y: gridCY + spacingY, width: bumperSize, height: bumperSize, bounceFactor: 1.2 },
            { x: RING_CENTER_X, y: gridCY + spacingY, width: bumperSize, height: bumperSize, bounceFactor: 1.2 },
            { x: RING_CENTER_X + spacingX, y: gridCY + spacingY, width: bumperSize, height: bumperSize, bounceFactor: 1.2 }
        );

        // Dense Scatter
        const numMarbles = 25;
        for (let i = 0; i < numMarbles; i++) {
            const range = Math.sqrt(random()) * (RING_RADIUS - 15);
            const theta = random() * Math.PI * 2;
            const x = RING_CENTER_X + Math.cos(theta) * range;
            const y = RING_CENTER_Y + Math.sin(theta) * range;

            targetMarbles.push({
                id: `marble-${i}`,
                x, y, vx: 0, vy: 0,
                radius: MARBLE_RADIUS,
                mass: 0.8,
                type: 'TARGET',
                color: MARBLE_COLORS[i % MARBLE_COLORS.length],
                potted: false,
            });
        }
    } else {
        // --- STAGE 1: SINGLE RING (Random Pattern) ---
        // Standard Single Circle
        const mainRing = { x: RING_CENTER_X, y: RING_CENTER_Y, radius: RING_RADIUS };
        rings.push(mainRing);

        // Choose a random pattern from our previous set (Spiral, Cluster, Scatter)
        const patternType = Math.floor(random() * 3);
        const numMarbles = 30;

        for (let i = 0; i < numMarbles; i++) {
            let x = RING_CENTER_X;
            let y = RING_CENTER_Y;

            if (patternType === 0) {
                // Spiral
                const t = i / numMarbles;
                const spiralAngle = t * Math.PI * 6 + random() * 4;
                const spiralRadius = 15 + t * (RING_RADIUS - 30) + (random() - 0.5) * 40;
                const jitterX = (random() - 0.5) * 25;
                const jitterY = (random() - 0.5) * 25;
                x = RING_CENTER_X + Math.cos(spiralAngle) * spiralRadius + jitterX;
                y = RING_CENTER_Y + Math.sin(spiralAngle) * spiralRadius + jitterY;
            }
            else if (patternType === 1) {
                // Clusters
                const numClusters = 4;
                const clusterIdx = i % numClusters;
                const clusterAngle = (clusterIdx / numClusters) * Math.PI * 2 + random() * 0.5;
                const clusterDist = 60 + random() * 20;
                const cx = RING_CENTER_X + Math.cos(clusterAngle) * clusterDist;
                const cy = RING_CENTER_Y + Math.sin(clusterAngle) * clusterDist;

                const r = random() * 30; // Within cluster
                const theta = random() * Math.PI * 2;
                x = cx + Math.cos(theta) * r;
                y = cy + Math.sin(theta) * r;
            }
            else {
                // Random Scatter
                const r = Math.sqrt(random()) * (RING_RADIUS - 15);
                const theta = random() * Math.PI * 2;
                x = RING_CENTER_X + Math.cos(theta) * r;
                y = RING_CENTER_Y + Math.sin(theta) * r;
            }

            // Clamp to ring
            const distFromCenter = Math.sqrt((x - RING_CENTER_X) ** 2 + (y - RING_CENTER_Y) ** 2);
            if (distFromCenter > RING_RADIUS - 15) {
                const angle = Math.atan2(y - RING_CENTER_Y, x - RING_CENTER_X);
                const r = RING_RADIUS - 15 - random() * 10;
                x = RING_CENTER_X + Math.cos(angle) * r;
                y = RING_CENTER_Y + Math.sin(angle) * r;
            }

            targetMarbles.push({
                id: `marble-${i}`,
                x,
                y,
                vx: 0,
                vy: 0,
                radius: MARBLE_RADIUS,
                mass: 0.8,
                type: 'TARGET',
                color: MARBLE_COLORS[i % MARBLE_COLORS.length],
                potted: false,
            });
        }
    }


    const strikerStart = { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT - 100 };

    return {
        holes,
        walls,
        frictionZones,
        targetMarbles,
        strikerStart,
        boardWidth: BOARD_WIDTH,
        boardHeight: BOARD_HEIGHT,
        rings
    };
}

export function getDayNumber(): number {
    const hackathonStart = new Date('2026-01-15');
    const today = new Date();
    const diffTime = today.getTime() - hackathonStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
}
