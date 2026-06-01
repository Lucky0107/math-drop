import { evaluateNode, tryEvaluateStatic } from './mathEngine';
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
        // Swap sides randomly (50% chance) to allow the variable/complex part to appear on either side,
        // which naturally generates left-hand operator cases (e.g. 10 - X = 6 or 12 / X = 4).
        const swapSides = Math.random() > 0.5;

        const candidateLeft = swapSides ? { type: 'number', value: operand } as NumberNode : node;
        const candidateRight = swapSides ? node : { type: 'number', value: operand } as NumberNode;

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
 * Resolves the correct operation for a specific AST node.
 */
export function getCorrectActionForNode(node: MathNode): MathAction | null {
    if (node.type !== 'binop') return null;

    const staticLeft = tryEvaluateStatic(node.left);
    const staticRight = tryEvaluateStatic(node.right);

    // Case 1: static value is on the right (e.g., X + 3, X - 3, X * 3, X / 3)
    if (staticRight !== null) {
        let op: Operator = '+';
        switch (node.operator) {
            case '+': op = '-'; break;
            case '-': op = '+'; break;
            case '*': op = '/'; break;
            case '/': op = '*'; break;
        }
        return { operator: op, operand: staticRight };
    }

    // Case 2: static value is on the left (e.g., 3 + X, 3 - X, 3 * X, 3 / X)
    if (staticLeft !== null) {
        // Commutative addition and multiplication behave standardly
        if (node.operator === '+') {
            return { operator: '-', operand: staticLeft };
        }
        if (node.operator === '*') {
            return { operator: '/', operand: staticLeft };
        }
        // Non-commutative subtraction and division require a Left-Hand Action
        // e.g. 10 - X = 6 -> X = 10 - 6 (action is "10 -")
        if (node.operator === '-' || node.operator === '/') {
            return { operator: node.operator, operand: staticLeft, isLeftHand: true };
        }
    }

    return null;
}

/**
 * Analyzes an equation to find the CORRECT next action needed to simplify it.
 */
export function getCorrectAction(eq: MathEquation): MathAction | null {
    return getCorrectActionForNode(eq.left);
}

/**
 * Traverses the AST below the root and extracts correct actions of nested operations
 * to serve as priority trap decoys (distractors).
 */
export function getIncorrectPriorityActions(node: MathNode): MathAction[] {
    const actions: MathAction[] = [];

    function traverse(currentNode: MathNode) {
        if (currentNode.type !== 'binop') return;

        const action = getCorrectActionForNode(currentNode);
        if (action) {
            actions.push(action);
        }

        // Search deeper
        traverse(currentNode.left);
        traverse(currentNode.right);
    }

    // Start traversal on child nodes to exclude the root operation (which is correct)
    if (node.type === 'binop') {
        traverse(node.left);
        traverse(node.right);
    }

    return actions;
}

/**
 * Generates the correct action and 3 dummy actions.
 * If level > 3, it inserts intermediate nested operations as priority trap decoys.
 */
export function generateActionChoices(eq: MathEquation, level: number): MathAction[] {
    const correct = getCorrectAction(eq);
    if (!correct) return []; // Equation is already solved or malformed

    const choices: MathAction[] = [correct];

    // For Level 4 and above, inject incorrect priority actions (inner operations) as decoys
    if (level > 3) {
        const decoys = getIncorrectPriorityActions(eq.left);
        for (const decoy of decoys) {
            if (choices.length >= 4) break;
            
            // Check uniqueness
            const isDuplicate = choices.some(c => 
                c.operator === decoy.operator && 
                c.operand === decoy.operand && 
                c.isLeftHand === decoy.isLeftHand
            );
            if (!isDuplicate) {
                choices.push(decoy);
            }
        }
    }

    const operators: Operator[] = ['+', '-', '*', '/'];

    while (choices.length < 4) {
        const rOp = randomItem(operators);
        const rOpndOffset = randomInt(-2, 2);
        let rOpnd = Math.max(1, correct.operand + rOpndOffset);

        // Occasionally pick completely random operand
        if (Math.random() > 0.5) {
            rOpnd = randomInt(2, 10);
        }

        // Randomly assign left-hand flag for non-commutative operators to diversify choices
        const rIsLeftHand = (rOp === '-' || rOp === '/') && Math.random() > 0.4;
        const candidate: MathAction = { 
            operator: rOp, 
            operand: rOpnd,
            isLeftHand: rIsLeftHand
        };

        // Ensure uniqueness
        const isDuplicate = choices.some(c => 
            c.operator === candidate.operator && 
            c.operand === candidate.operand &&
            c.isLeftHand === candidate.isLeftHand
        );
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
