import React, { useState, useCallback } from 'react';
import handImage from '../assets/hand.png';

interface SlingshotControlProps {
    strikerX: number;
    strikerY: number;
    disabled: boolean;
    onShoot: (power: number, angle: number) => void;
    boardRef: React.RefObject<SVGSVGElement | null>;
}

const MAX_PULL_DISTANCE = 220;
const MIN_POWER_THRESHOLD = 15;

export const SlingshotControl: React.FC<SlingshotControlProps> = ({
    strikerX,
    strikerY,
    disabled,
    onShoot,
    boardRef,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [pullDistance, setPullDistance] = useState(0);
    const [angle, setAngle] = useState(0);

    const getSVGPoint = useCallback((clientX: number, clientY: number) => {
        if (!boardRef.current) return { x: strikerX, y: strikerY };

        const svg = boardRef.current;
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;

        const ctm = svg.getScreenCTM();
        if (!ctm) return { x: strikerX, y: strikerY };

        const svgP = pt.matrixTransform(ctm.inverse());
        return { x: svgP.x, y: svgP.y };
    }, [boardRef, strikerX, strikerY]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();

        const point = getSVGPoint(e.clientX, e.clientY);
        const dx = point.x - strikerX;
        const dy = point.y - strikerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Start drag if clicking near the striker (increased hitbox)
        if (dist < 60) {
            setIsDragging(true);
            setDragPos(point);
            (e.target as Element).setPointerCapture(e.pointerId);
        }
    }, [disabled, strikerX, strikerY, getSVGPoint]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();

        const point = getSVGPoint(e.clientX, e.clientY);
        setDragPos(point);

        const dx = strikerX - point.x;
        const dy = strikerY - point.y;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_PULL_DISTANCE);

        setPullDistance(distance);
        setAngle(Math.atan2(dy, dx));
    }, [isDragging, strikerX, strikerY, getSVGPoint]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();

        if (pullDistance > MIN_POWER_THRESHOLD) {
            // Map pull distance (0-220) to power (0-90)
            const power = (pullDistance / MAX_PULL_DISTANCE) * 90;
            onShoot(power, angle);
        }

        setIsDragging(false);
        setPullDistance(0);
    }, [isDragging, pullDistance, angle, onShoot]);

    // Calculate trajectory preview points
    const trajectoryPoints = [];
    if (isDragging && pullDistance > MIN_POWER_THRESHOLD) {
        const numDots = 5;
        for (let i = 1; i <= numDots; i++) {
            const t = (i / numDots) * 80;
            trajectoryPoints.push({
                x: strikerX + Math.cos(angle) * t,
                y: strikerY + Math.sin(angle) * t,
                opacity: 1 - (i / numDots) * 0.7,
            });
        }
    }

    // Hand position (opposite to aim direction)
    const handDistance = Math.min(pullDistance * 0.8, 80);
    const handX = strikerX - Math.cos(angle) * handDistance - 30;
    const handY = strikerY - Math.sin(angle) * handDistance - 40;
    const handRotation = (angle * 180) / Math.PI + 90;

    return (
        <g
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ cursor: disabled ? 'not-allowed' : 'grab' }}
        >
            {/* Large invisible hit area for easier interaction */}
            <circle
                cx={strikerX}
                cy={strikerY}
                r={60}
                fill="rgba(0,255,136,0.1)"
                stroke={isDragging ? '#00ff88' : 'transparent'}
                strokeWidth="2"
                strokeDasharray="4,4"
                style={{ cursor: disabled ? 'not-allowed' : 'grab' }}
            />

            {/* Pull line */}
            {isDragging && pullDistance > MIN_POWER_THRESHOLD && (
                <>
                    <line
                        x1={strikerX}
                        y1={strikerY}
                        x2={dragPos.x}
                        y2={dragPos.y}
                        stroke="#ff4444"
                        strokeWidth="3"
                        strokeDasharray="8,4"
                        opacity="0.8"
                    />

                    {/* Trajectory dots */}
                    {trajectoryPoints.map((pt, i) => (
                        <circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r={5}
                            fill="#00ff88"
                            opacity={pt.opacity}
                        />
                    ))}

                    {/* Power indicator */}
                    <text
                        x={strikerX}
                        y={strikerY - 45}
                        textAnchor="middle"
                        fill="#00ff88"
                        fontSize="16"
                        fontWeight="bold"
                        fontFamily="Orbitron, sans-serif"
                    >
                        {Math.round((pullDistance / MAX_PULL_DISTANCE) * 100)}%
                    </text>
                </>
            )}

            {/* Hand visual */}
            {isDragging && pullDistance > MIN_POWER_THRESHOLD && (
                <image
                    href={handImage}
                    x={handX}
                    y={handY}
                    width="60"
                    height="80"
                    transform={`rotate(${handRotation} ${handX + 30} ${handY + 40})`}
                    opacity="0.9"
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};
