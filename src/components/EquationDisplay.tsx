import { motion, AnimatePresence } from 'framer-motion';
import type { MathEquation, MathNode } from '../lib/mathEngine';

interface EquationDisplayProps {
    equation: MathEquation;
    isCorrectHit?: boolean;
}

const OP_DISPLAY: Record<string, string> = {
    '*': '×',
    '/': '÷',
    '+': '+',
    '-': '−',
};

function renderNode(node: MathNode, isRoot: boolean = true, depth: number = 0): React.ReactNode {
    if (node.type === 'number') {
        return (
            <motion.span
                key={`num-${node.value}-${depth}`}
                layout
                className="font-mono text-slate-100 inline-block"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {node.value}
            </motion.span>
        );
    }
    if (node.type === 'variable') {
        return (
            <motion.span
                key="var-□"
                layout
                className="text-emerald-400 font-black bg-emerald-900/30 px-2.5 py-0.5 rounded-lg border-2 border-emerald-500/40 mx-1 inline-block"
                animate={{
                    boxShadow: [
                        '0 0 8px rgba(52,211,153,0.2)',
                        '0 0 16px rgba(52,211,153,0.5)',
                        '0 0 8px rgba(52,211,153,0.2)',
                    ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                □
            </motion.span>
        );
    }
    if (node.type === 'binop') {
        const opStr = OP_DISPLAY[node.operator] || node.operator;

        const content = (
            <>
                {renderNode(node.left, false, depth + 1)}
                <motion.span 
                    layout 
                    key={`op-${node.operator}-${depth}`} 
                    className="text-teal-400 mx-2 font-bold inline-block"
                >
                    {opStr}
                </motion.span>
                {renderNode(node.right, false, depth + 1)}
            </>
        );

        return isRoot ? content : (
            <motion.span 
                layout 
                key={`parens-${depth}`} 
                className="text-slate-400 inline-block"
            >
                (<span className="text-slate-100">{content}</span>)
            </motion.span>
        );
    }
    return null;
}

export function EquationDisplay({ equation, isCorrectHit }: EquationDisplayProps) {
    return (
        <motion.div
            className={`glass-dark px-6 py-5 rounded-2xl border-t border-t-white/20 flex items-center text-3xl font-bold tracking-wider relative overflow-hidden ${isCorrectHit ? 'animate-solve-burst' : ''}`}
            layout
            initial={{ opacity: 0.5, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Background flare on hit */}
            <AnimatePresence>
                {isCorrectHit && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-teal-400/30 to-emerald-400/30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-center text-slate-100 z-10 flex-wrap justify-center">
                {renderNode(equation.left, true)}
                <span className="text-slate-500 mx-4 font-black">=</span>
                {renderNode(equation.right, true)}
            </div>
        </motion.div>
    );
}
