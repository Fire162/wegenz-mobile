export interface InfinitePracticeSubject {
  subjectId: string;
  subjectName: string;
  chapterCount?: number;
  questionCount?: number;
}

export interface InfinitePracticeChapter {
  chapterId: string;
  englishName: string;
  questionCount: number;
  classId: string;
  subjectId: string;
  subjectName: string;
}

export interface QuestionOption {
  text: string;
  isCorrect?: boolean;
}

export interface QuestionSolution {
  content: string;
}

export interface InfinitePracticeQuestion {
  questionId: string;
  content: string;
  plainQuestionText: string;
  options: QuestionOption[];
  solutions: QuestionSolution[];
  type: number; // 1: SCQ, 2: MCQ, 3: Numeric
  difficulty: number;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  numericAnswer?: string | number | null;
}

export interface InfinitePracticeQuestionSolution {
  questionId: string;
  content: string;
  plainQuestionText: string;
  options: QuestionOption[];
  solutions: QuestionSolution[];
  type: number;
  difficulty: number;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  status: "CORRECT" | "INCORRECT" | "SKIPPED";
  markedSolutions: (number | string)[];
  timeTaken: number;
  questionNumber: number;
  numericAnswer?: string | number | null;
}

export interface InfinitePracticeTestSolution {
  testId: string;
  accuracy: number;
  totalCorrectQuestions: number;
  totalIncorrectQuestions: number;
  totalSkippedQuestions: number;
  score: number;
  userScore: number;
  questionsResponses: InfinitePracticeQuestionSolution[];
}

export type MistakeType =
  | "RUSHED_GUESS"
  | "TIME_SINK"
  | "CALCULATION_ERROR"
  | "CONCEPTUAL_TRAP"
  | "FATIGUE_SLIP";

export interface QuestionDiagnostic {
  questionId: string;
  questionNumber: number;
  subjectName: string;
  chapterName: string;
  chapterId: string;
  status: "CORRECT" | "INCORRECT" | "SKIPPED";
  timeTakenMs: number;
  mistakeType?: MistakeType;
  mistakeTitle?: string;
  mistakeAdvice?: string;
}

export interface ChapterDiagnostic {
  chapterId: string;
  chapterName: string;
  subjectName: string;
  subjectId?: string;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
  netScore: number;
  urgency: "CRITICAL" | "MODERATE" | "STRONGHOLD";
  avgTimeMs: number;
  mistakeCounts: Partial<Record<MistakeType, number>>;
}

export interface TimeEconomy {
  totalTimeMs: number;
  productiveTimeMs: number;
  lostTimeMs: number;
  skippedTimeMs: number;
  lostTimePercentage: number;
}

export interface PracticeDiagnosticReport {
  diagnoses: QuestionDiagnostic[];
  chapterDiagnostics: ChapterDiagnostic[];
  weakestChapters: ChapterDiagnostic[];
  mistakeBreakdown: Record<MistakeType, number>;
  timeEconomy: TimeEconomy;
  totalScore: number;
  overallAccuracy: number;
  prescription: string[];
}

export interface MistakeEntry {
  questionId: string;
  testId: string;
  chapterId: string;
  chapterName: string;
  subjectName: string;
  mistakeType: MistakeType;
  mistakeTitle: string;
  mistakeAdvice: string;
  recordedAt: string;
  mastered: boolean;
  personalNote: string;
  timeTakenMs: number;
  question: InfinitePracticeQuestion;
}

export interface TrackBatch {
  id: string;
  name: string;
  label: string;
  category: "JEE" | "NEET";
  grade: "11th" | "12th";
}

export const TRACK_BATCHES: TrackBatch[] = [
  { id: "11th_JEE", name: "11th JEE", label: "Class 11 JEE Main & Adv", category: "JEE", grade: "11th" },
  { id: "12th_JEE", name: "12th JEE", label: "Class 12 JEE Main & Adv", category: "JEE", grade: "12th" },
  { id: "11th_NEET", name: "11th NEET", label: "Class 11 NEET Medical", category: "NEET", grade: "11th" },
  { id: "12th_NEET", name: "12th NEET", label: "Class 12 NEET Medical", category: "NEET", grade: "12th" },
];
