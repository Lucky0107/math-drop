import { tryEvaluateStatic } from '../lib/mathEngine';
import type { MathEquation, MathAction } from '../lib/mathEngine';
import { EquationDisplay } from './EquationDisplay';
import { ChoicesBar } from './ChoicesBar';

interface GameStageProps {
    level: number;
    activeEquation: MathEquation;
    choices: MathAction[];
    onActionSelect: (action: MathAction) => void;
    timeRemaining: number;
    score: number;
    isHitAnimating: boolean;
    combo: number;
    showCombo: boolean;
    hintIndex: number | null;
    isShaking: boolean;
    equationsSolved: number;
    equationsNeeded: number;
}

export function GameStage({
    level,
    activeEquation,
    choices,
    onActionSelect,
    timeRemaining,
    score,
    isHitAnimating,
    combo,
    showCombo,
    hintIndex,
    isShaking,
    equationsSolved,
    equationsNeeded,
}: GameStageProps) {

    const targetValue = tryEvaluateStatic(activeEquation.right) ?? 0;
    const timePct = Math.max(0, (timeRemaining / (level * 10 + 30)) * 100);
    const isTimeLow = timeRemaining <= 10;

    return (
        <div className="absolute inset-0 flex flex-col overflow-hidden z-10">
            {/* Header HUD */}
            <div className="flex justify-between items-center px-4 py-3 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50">
                <div className="flex flex-col items-center min-w-[56px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lv</span>
                    <span className="text-xl font-black text-teal-300">{level}</span>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1.5 items-center">
                    {Array.from({ length: equationsNeeded }, (_, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full border-2 transition-all duration-300
                                ${i < equationsSolved
                                    ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                    : 'bg-slate-700 border-slate-600'
                                }`}
                        />
                    ))}
                </div>

                <div className="flex flex-col items-center min-w-[56px]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Score</span>
                    <span className="text-xl font-black text-emerald-300">{score}</span>
                </div>
            </div>

            {/* Time Bar */}
            <div className="h-1 bg-slate-800 relative">
                <div
                    className={`h-full transition-all duration-1000 ease-linear ${isTimeLow
                        ? 'bg-gradient-to-r from-red-500 to-rose-400 animate-pulse'
                        : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                    }`}
                    style={{ width: `${timePct}%` }}
                />
            </div>

            {/* Timer display */}
            <div className="flex justify-center py-2">
                <span className={`text-lg font-black tabular-nums ${isTimeLow ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
            </div>

            {/* Combo indicator */}
            {combo >= 3 && (
                <div className="flex justify-center">
                    <div className={`px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 ${showCombo ? 'animate-combo' : ''}`}>
                        <span className="text-amber-400 font-black text-sm">
                            🔥 {combo} COMBO ×{combo >= 10 ? '3' : combo >= 5 ? '2' : '1.5'}
                        </span>
                    </div>
                </div>
            )}

            {/* Main equation area */}
            <div className="flex-1 relative flex flex-col items-center justify-center px-4 gap-4">
                {/* Instruction text */}
                <p className="text-sm text-slate-400 text-center">
                    両辺に<span className="text-teal-300 font-bold">操作</span>を加えて、
                    じゃまな数字を消そう！
                </p>

                <div className={`w-full max-w-sm flex justify-center ${isShaking ? 'animate-shake' : ''}`}>
                    <EquationDisplay equation={activeEquation} isCorrectHit={isHitAnimating} />
                </div>
            </div>

            {/* Action label */}
            <div className="text-center pb-1">
                <span className="text-xs text-slate-500 font-bold tracking-wider">▼ 操作を選べ！ ▼</span>
            </div>

            {/* Action Bar */}
            <ChoicesBar
                choices={choices}
                onSelect={onActionSelect}
                disabled={isHitAnimating}
                hintIndex={hintIndex}
                targetValue={targetValue}
            />
        </div>
    );
}
