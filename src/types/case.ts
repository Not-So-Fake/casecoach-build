export type CaseType = 'Profitability' | 'Market entry' | 'Market sizing';

export type Difficulty = 'Introductory' | 'Standard';

export type CaseStage = 'Clarify' | 'Structure' | 'Analyse' | 'Recommend' | 'Feedback';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  displayContent: string;
  apiContent: string;
  stage?: CaseStage;
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  markdown: string;
}

export interface ExhibitItem {
  id: string;
  number: number;
  headers: string[];
  rows: string[][];
  messageId: string;
}

export interface ScorecardRow {
  skill: string;
  rating: string;
  evidence: string;
  improvement: string;
}

export interface CaseSessionConfig {
  caseType: CaseType;
  difficulty: Difficulty;
  industry: string;
  hiddenSetting: string | null;
  initialVisibleMessage: string;
  initialApiMessage: string;
}
