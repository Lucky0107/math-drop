import type { MathAction } from '../lib/mathEngine';

interface ChoicesBarProps {
    choices: MathAction[];
    onSelect: (action: MathAction) => void;
    disabled?: boolean;
    hintIndex?: number | null;
}

const OP_DISPLAY: Record<string, string> = {
    '*': '×',
    '/': '÷',
    '+': '+',
    '-': '−',
};

const OP_COLORS: Record<string, string> = {
    '+': 'text-emerald-400',
    '-': 'text-rose-400',
    '*': 'text-amber-400',
    '/': 'text-blue-400',
};

export function ChoicesBar({ choices, onSelect, disabled, hintIndex }: ChoicesBarProps) {
    return (
        <div className="px-4 pb-6 pt-2 z-20">
            <div className="grid grid-cols-4 gap-2">
                {choices.map((choice, i) => {
                    const isHinted = hintIndex === i;
                    return (
                        <button
                            key={`${choice.operator}-${choice.operand}-${i}`}
                            disabled={disabled}
                            onClick={() => onSelect(choice)}
                            className={`
                                glass-button flex flex-col items-center justify-center py-4 rounded-2xl
                                disabled:opacity-40 disabled:scale-100
                                ${isHinted ? 'animate-hint border-amber-400/50' : ''}
                            `}
                        >
                            <span className="text-2xl font-bold drop-shadow-md">
                                {choice.isLeftHand ? (
                                    <>
                                        <span className="text-slate-100">{choice.operand}</span>
                                        <span className={`${OP_COLORS[choice.operator] || 'text-teal-400'} ml-1`}>
                                            {OP_DISPLAY[choice.operator] || choice.operator}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className={`${OP_COLORS[choice.operator] || 'text-teal-400'} mr-1`}>
                                            {OP_DISPLAY[choice.operator] || choice.operator}
                                        </span>
                                        <span className="text-slate-100">{choice.operand}</span>
                                    </>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
