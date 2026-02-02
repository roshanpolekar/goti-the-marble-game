import React, { forwardRef } from 'react';


interface GameBoardProps {
    width: number;
    height: number;
    rings?: { x: number; y: number; radius: number; }[];
    walls?: { x: number; y: number; width: number; height: number; }[];
    children: React.ReactNode;
}

export const GameBoard = forwardRef<SVGSVGElement, GameBoardProps>(
    (props, ref) => {
        const { width, height, rings, walls, children } = props;
        return (
            <svg
                ref={ref}
                viewBox={`0 0 ${width} ${height}`}
                className="game-board"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    height: 'auto',
                    touchAction: 'none',
                    userSelect: 'none',
                }}
            >
                {/* Background - Dirt/Mud Ground */}
                <defs>
                    {/* Main dirt gradient */}
                    <radialGradient id="dirtGradient" cx="50%" cy="40%" r="70%">
                        <stop offset="0%" stopColor="#d4b896" />
                        <stop offset="50%" stopColor="#c4a878" />
                        <stop offset="100%" stopColor="#a89060" />
                    </radialGradient>

                    {/* Subtle texture */}
                    <filter id="dirtNoise" x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
                        <feDiffuseLighting in="noise" lightingColor="#e8d4b8" surfaceScale="1.5" result="light">
                            <feDistantLight azimuth="45" elevation="55" />
                        </feDiffuseLighting>
                        <feBlend in="SourceGraphic" in2="light" mode="multiply" />
                    </filter>
                </defs>

                {/* Main ground */}
                <rect
                    x="0"
                    y="0"
                    width={width}
                    height={height}
                    fill="url(#dirtGradient)"
                    rx="20"
                />

                {/* THE RINGS */}
                {(rings || []).map((ring, i) => (
                    <g key={`ring-${i}`}>
                        {/* Outer shadow/depth */}
                        <circle
                            cx={ring.x}
                            cy={ring.y}
                            r={ring.radius + 8}
                            fill="none"
                            stroke="#8a7a60"
                            strokeWidth="12"
                            opacity="0.3"
                        />

                        {/* Main ring line */}
                        <circle
                            cx={ring.x}
                            cy={ring.y}
                            r={ring.radius}
                            fill="none"
                            stroke="#6a5a40"
                            strokeWidth="4"
                            strokeDasharray="12,6"
                        />

                        {/* Inner ring highlight */}
                        <circle
                            cx={ring.x}
                            cy={ring.y}
                            r={ring.radius - 2}
                            fill="none"
                            stroke="#5a4a35"
                            strokeWidth="2"
                        />
                        {/* Ring indicator fill */}
                        <circle
                            cx={ring.x}
                            cy={ring.y}
                            r={ring.radius}
                            fill="rgba(139, 115, 85, 0.1)"
                            stroke="none"
                        />
                    </g>
                ))}

                {/* WALLS (Stage 3+) */}
                {(walls || []).map((wall, i) => (
                    <rect
                        key={`wall-${i}`}
                        x={wall.x}
                        y={wall.y}
                        width={wall.width}
                        height={wall.height}
                        fill="#5a4a35"
                        stroke="#3a2a1a"
                        strokeWidth="2"
                        rx="4"
                    />
                ))}

                {/* Shooting line (lag line) */}
                <line
                    x1={100}
                    y1={height - 150}
                    x2={width - 100}
                    y2={height - 150}
                    stroke="#7a6a50"
                    strokeWidth="3"
                    strokeDasharray="10,8"
                    opacity="0.6"
                />

                {/* Label for the shooting zone */}
                <text
                    x={width / 2}
                    y={height - 130}
                    textAnchor="middle"
                    fill="#8a7a60"
                    fontSize="12"
                    fontFamily="sans-serif"
                    opacity="0.6"
                >
                    SHOOTING LINE
                </text>

                {/* Some texture marks on ground */}
                <circle cx={80} cy={150} r={2} fill="#9a8a70" opacity="0.3" />
                <circle cx={420} cy={300} r={3} fill="#8a7a60" opacity="0.25" />
                <circle cx={60} cy={450} r={2} fill="#9a8a70" opacity="0.3" />
                <circle cx={440} cy={500} r={2} fill="#8a7a60" opacity="0.25" />
                <circle cx={250} cy={600} r={3} fill="#9a8a70" opacity="0.2" />

                {/* Small pebbles */}
                <ellipse cx={150} cy={200} rx={4} ry={3} fill="#b0a080" opacity="0.4" />
                <ellipse cx={380} cy={180} rx={3} ry={2} fill="#a09070" opacity="0.35" />
                <ellipse cx={100} cy={550} rx={3} ry={2} fill="#b0a080" opacity="0.3" />

                {/* Children (marbles, controls, etc.) */}
                {children}
            </svg>
        );
    }
);

GameBoard.displayName = 'GameBoard';
