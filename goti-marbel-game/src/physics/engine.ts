// Physics Engine for Goti - Traditional Indian Marble Game
// HIGH FRICTION dirt ground - marbles don't roll easily!

import { Marble, Wall, FrictionZone, Frame, SimulationResult } from './types';

const FRICTION = 0.94; // HIGH friction
const MIN_VELOCITY = 0.08; // Stop threshold
const MAX_FRAMES = 600;

// Sub-stepping for collision accuracy at high speeds
const SUB_STEPS = 8;
const SUB_TIME_STEP = 1 / SUB_STEPS;

/**
 * Calculate distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Check if a marble is OUTSIDE ALL rings (knocked out = collected!)
 */
function isOutsideAllRings(marble: Marble, rings: { x: number, y: number, radius: number }[]): boolean {
    // Marble is SAFE if it is strictly inside ANY ring
    for (const ring of rings) {
        const distFromCenter = distance(marble.x, marble.y, ring.x, ring.y);
        // If inside this ring, it's NOT outside
        if (distFromCenter <= ring.radius + marble.radius * 0.5) {
            return false;
        }
    }
    // If we get here, it's outside ALL rings
    return true;
}

/**
 * Handle collision between two marbles (elastic collision)
 */
function resolveMarbleCollision(m1: Marble, m2: Marble): void {
    const dx = m2.x - m1.x;
    const dy = m2.y - m1.y;
    const dist = distance(m1.x, m1.y, m2.x, m2.y);

    if (dist === 0) return;

    // Normal vector
    const nx = dx / dist;
    const ny = dy / dist;

    // Relative velocity
    const dvx = m1.vx - m2.vx;
    const dvy = m1.vy - m2.vy;

    // Relative velocity along collision normal
    const dvn = dvx * nx + dvy * ny;

    // Don't resolve if moving apart
    if (dvn < 0) return;

    // Collision impulse
    const impulse = dvn / (1 / m1.mass + 1 / m2.mass);

    // Apply impulse with energy loss (glass marble collision on dirt)
    const restitution = 0.75; // Less bouncy on dirt
    m1.vx -= (impulse / m1.mass) * nx * restitution;
    m1.vy -= (impulse / m1.mass) * ny * restitution;
    m2.vx += (impulse / m2.mass) * nx * restitution;
    m2.vy += (impulse / m2.mass) * ny * restitution;

    // Separate overlapping marbles
    const overlap = (m1.radius + m2.radius) - dist;
    if (overlap > 0) {
        const separation = overlap / 2 + 0.3;
        m1.x -= nx * separation;
        m1.y -= ny * separation;
        m2.x += nx * separation;
        m2.y += ny * separation;
    }
}

/**
 * Handle board boundary collision
 */
function resolveBoundaryCollision(marble: Marble, boardWidth: number, boardHeight: number): void {
    const bounceFactor = 0.3; // Very low bounce - dirt edge
    const padding = 15;

    if (marble.x - marble.radius < padding) {
        marble.x = padding + marble.radius;
        marble.vx = -marble.vx * bounceFactor;
    }
    if (marble.x + marble.radius > boardWidth - padding) {
        marble.x = boardWidth - padding - marble.radius;
        marble.vx = -marble.vx * bounceFactor;
    }
    if (marble.y - marble.radius < padding) {
        marble.y = padding + marble.radius;
        marble.vy = -marble.vy * bounceFactor;
    }
    if (marble.y + marble.radius > boardHeight - padding) {
        marble.y = boardHeight - padding - marble.radius;
        marble.vy = -marble.vy * bounceFactor;
    }
}

/**
 * Handle collision with internal walls (rectangles)
 */
function resolveWallCollision(marble: Marble, wall: Wall): void {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(wall.x, Math.min(marble.x, wall.x + wall.width));
    const closestY = Math.max(wall.y, Math.min(marble.y, wall.y + wall.height));

    const dx = marble.x - closestX;
    const dy = marble.y - closestY;
    const distSq = dx * dx + dy * dy;

    // Check collision
    if (distSq < marble.radius * marble.radius && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const normalX = dx / dist;
        const normalY = dy / dist;

        // Penetration depth
        const overlap = marble.radius - dist;

        // Push out
        marble.x += normalX * overlap;
        marble.y += normalY * overlap;

        // Reflect velocity (elastic collision)
        // v' = v - 2 * (v . n) * n
        const dot = marble.vx * normalX + marble.vy * normalY;

        // Only reflect if moving towards wall
        if (dot < 0) {
            const bounce = wall.bounceFactor || 0.5;
            marble.vx -= 2 * dot * normalX * bounce;
            marble.vy -= 2 * dot * normalY * bounce;
        }
    }
}

/**
 * Check if all marbles have stopped moving
 */
function allStopped(marbles: Marble[]): boolean {
    return marbles.every(m =>
        m.potted || (Math.abs(m.vx) < MIN_VELOCITY && Math.abs(m.vy) < MIN_VELOCITY)
    );
}

/**
 * Simulate a complete shot
 */
export function simulateShot(
    striker: Marble,
    targets: Marble[],
    power: number,
    angle: number,
    _holes: any[],
    walls: Wall[],
    _frictionZones: FrictionZone[],
    boardWidth: number,
    boardHeight: number,
    rings: { x: number, y: number, radius: number }[] = [], // New rings param
    objective: 'KNOCK_OUT' | 'KNOCK_IN' = 'KNOCK_OUT'
): SimulationResult {
    // Initialize simulation state
    const marbles: Marble[] = [
        { ...striker, vx: Math.cos(angle) * power, vy: Math.sin(angle) * power, potted: false },
        ...targets.map(t => ({ ...t, potted: t.potted }))
    ];

    const frames: Frame[] = [];
    const pottedMarbles: string[] = [];
    let strikerPotted = false;

    // Track which marbles have exited the ring this simulation
    const exitedThisShot = new Set<string>();

    // Run simulation
    for (let frameNum = 0; frameNum < MAX_FRAMES; frameNum++) {
        const pottedThisFrame: string[] = [];

        // --- SUB-STEPPING LOOP ---
        for (let sub = 0; sub < SUB_STEPS; sub++) {

            // 1. Move & Collide
            for (const marble of marbles) {
                if (marble.potted) continue;

                // Move sub-step
                marble.x += marble.vx * SUB_TIME_STEP;
                marble.y += marble.vy * SUB_TIME_STEP;

                // Boundary check
                resolveBoundaryCollision(marble, boardWidth, boardHeight);

                // Internal Wall checks
                for (const wall of walls) {
                    resolveWallCollision(marble, wall);
                }
            }

            // 2. Marble interactions
            const activeMarbles = marbles.filter(m => !m.potted);
            for (let i = 0; i < activeMarbles.length; i++) {
                for (let j = i + 1; j < activeMarbles.length; j++) {
                    const m1 = activeMarbles[i];
                    const m2 = activeMarbles[j];
                    const dist = distance(m1.x, m1.y, m2.x, m2.y);

                    if (dist < m1.radius + m2.radius) {
                        resolveMarbleCollision(m1, m2);
                    }
                }
            }

            // 3. Friction
            for (const marble of marbles) {
                if (marble.potted) continue;

                const subFriction = Math.pow(FRICTION, 1 / SUB_STEPS);
                marble.vx *= subFriction;
                marble.vy *= subFriction;

                // Drag at high speed
                const speed = Math.sqrt(marble.vx * marble.vx + marble.vy * marble.vy);
                if (speed > 0.5) {
                    const subDrag = Math.pow(0.995, 1 / SUB_STEPS);
                    marble.vx *= subDrag;
                    marble.vy *= subDrag;
                }
            }
        }
        // --- END SUB-STEPS ---

        // Post-frame processing: Check collection status
        for (const marble of marbles) {
            if (marble.potted) continue;

            // Check if TARGET marble knocked out of ALL rings
            // Objective logic
            if (objective === 'KNOCK_OUT') {
                // Must be outside ALL rings to be considered "out"
                if (marble.type === 'TARGET' && !exitedThisShot.has(marble.id)) {
                    if (isOutsideAllRings(marble, rings)) {
                        exitedThisShot.add(marble.id);
                    }
                }
            } else {
                // KNOCK_IN: Marble needs to be INSIDE any ring to score
                // We don't track "exited", we track "entered" basically.
                // But for scoring, we just check stopped position.
            }

            // Mark as collected only when stopped outside ring
            // Mark as collected only when stopped
            if (marble.type === 'TARGET') {
                const speed = Math.sqrt(marble.vx * marble.vx + marble.vy * marble.vy);
                if (speed < 0.3) {
                    if (objective === 'KNOCK_OUT') {
                        if (exitedThisShot.has(marble.id) && isOutsideAllRings(marble, rings)) {
                            marble.potted = true;
                            pottedThisFrame.push(marble.id);
                            pottedMarbles.push(marble.id);
                        }
                    } else {
                        // KNOCK_IN
                        if (!isOutsideAllRings(marble, rings)) {
                            marble.potted = true;
                            pottedThisFrame.push(marble.id);
                            pottedMarbles.push(marble.id);
                        }
                    }
                }
            }
        }

        // Record frame
        frames.push({
            timestamp: frameNum,
            marbles: marbles.map(m => ({
                id: m.id,
                x: m.x,
                y: m.y,
                potted: m.potted
            })),
            pottedThisFrame
        });

        // Check if simulation complete
        if (allStopped(marbles)) {
            break;
        }
    }

    return {
        frames,
        pottedMarbles,
        strikerPotted,
        totalFrames: frames.length
    };
}

/**
 * Calculate shot vector from drag input
 */
export function calculateShotVector(
    strikerX: number,
    strikerY: number,
    pointerX: number,
    pointerY: number,
    maxPower: number = 90
): { power: number; angle: number } {
    const dx = strikerX - pointerX;
    const dy = strikerY - pointerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const power = Math.min(dist * 0.45, maxPower);
    const angle = Math.atan2(dy, dx);

    return { power, angle };
}
