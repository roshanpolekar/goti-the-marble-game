import React from 'react';

interface MarbleProps {
    id: string;
    x: number;
    y: number;
    radius: number;
    type: 'STRIKER' | 'TARGET';
    color: string;
    potted: boolean;
    isActive?: boolean;
}

export const Marble: React.FC<MarbleProps> = ({
    x, y, radius, type, color, potted, isActive
}) => {
    if (potted) return null;

    const gradientId = `marble-${type}-${color.replace('#', '')}-${Math.random().toString(36).substr(2, 5)}`;

    return (
        <g style={{ transition: 'opacity 0.3s ease' }}>
            <defs>
                {/* Marble gradient for 3D glass effect */}
                <radialGradient id={gradientId} cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={type === 'STRIKER' ? '#ffffff' : lightenColor(color, 0.4)} />
                    <stop offset="40%" stopColor={type === 'STRIKER' ? '#f0f0f0' : color} />
                    <stop offset="100%" stopColor={type === 'STRIKER' ? '#b0b0b0' : darkenColor(color, 0.35)} />
                </radialGradient>
            </defs>

            {/* Shadow */}
            <ellipse
                cx={x + 1}
                cy={y + 2}
                rx={radius * 0.85}
                ry={radius * 0.4}
                fill="rgba(0,0,0,0.25)"
            />

            {/* Active glow for striker */}
            {isActive && (
                <circle
                    cx={x}
                    cy={y}
                    r={radius + 3}
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    opacity="0.6"
                />
            )}

            {/* Main marble body */}
            <circle
                cx={x}
                cy={y}
                r={radius}
                fill={`url(#${gradientId})`}
                stroke={type === 'STRIKER' ? '#999' : darkenColor(color, 0.25)}
                strokeWidth="0.5"
            />

            {/* Glass highlight shine */}
            <ellipse
                cx={x - radius * 0.25}
                cy={y - radius * 0.25}
                rx={radius * 0.2}
                ry={radius * 0.12}
                fill="rgba(255,255,255,0.7)"
                transform={`rotate(-45 ${x - radius * 0.25} ${y - radius * 0.25})`}
            />

            {/* Striker marking */}
            {type === 'STRIKER' && (
                <circle
                    cx={x}
                    cy={y}
                    r={radius * 0.4}
                    fill="none"
                    stroke="#666"
                    strokeWidth="1"
                    opacity="0.5"
                />
            )}
        </g>
    );
};

// Helper to lighten a hex color
function lightenColor(hex: string, factor: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * factor));
    const g = Math.min(255, Math.floor(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * factor));
    const b = Math.min(255, Math.floor((num & 0x0000ff) + (255 - (num & 0x0000ff)) * factor));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// Helper to darken a hex color
function darkenColor(hex: string, factor: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.floor((num >> 16) * (1 - factor));
    const g = Math.floor(((num >> 8) & 0x00ff) * (1 - factor));
    const b = Math.floor((num & 0x0000ff) * (1 - factor));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
