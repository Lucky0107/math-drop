import { useEffect, useState } from 'react';

export function AnimatedTutorial() {
    // We will cycle through a 4-step animation
    // Step 0: Initial state [ □ + 3 = 8 ] with [+3] glowing, and choices below.
    // Step 1: Hand clicks the [-3] choice.
    // Step 2: The [+3] moves to the right side and flips to [-3]. Equation is [ □ = 8 - 3 ]
    // Step 3: [8 - 3] merges into [ 5 ]. Equation is [ □ = 5 ]
    // Then delay and restart.

    const [step, setStep] = useState(0);

    useEffect(() => {
        const timings = [
            1500, // Show initial (□ + 3 = 8)
            800,  // Show click on [-3]
            1500, // Move and transform (□ = 8 - 3)
            2000, // Merge to answer (□ = 5)
        ];

        let timeout: ReturnType<typeof setTimeout>;

        const advance = (currentStep: number) => {
            timeout = setTimeout(() => {
                setStep((currentStep + 1) % 4);
            }, timings[currentStep]);
        };

        advance(step);

        return () => clearTimeout(timeout);
    }, [step]);

    return (
        <div className="w-full max-w-sm glass-panel rounded-2xl p-4 mb-6 relative overflow-hidden bg-slate-800/80 border-slate-600/50">
            {/* Title */}
            <p className="text-xs text-slate-400 font-bold tracking-wider text-center mb-3">
                あそびかた
            </p>

            {/* Animation Stage */}
            <div className="h-28 flex flex-col items-center justify-between relative">
                
                {/* Equation Display */}
                <div className="glass-dark px-4 py-2 rounded-xl flex items-center text-xl font-bold mt-2">
                    <span className="text-emerald-400 border border-emerald-500/30 bg-emerald-900/40 px-1.5 rounded mr-2">□</span>
                    
                    {/* Left side +3 */}
                    <div className="relative w-8 h-6 flex justify-center items-center">
                        <span className={`absolute transition-all duration-500 font-black
                            ${step === 0 || step === 1 ? 'opacity-100 transform-none text-emerald-400' : 'opacity-0 translate-x-[60px] scale-50'}`}>
                            +3
                        </span>
                    </div>

                    <span className="text-slate-500 mx-2">=</span>
                    
                    {/* Right side numbers */}
                    <div className="relative w-16 h-6 flex justify-center items-center">
                        <span className={`absolute transition-all duration-500
                            ${step === 3 ? 'opacity-0 scale-50' : 'opacity-100 scale-100 text-slate-100'}`}>
                            8
                        </span>
                        
                        {/* Moved -3 */}
                        <span className={`absolute font-black transition-all duration-500 text-rose-400
                            ${step >= 2 ? (step === 3 ? 'opacity-0 scale-50 translate-x-4' : 'opacity-100 scale-100 translate-x-4') : 'opacity-0 -translate-x-12 scale-50'}`}>
                            −3
                        </span>

                        {/* Final Answer 5 */}
                        <span className={`absolute font-black text-emerald-300 transition-all duration-500
                            ${step === 3 ? 'opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'opacity-0 scale-50'}`}>
                            5
                        </span>
                    </div>
                </div>

                {/* Choices Bar (mini version) */}
                <div className="w-full flex justify-center gap-2 mb-1">
                    <div className="w-12 h-10 glass-dark rounded flex justify-center items-center opacity-40 scale-90">
                        <span className="text-xs font-bold text-amber-400">×2</span>
                    </div>
                    <div className={`w-12 h-10 glass-dark rounded flex justify-center items-center border transition-all duration-300
                        ${step === 1 ? 'border-amber-400/80 bg-slate-700 shadow-[0_0_10px_rgba(251,191,36,0.5)] scale-95' : 'border-white/10'}`}>
                        <span className="text-slate-100 font-bold text-sm"><span className="text-rose-400 mr-0.5">−</span>3</span>
                    </div>
                    <div className="w-12 h-10 glass-dark rounded flex justify-center items-center opacity-40 scale-90">
                        <span className="text-xs font-bold text-emerald-400">+5</span>
                    </div>
                </div>

                {/* Animated Hand/Cursor */}
                <div className={`absolute text-2xl drop-shadow-lg transition-all duration-500 z-10
                    ${step === 0 ? 'top-20 right-4 opacity-0' : ''}
                    ${step === 1 ? 'top-[4.5rem] right-[42%] translate-x-2 opacity-100 scale-90' : ''}
                    ${step >= 2 ? 'top-[4.5rem] right-[42%] opacity-0 translate-y-4' : ''}
                `}>
                    👆
                </div>

                {/* Tutorial text blurb */}
                <div className="absolute top-0 right-2 w-32">
                    <p className={`text-[10px] text-teal-200 bg-teal-900/60 border border-teal-500/30 rounded p-1 text-center transition-opacity duration-300
                        ${step === 0 || step === 1 ? 'opacity-100' : 'opacity-0'}`}>
                        「+3」を消すために<br/>「-3」を選ぼう！
                    </p>
                    <p className={`text-[10px] text-emerald-200 bg-emerald-900/60 border border-emerald-500/30 rounded p-1 text-center transition-opacity duration-300 absolute top-0 left-0 w-full
                        ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                        右辺に移動して<br/>計算されるよ！
                    </p>
                </div>
            </div>
        </div>
    );
}
