import { useState } from 'react';
import type { GameMode } from '../App';

interface StartScreenProps {
    onStart: (level: number, mode: GameMode) => void;
    maxUnlockedLevel: number;
}

const MODE_INFO = {
    modeA: {
        emoji: '🔓',
        title: '□を独り立ちさせろ！',
        subtitle: '逆算・移項',
        description: '式を変形して□を左辺に残せ',
        gradient: 'from-teal-400 to-emerald-400',
        bg: 'bg-teal-500/15 border-teal-500/30',
        available: true,
    },
    modeB: {
        emoji: '🔢',
        title: '小数点ジャンプ',
        subtitle: '小数の割り算',
        description: '小数点を動かして整数に変換',
        gradient: 'from-blue-400 to-cyan-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
        available: false,
    },
    modeC: {
        emoji: '📐',
        title: '分数ダイビング',
        subtitle: '割り算と分数',
        description: '÷を分数の形に組み替えろ',
        gradient: 'from-purple-400 to-pink-400',
        bg: 'bg-purple-500/10 border-purple-500/20',
        available: false,
    },
};

export function StartScreen({ onStart, maxUnlockedLevel }: StartScreenProps) {
    const [selectedMode, setSelectedMode] = useState<GameMode>('modeA');
    const levels = Array.from({ length: 10 }, (_, i) => i + 1);

    const currentMode = MODE_INFO[selectedMode];

    return (
        <div className="absolute inset-0 flex flex-col items-center p-6 z-10 overflow-y-auto">
            {/* Title */}
            <div className="mt-8 mb-6 text-center">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 animate-float tracking-tight">
                    算数トランスフォーマー
                </h1>
                <p className="text-sm text-slate-500 mt-1 tracking-wider">式変形バトル</p>
            </div>

            {/* Mode Selector */}
            <div className="w-full max-w-sm mb-6">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 text-center">
                    モード選択
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(MODE_INFO) as [GameMode, typeof MODE_INFO.modeA][]).map(([key, mode]) => (
                        <button
                            key={key}
                            onClick={() => mode.available && setSelectedMode(key)}
                            className={`
                                relative rounded-xl p-3 border-2 transition-all duration-300 text-center
                                ${selectedMode === key
                                    ? `${mode.bg} border-opacity-100 scale-105 shadow-lg`
                                    : mode.available
                                        ? 'bg-slate-800/50 border-slate-700/30 hover:bg-slate-700/50'
                                        : 'bg-slate-800/30 border-slate-700/20 opacity-40 cursor-not-allowed'
                                }
                            `}
                        >
                            <div className="text-2xl mb-1">{mode.emoji}</div>
                            <div className={`text-xs font-bold ${selectedMode === key ? 'text-white' : 'text-slate-400'}`}>
                                {mode.subtitle}
                            </div>
                            {!mode.available && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                                    <span className="text-lg">🔒</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Mode Description */}
            <div className={`w-full max-w-sm rounded-2xl p-4 border ${currentMode.bg} mb-6`}>
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{currentMode.emoji}</span>
                    <div>
                        <h2 className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r ${currentMode.gradient}`}>
                            {currentMode.title}
                        </h2>
                    </div>
                </div>
                <p className="text-sm text-slate-400">{currentMode.description}</p>
            </div>

            {/* Level Grid */}
            <div className="w-full max-w-sm mb-6">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 text-center">
                    レベル選択
                </p>
                <div className="grid grid-cols-5 gap-3">
                    {levels.map(level => {
                        const isUnlocked = level <= maxUnlockedLevel;
                        return (
                            <button
                                key={level}
                                disabled={!isUnlocked}
                                onClick={() => onStart(level, selectedMode)}
                                className={`
                                    aspect-square rounded-xl text-lg font-bold transition-all duration-300 flex items-center justify-center
                                    ${isUnlocked
                                        ? 'bg-teal-500/20 border-2 border-teal-500/40 text-teal-100 hover:bg-teal-500/40 hover:scale-110 hover:shadow-[0_0_15px_rgba(20,184,166,0.4)] cursor-pointer active:scale-95'
                                        : 'bg-slate-800/40 border-2 border-slate-700/30 text-slate-600 cursor-not-allowed'}
                                `}
                            >
                                {isUnlocked ? level : '🔒'}
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="text-xs text-slate-600">レベルをタップしてスタート</p>
        </div>
    );
}
