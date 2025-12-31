
export enum Operation {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '×',
  DIVIDE = '÷',
  NONE = ''
}

export interface CalculationHistory {
  expression: string;
  result: string;
  timestamp: number;
}

export interface AIExplanation {
  steps: string[];
  concept: string;
}
