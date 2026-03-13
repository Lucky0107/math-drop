import { evaluateNode } from './mathEngine';
import type { MathEquation, MathNode, NumberNode, BinOpNode, Operator, MathAction } from './mathEngine';

// Random float between min and max
function randomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

// Random int between min and max (inclusive)
function randomInt(min: number, max: number) {
    return Math.floor(randomFloat(min, max + 1));
}

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}



/**
 * Strategy: "Reverse-evaluate" to build equations.
 * 1. Pick a random integer answer for □.
 * 2. Start with leftNode = VarNode.
 * 3. Apply N layers of wrappers.
 *    Wrapper: pick random Operator and random integer Operand.
 *    leftNode = { left: leftNode, op, right: Operand } (or reversed if commutative).
 * 4. The right side is simply evaluate(leftNode) with □ = Answer.
 *    If right side is not an integer (due to blind division), we throw it away and rebuild the layer.
 */
function generateTree(steps: number, level: number): MathEquation {
    // Start with a random answer 2..15
    const answer = randomInt(2, 10 + Math.floor(level / 2));
    let node: MathNode = { type: 'variable', name: '□' };

    let currentSteps = steps;
    let attempts = 0;

    while (currentSteps > 0 && attempts < 100) {
        attempts++;

        // Pick an operator
        let operators: Operator[] = ['+', '-'];
        if (level >= 2) operators.push('*');
        if (level >= 3) operators.push('/');

        const op = randomItem(operators);
        const operand = randomInt(2, 10 + Math.floor(level / 1.5));

        // Create candidate node structure
        // To ensure our applyMathAction works cleanly, we always put the variable/complex part on the left for non-commutative.
        // For commutative (+, *), we can do either, but let's stick to left for simplicity in MVP, or mix it up gently.
        const isReverseCommutative = (op === '+' || op === '*') && Math.random() > 0.5;

        const candidateLeft = isReverseCommutative ? { type: 'number', value: operand } as NumberNode : node;
        const candidateRight = isReverseCommutative ? node : { type: 'number', value: operand } as NumberNode;

        const candidateNode: BinOpNode = {
            type: 'binop',
            operator: op,
            left: candidateLeft,
            right: candidateRight
        };

        // Evaluate it with □ = answer
        const evalResult = evaluateNode(candidateNode, answer);

        // We only accept the step if it evaluates to an integer and isn't too large/small
        if (Number.isInteger(evalResult) && evalResult > 0 && evalResult < 1000) {
            if (op === '/') {
                // Extra strict for division: we don't want division by 1, and we want it to be a clean division
                if (operand === 1) continue;
            }

            // Valid step
            node = candidateNode;
            currentSteps--;
        }
    }

    const finalAnswer = evaluateNode(node, answer);

    return {
        left: node,
        right: { type: 'number', value: finalAnswer }
    };
}

export function generateEquationForLevel(level: number): MathEquation {
    // Determine number of steps (complexity) based on level (1 to 10)
    // Lv 1: 1 step
    // Lv 2: 1-2 steps
    // Lv 3-4: 2 steps
    // Lv 5-7: 2-3 steps
    // Lv 8-10: 3-4 steps
    let steps = 1;
    if (level === 2) steps = randomItem([1, 2]);
    if (level >= 3 && level <= 4) steps = 2;
    if (level >= 5 && level <= 7) steps = randomItem([2, 3]);
    if (level >= 8) steps = randomItem([3, 4]);

    return generateTree(steps, level);
}

/**
 * Analyzes an equation to find the CORRECT next action needed to simplify it based on our `applyMathAction` rules.
 */
export function getCorrectAction(eq: MathEquation): MathAction | null {
    const left = eq.left;
    if (left.type !== 'binop') return null;

    // Inverse of the outermost operation.
    let op: Operator = '+';
    switch (left.operator) {
        case '+': op = '-'; break;
        case '-': op = '+'; break;
        case '*': op = '/'; break;
        case '/': op = '*'; break;
    }

    // Find the operand
    let operand = 0;
    if (left.right.type === 'number') {
        operand = left.right.value;
    } else if (left.left.type === 'number') {
        operand = left.left.value;
    } else {
        // In a well-formed tree for this game, one side of a binop is always static until solved.
        // E.g. (□+2) * 3 -> right is NumberNode(3).
        // Let's use tryEvaluateStatic if it's not a direct NumberNode but evaluable.
        // (Skipping for this MVP as our generator always binds a NumberNode directly)
        return null;
    }

    return { operator: op, operand };
}

/**
 * Generates the correct action and 3 dummy actions.
 */
export function generateActionChoices(eq: MathEquation): MathAction[] {
    const correct = getCorrectAction(eq);
    if (!correct) return []; // Equation is already solved or malformed

    const choices: MathAction[] = [correct];
    const operators: Operator[] = ['+', '-', '*', '/'];

    while (choices.length < 4) {
        const rOp = randomItem(operators);
        // Perturb the correct operand slightly, or pick a random small one
        const rOpndOffset = randomInt(-2, 2);
        let rOpnd = Math.max(1, correct.operand + rOpndOffset);

        // Occasionally pick completely random operand
        if (Math.random() > 0.5) {
            rOpnd = randomInt(2, 10);
        }

        const candidate: MathAction = { operator: rOp, operand: rOpnd };

        // Ensure uniqueness
        const isDuplicate = choices.some(c => c.operator === candidate.operator && c.operand === candidate.operand);
        if (!isDuplicate) {
            choices.push(candidate);
        }
    }

    // Shuffle array using Fisher-Yates
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    return choices;
}
