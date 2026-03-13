import { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { StartScreen } from './components/StartScreen';
import { GameStage } from './components/GameStage';
import {
  generateEquationForLevel,
  generateActionChoices,
  getCorrectAction
} from './lib/equationGenerator';
import { applyMathAction } from './lib/mathEngine';
import type { MathEquation, MathAction } from './lib/mathEngine';

export type GameMode = 'modeA' | 'modeB' | 'modeC';
type GameState = 'start' | 'playing' | 'level_clear' | 'gameover';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [gameMode, setGameMode] = useState<GameMode>('modeA');
  const [level, setLevel] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);

  const [activeEquation, setActiveEquation] = useState<MathEquation | null>(null);
  const [choices, setChoices] = useState<MathAction[]>([]);
  const [isHitAnimating, setIsHitAnimating] = useState(false);
  const [equationsSolvedInLevel, setEquationsSolvedInLevel] = useState(0);

  // Combo system
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  // Hint system
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);

  // Wrong answer shake
  const [isShaking, setIsShaking] = useState(false);

  // Timer ref
  const timerRef = useRef<number | null>(null);

  // Combo multiplier helper
  const getComboMultiplier = (c: number) => {
    if (c >= 10) return 3;
    if (c >= 5) return 2;
    if (c >= 3) return 1.5;
    return 1;
  };

  // spawnEquation is now inlined for clarity

  const resetHintTimer = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setHintIndex(null);
  }, []);

  const startHintTimer = useCallback((currentChoices: MathAction[], currentEq: MathEquation | null) => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (!currentEq) return;

    hintTimerRef.current = window.setTimeout(() => {
      // Find the correct action index
      const correct = getCorrectAction(currentEq);
      if (correct) {
        const idx = currentChoices.findIndex(
          c => c.operator === correct.operator && c.operand === correct.operand
        );
        if (idx >= 0) {
          setHintIndex(idx);
        }
      }
    }, 5000); // 5 seconds
  }, []);

  const startGame = (selectedLevel: number, mode: GameMode = 'modeA') => {
    setGameMode(mode);
    setLevel(selectedLevel);
    setScore(0);
    setCombo(0);
    setShowCombo(false);
    setHintIndex(null);
    setTimeRemaining(Math.min(selectedLevel * 10 + 30, 120));
    setEquationsSolvedInLevel(0);

    if (mode === 'modeA') {
      const newEq = generateEquationForLevel(selectedLevel);
      setActiveEquation(newEq);
      const newChoices = generateActionChoices(newEq);
      setChoices(newChoices);
      setGameState('playing');
      // start hint timer after a tick
      setTimeout(() => startHintTimer(newChoices, newEq), 100);
    }
    // Mode B and C will be added later
  };

  // Game timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('gameover');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Cleanup hint timer on unmount / state change
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const handleActionSelect = (action: MathAction) => {
    if (!activeEquation || isHitAnimating) return;

    // Reset hint
    resetHintTimer();

    // Check if correct
    const correctAction = getCorrectAction(activeEquation);
    if (correctAction && correctAction.operator === action.operator && correctAction.operand === action.operand) {
      // Correct!
      setIsHitAnimating(true);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 600);

      // Score = base * combo multiplier
      const baseScore = level * 10 + Math.floor(timeRemaining / 2);
      const multiplier = getComboMultiplier(newCombo);
      setScore(s => s + Math.floor(baseScore * multiplier));

      setTimeout(() => {
        const transformedEq = applyMathAction(activeEquation, action);
        if (transformedEq) {
          if (transformedEq.left.type === 'variable') {
            // Fully solved!
            setEquationsSolvedInLevel(prev => {
              const newCount = prev + 1;
              const needed = Math.min(3 + Math.floor(level / 3), 5);
              if (newCount >= needed) {
                setGameState('level_clear');
                if (level === maxUnlockedLevel && level < 10) {
                  setMaxUnlockedLevel(level + 1);
                }
              } else {
                const nextEq = generateEquationForLevel(level);
                setActiveEquation(nextEq);
                const nextChoices = generateActionChoices(nextEq);
                setChoices(nextChoices);
                setHintIndex(null);
                setTimeout(() => startHintTimer(nextChoices, nextEq), 100);
              }
              return newCount;
            });
          } else {
            // More steps to go
            setActiveEquation(transformedEq);
            const nextChoices = generateActionChoices(transformedEq);
            setChoices(nextChoices);
            setHintIndex(null);
            setTimeout(() => startHintTimer(nextChoices, transformedEq), 100);
          }
        }
        setIsHitAnimating(false);
      }, 500);
    } else {
      // Wrong answer
      setCombo(0);
      setTimeRemaining(t => Math.max(0, t - 3));
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);

      // Start hint timer again after wrong answer
      startHintTimer(choices, activeEquation);
    }
  };

  const equationsNeeded = Math.min(3 + Math.floor(level / 3), 5);

  return (
    <div className="h-dvh flex items-center justify-center bg-slate-950 text-white overflow-hidden font-[Outfit] select-none">
      <div className="w-full max-w-md h-full sm:h-[90vh] relative glass-panel sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border-slate-700/50">

        {/* Background ambient glows */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-teal-500/15 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

        {gameState === 'start' && (
          <StartScreen
            onStart={startGame}
            maxUnlockedLevel={maxUnlockedLevel}
          />
        )}

        {gameState === 'playing' && activeEquation && (
          <GameStage
            level={level}
            activeEquation={activeEquation}
            choices={choices}
            onActionSelect={handleActionSelect}
            timeRemaining={timeRemaining}
            score={score}
            isHitAnimating={isHitAnimating}
            combo={combo}
            showCombo={showCombo}
            hintIndex={hintIndex}
            isShaking={isShaking}
            equationsSolved={equationsSolvedInLevel}
            equationsNeeded={equationsNeeded}
          />
        )}

        {gameState === 'level_clear' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm z-30 p-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-2 animate-float">
              LEVEL CLEAR!
            </h2>
            <p className="text-slate-400 text-sm mb-1">Level {level}</p>
            <p className="text-slate-200 text-2xl font-bold mb-8">{score} pts</p>

            <div className="flex gap-4">
              <button
                onClick={() => setGameState('start')}
                className="px-6 py-3 rounded-xl font-bold bg-slate-800 border-2 border-slate-700 text-slate-300 hover:bg-slate-700 transition-all"
              >
                メニュー
              </button>
              {level < 10 && (
                <button
                  onClick={() => startGame(level + 1, gameMode)}
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-emerald-400/50 text-white shadow-[0_0_20px_rgba(52,211,153,0.4)] hover:shadow-[0_0_30px_rgba(52,211,153,0.6)] hover:scale-105 transition-all"
                >
                  次のレベル →
                </button>
              )}
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/90 backdrop-blur-sm z-30 p-6">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-4xl font-black text-rose-400 mb-2">タイムアップ！</h2>
            <p className="text-slate-400 text-sm mb-1">Level {level}</p>
            <p className="text-slate-200 text-2xl font-bold mb-2">{score} pts</p>
            <p className="text-slate-500 text-sm mb-8">
              {equationsSolvedInLevel} / {equationsNeeded} 問クリア
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setGameState('start')}
                className="px-6 py-3 rounded-xl font-bold bg-slate-800 border-2 border-slate-700 text-slate-300 hover:bg-slate-700 transition-all"
              >
                メニュー
              </button>
              <button
                onClick={() => startGame(level, gameMode)}
                className="px-6 py-3 rounded-xl font-bold bg-rose-500 border-2 border-rose-400/50 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:scale-105 transition-all"
              >
                もう一度
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
