// Game State Hook for Goti - Traditional Indian Marble Game

import { useState, useCallback, useRef, useEffect } from 'react';
import { Marble, LevelConfig, GameState } from '../physics/types';
import { simulateShot } from '../physics/engine';

const FRAME_DURATION = 16; // ~60fps playback
const POINTS_PER_MARBLE = 100;
const STRIKER_FOUL_PENALTY = 50;

interface ScoreEvent {
    type: 'POT' | 'FOUL' | 'CLEAR';
    points: number;
    marbleId?: string;
}

export function useGameState(level: LevelConfig) {
    const [state, setState] = useState<GameState>(() => initializeState(level));
    const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
    const animationRef = useRef<number | null>(null);
    const frameIndexRef = useRef(0);

    // Initialize game state
    function initializeState(config: LevelConfig): GameState {
        const striker: Marble = {
            id: 'striker',
            x: config.strikerStart.x,
            y: config.strikerStart.y,
            vx: 0,
            vy: 0,
            radius: 11,
            mass: 1.5,
            type: 'STRIKER',
            color: '#ffffff',
            potted: false,
        };

        return {
            phase: 'AIMING',
            marbles: [striker, ...config.targetMarbles],
            score: 0,
            shots: 0,
            streak: 0,
            currentFrame: 0,
            animationQueue: [],
        };
    }

    // Reset game
    const resetGame = useCallback(() => {
        setState(initializeState(level));
        setScoreEvents([]);
        frameIndexRef.current = 0;
    }, [level]);

    // Handle shooting
    const shoot = useCallback((power: number, angle: number) => {
        setState(prev => {
            if (prev.phase !== 'AIMING') return prev;

            const striker = prev.marbles.find(m => m.type === 'STRIKER');
            if (!striker) return prev;

            const targets = prev.marbles.filter(m => m.type === 'TARGET' && !m.potted);

            // Run physics simulation
            const result = simulateShot(
                striker,
                targets,
                power,
                angle,
                level.holes,
                level.walls,
                level.frictionZones,
                level.boardWidth,
                level.boardHeight,
                level.rings // Pass configured rings
            );

            frameIndexRef.current = 0;

            return {
                ...prev,
                phase: 'ANIMATING' as const,
                shots: prev.shots + 1,
                animationQueue: result.frames,
                currentFrame: 0,
            };
        });
    }, [level]);

    // Animation loop
    useEffect(() => {
        if (state.phase !== 'ANIMATING' || state.animationQueue.length === 0) return;

        const animate = () => {
            const frameIndex = frameIndexRef.current;

            if (frameIndex >= state.animationQueue.length) {
                // Animation complete - process results using setState callback
                setState(prev => {
                    const lastFrame = prev.animationQueue[prev.animationQueue.length - 1];
                    if (!lastFrame) return { ...prev, phase: 'AIMING' as const, animationQueue: [] };

                    // Update marbles to final positions from last frame
                    let newMarbles = prev.marbles.map(m => {
                        const frameState = lastFrame.marbles.find(fm => fm.id === m.id);
                        if (frameState) {
                            return { ...m, x: frameState.x, y: frameState.y, potted: frameState.potted };
                        }
                        return m;
                    });

                    // Check if striker was potted (respawn at start)
                    const striker = newMarbles.find(m => m.type === 'STRIKER');
                    if (striker?.potted) {
                        newMarbles = newMarbles.map(m =>
                            m.type === 'STRIKER'
                                ? { ...m, x: level.strikerStart.x, y: level.strikerStart.y, potted: false, vx: 0, vy: 0 }
                                : m
                        );
                    }

                    // Check game over
                    const activeTargets = newMarbles.filter(m => m.type === 'TARGET' && !m.potted);

                    if (activeTargets.length === 0) {
                        // Bonus for clearing
                        const clearBonus = Math.max(0, (10 - prev.shots) * 50);
                        if (clearBonus > 0) {
                            setScoreEvents(events => [...events, { type: 'CLEAR', points: clearBonus }]);
                        }

                        return {
                            ...prev,
                            phase: 'GAME_OVER' as const,
                            marbles: newMarbles,
                            score: prev.score + Math.max(0, (10 - prev.shots) * 50),
                            animationQueue: [],
                        };
                    }

                    return {
                        ...prev,
                        phase: 'AIMING' as const,
                        marbles: newMarbles,
                        animationQueue: [],
                    };
                });
                return;
            }

            const frame = state.animationQueue[frameIndex];
            frameIndexRef.current++;

            // Update marble positions
            setState(prev => ({
                ...prev,
                currentFrame: frameIndex,
                marbles: prev.marbles.map(m => {
                    const frameState = frame.marbles.find(fm => fm.id === m.id);
                    if (frameState) {
                        return { ...m, x: frameState.x, y: frameState.y, potted: frameState.potted };
                    }
                    return m;
                }),
            }));

            // Process potted marbles this frame
            if (frame.pottedThisFrame.length > 0) {
                frame.pottedThisFrame.forEach(id => {
                    if (id === 'striker') {
                        setScoreEvents(prev => [...prev, { type: 'FOUL', points: -STRIKER_FOUL_PENALTY }]);
                        setState(prev => ({
                            ...prev,
                            score: prev.score - STRIKER_FOUL_PENALTY,
                            streak: 0,
                        }));
                    } else {
                        const points = POINTS_PER_MARBLE;
                        setScoreEvents(prev => [...prev, { type: 'POT', points, marbleId: id }]);
                        setState(prev => ({
                            ...prev,
                            score: prev.score + points,
                            streak: prev.streak + 1,
                        }));
                    }
                });
            }

            animationRef.current = window.setTimeout(animate, FRAME_DURATION);
        };

        animationRef.current = window.setTimeout(animate, FRAME_DURATION);

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, [state.phase, state.animationQueue, level.strikerStart]);

    // Move striker (for Stage 4)
    const setStrikerX = useCallback((x: number) => {
        setState(prev => {
            if (prev.phase !== 'AIMING') return prev;
            return {
                ...prev,
                marbles: prev.marbles.map(m =>
                    m.type === 'STRIKER'
                        ? { ...m, x: Math.max(100, Math.min(level.boardWidth - 100, x)) }
                        : m
                )
            };
        });
    }, [level.boardWidth]);

    const striker = state.marbles.find(m => m.type === 'STRIKER');

    return {
        ...state,
        striker,
        scoreEvents,
        shoot,
        setStrikerX,
        resetGame,
        isAnimating: state.phase === 'ANIMATING',
        isGameOver: state.phase === 'GAME_OVER',
    };
}
