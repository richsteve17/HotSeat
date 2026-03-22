export type AppMode = 'HOME' | 'HOT_TAKE' | 'PRESS_PASS';
export type DebatePhase = 'OPENING' | 'CROSS_EXAM' | 'AUDIENCE' | 'CLOSING';

export interface HotTakeCategory {
  id: string;
  name: string;
  icon: string;
  topics: string[];
}

export interface PressScenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Hostile';
  roleLabel: string;
  interviewerLabel: string;
  presets: { role: string; interviewer: string }[];
}

export interface DebateSession {
  topic: string;
  rounds: number;
  currentRound: number;
  transcript: { role: 'user' | 'ai'; text: string }[];
}

export interface ScoreCardData {
  score: number;
  metrics: {
    label: string;
    value: number;
    feedback: string;
  }[];
  summary: string;
  bestLine?: string;
  initialPoll?: { for: number; against: number; undecided: number };
  finalPoll?: { for: number; against: number; undecided: number };
}
