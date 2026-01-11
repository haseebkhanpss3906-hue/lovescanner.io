
export interface Question {
  id: number;
  section: string;
  text: string;
}

export interface SectionScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface UserAnswers {
  [questionId: number]: number;
}

export enum AppStep {
  HOME = 'HOME',
  NAME_INPUT = 'NAME_INPUT',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  ANALYZING = 'ANALYZING',
  REACTION_PROMPT = 'REACTION_PROMPT',
  REACTION_RECORDING = 'REACTION_RECORDING',
  RESULTS = 'RESULTS',
  FAQ = 'FAQ'
}

export interface LoveResult {
  category: string;
  score: number;
  colorClass: string;
  description: string;
  advice: string;
  sectionScores: SectionScore[];
}
