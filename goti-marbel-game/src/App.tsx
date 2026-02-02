import { useRef, useMemo, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { Marble } from './components/Marble';
import { SlingshotControl } from './components/SlingshotControl';
import { useGameState } from './game/useGameState';
import { generateLevel, getDayNumber } from './game/LevelGenerator';
import './index.css';

// Game instance component - separated to allow full remount on reset
const GameInstance = ({
    stage,
    onStageComplete,
    onManualStageChange,
    dayNumber
}: {
    stage: number,
    onStageComplete: () => void,
    onManualStageChange: (newStage: number) => void,
    dayNumber: number
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    // Generate level based on current stage
    const level = useMemo(() => generateLevel(stage), [stage]);

    const {
        marbles,
        striker,
        shots,
        streak,
        phase,
        isAnimating,
        isGameOver,
        shoot
    } = useGameState(level);

    const marblesCollected = marbles.filter(m => m.type === 'TARGET' && m.potted).length;
    const totalMarbles = marbles.filter(m => m.type === 'TARGET').length;

    return (
        <>
            {/* Header - Inside GameInstance to access stats */}
            <header className="header">
                <div className="header-left">
                    <h1 className="title">
                        <span className="title-accent">गोटी</span>
                        <span className="title-sub">Goti • Kancha</span>
                    </h1>
                </div>
                <div className="header-center" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="day-badge">Day #{dayNumber}</span>
                    <select
                        className="day-badge stage-selector"
                        value={stage}
                        onChange={(e) => onManualStageChange(Number(e.target.value))}
                        style={{
                            borderColor: '#fff',
                            color: '#fff',
                            background: '#4a3a25',
                            cursor: 'pointer',
                            outline: 'none',
                            paddingRight: '5px'
                        }}
                    >
                        <option value={1}>Stage 1</option>
                        <option value={2}>Stage 2</option>
                        <option value={3}>Stage 3</option>
                        <option value={4}>Stage 4</option>
                        <option value={5}>Stage 5</option>
                        <option value={6}>Stage 6 (Inverted)</option>
                    </select>
                </div>
                <div className="header-right">
                    <div className="stat">
                        <span className="stat-label">Collected</span>
                        <span className="stat-value score-value">{marblesCollected}/{totalMarbles}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">Shots</span>
                        <span className="stat-value">{shots}</span>
                    </div>
                    {streak > 1 && (
                        <div className="stat streak">
                            <span className="stat-label">Streak</span>
                            <span className="stat-value streak-value">🔥 {streak}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="game-container">
                <GameBoard
                    ref={svgRef}
                    width={level.boardWidth}
                    height={level.boardHeight}
                    rings={level.rings}
                    walls={level.walls}
                >
                    {/* Marbles */}
                    {marbles.map((marble) => (
                        <Marble
                            key={marble.id}
                            {...marble}
                            isActive={marble.type === 'STRIKER' && phase === 'AIMING'}
                        />
                    ))}

                    {/* Slingshot Control */}
                    {striker && (
                        <SlingshotControl
                            strikerX={striker.x}
                            strikerY={striker.y}
                            disabled={isAnimating || isGameOver}
                            onShoot={shoot}
                            boardRef={svgRef}
                        />
                    )}
                </GameBoard>

                {/* Game Over Modal */}
                {isGameOver && (
                    <div className="game-over-overlay">
                        <div className="game-over-modal">
                            <h2 className="game-over-title">🎉 Stage {stage} Cleared!</h2>
                            <div className="game-over-stats">
                                <div className="final-score">
                                    <span className="final-label">Marbles Won</span>
                                    <span className="final-value">{marblesCollected}</span>
                                </div>
                                <div className="final-shots">
                                    Collected in <strong>{shots}</strong> shots
                                </div>
                            </div>
                            <button className="play-again-btn" onClick={onStageComplete}>
                                {stage === 1 ? "Next Stage →" : "Play Again (Daily Reset)"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Instructions removed to prevent layout shift */}
            </main>
        </>
    );
};

function App() {
    // stage 1 or 2
    const [stage, setStage] = useState(1);
    // gameId used to force remount
    const [gameId, setGameId] = useState(0);
    const dayNumber = getDayNumber();

    const handleStageComplete = () => {
        if (stage < 6) {
            // Create new stage
            setStage(prev => prev + 1);
        } else {
            // Loop back to 1
            setStage(1);
        }
        // Force new game instance
        setGameId(prev => prev + 1);
    };

    const handleManualStageChange = (newStage: number) => {
        setStage(newStage);
        setGameId(prev => prev + 1); // Reset game on stage change
    };

    return (
        <div className="app">
            <GameInstance
                key={`${stage}-${gameId}`}
                stage={stage}
                onStageComplete={handleStageComplete}
                onManualStageChange={handleManualStageChange}
                dayNumber={dayNumber}
            />
        </div>
    );
}

export default App;
