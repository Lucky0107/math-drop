export type Operator = '+' | '-' | '*' | '/';

// Define the AST Nodes
export interface NumberNode {
    type: 'number';
    value: number;
}

export interface VarNode {
    type: 'variable';
    name: '□';
}

export interface BinOpNode {
    type: 'binop';
    operator: Operator;
    left: MathNode;
    right: MathNode;
}

export type MathNode = NumberNode | VarNode | BinOpNode;

export interface MathEquation {
    left: MathNode;
    right: MathNode; // Typically just a NumberNode representing the target answer initially
}

/**
 * Serializes the AST to a readable string (e.g., "(□ + 3) * 2")
 */
export function stringifyNode(node: MathNode, parentPrecedence: number = 0): string {
    if (node.type === 'number') {
        return node.value.toString();
    }
    if (node.type === 'variable') {
        return node.name;
    }

    if (node.type === 'binop') {
        const p = getPrecedence(node.operator);
        const leftStr = stringifyNode(node.left, p);
        // For commutative things, right precedence is same, but for -, / we might need strictly higher,
        // simplify by just using the same precedence for stringification grouping
        const rightStr = stringifyNode(node.right, p + (node.operator === '-' || node.operator === '/' ? 0.1 : 0));

        // Add spaces around weak operators, no spaces around * and /
        const opStr = (node.operator === '+' || node.operator === '-') ? ` ${node.operator} ` : ` ${getDisplayOp(node.operator)} `;
        const str = `${leftStr}${opStr}${rightStr}`;

        if (p < parentPrecedence) {
            return `(${str})`;
        }
        return str;
    }

    return '';
}

export function stringifyEquation(eq: MathEquation): string {
    return `${stringifyNode(eq.left)} = ${stringifyNode(eq.right)}`;
}

function getPrecedence(op: Operator): number {
    if (op === '+' || op === '-') return 1;
    if (op === '*' || op === '/') return 2;
    return 0;
}

function getDisplayOp(op: Operator): string {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
}

/**
 * Evaluates the node given a value for the variable.
 */
export function evaluateNode(node: MathNode, varValue: number): number {
    if (node.type === 'number') return node.value;
    if (node.type === 'variable') return varValue;
    if (node.type === 'binop') {
        const leftVal = evaluateNode(node.left, varValue);
        const rightVal = evaluateNode(node.right, varValue);
        switch (node.operator) {
            case '+': return leftVal + rightVal;
            case '-': return leftVal - rightVal;
            case '*': return leftVal * rightVal;
            case '/': return leftVal / rightVal;
        }
    }
    return 0;
}

/**
 * Checks if a specific value for □ satisfies the equation.
 */
export function checkSolution(eq: MathEquation, varValue: number): boolean {
    const leftVal = evaluateNode(eq.left, varValue);
    const rightVal = evaluateNode(eq.right, varValue);
    // Allow tiny floating point errors if any divisions creep in
    return Math.abs(leftVal - rightVal) < 1e-6;
}

// --- Algebraic Transformation (移項) ---

export interface MathAction {
    operator: Operator;
    operand: number;
}

function getInverseOperator(op: Operator): Operator {
    switch (op) {
        case '+': return '-';
        case '-': return '+';
        case '*': return '/';
        case '/': return '*';
    }
}

/**
 * Evaluates a node completely if it contains no variables.
 * Returns null if it contains a variable.
 */
export function tryEvaluateStatic(node: MathNode): number | null {
    if (node.type === 'number') return node.value;
    if (node.type === 'variable') return null;
    if (node.type === 'binop') {
        const leftVal = tryEvaluateStatic(node.left);
        const rightVal = tryEvaluateStatic(node.right);
        if (leftVal === null || rightVal === null) return null;
        switch (node.operator) {
            case '+': return leftVal + rightVal;
            case '-': return leftVal - rightVal;
            case '*': return leftVal * rightVal;
            case '/': return leftVal / rightVal;
        }
    }
    return null;
}

/**
 * Attempts to apply an operation to both sides of the equation to simplify it.
 * This is the core mechanic of the game: peeling off the outer-most operation.
 * 
 * Returns the transformed equation if the move was valid, null otherwise.
 * A move is valid if it matches the *inverse* of the *outermost* operation on the side with the variable.
 */
export function applyMathAction(eq: MathEquation, action: MathAction): MathEquation | null {
    // Assume the variable is always on the left for simplicity in this MVP
    const leftNode = eq.left;
    const rightNode = eq.right;

    // If left is already just the variable, we can't peel anymore
    if (leftNode.type === 'variable') return null;

    if (leftNode.type === 'binop') {
        // We can only peel if one side is static (just numbers) and matches the operand
        const staticLeft = tryEvaluateStatic(leftNode.left);
        const staticRight = tryEvaluateStatic(leftNode.right);

        // Case 1: Structure is (variable_part) [op] (static_part)
        // E.g. (□ * 2) + 3
        if (staticRight !== null && staticRight === action.operand) {
            if (getInverseOperator(leftNode.operator) === action.operator) {
                // Valid match! e.g., (x+3) matching -3
                const newLeft = leftNode.left; // Peel outer
                const newRight: BinOpNode = {
                    type: 'binop',
                    operator: action.operator,
                    left: rightNode,
                    right: { type: 'number', value: action.operand }
                };
                const evaluatedRight = tryEvaluateStatic(newRight);
                return {
                    left: newLeft,
                    right: evaluatedRight !== null ? { type: 'number', value: evaluatedRight } : newRight
                };
            }
        }

        // Case 2: Structure is (static_part) [op] (variable_part)
        // E.g. 3 + (□ * 2)
        if (staticLeft !== null && staticLeft === action.operand) {
            // Addition and multiplication are commutative
            if ((leftNode.operator === '+' && action.operator === '-') ||
                (leftNode.operator === '*' && action.operator === '/')) {
                const newLeft = leftNode.right;
                const newRight: BinOpNode = {
                    type: 'binop',
                    operator: action.operator, // '-' or '/'
                    left: rightNode,
                    right: { type: 'number', value: action.operand }
                };
                const evaluatedRight = tryEvaluateStatic(newRight);
                return {
                    left: newLeft,
                    right: evaluatedRight !== null ? { type: 'number', value: evaluatedRight } : newRight
                };
            }

            // Subtraction (10 - □ = 4) -> (□ = 10 - 4)
            // Let's hold off on complex subtraction/division where the variable is on the right of the operator
            // for level 1-10 unless specifically requested, or we ensure the generator doesn't make these.
            // Actually, we can just ensure Generator always puts the variable on the LEFT side of non-commutative operations.
        }
    }

    return null;
}
