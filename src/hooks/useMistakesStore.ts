import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MistakeEntry,
  InfinitePracticeQuestion,
  QuestionDiagnostic,
  InfinitePracticeQuestionSolution,
  ChapterDiagnostic,
  MistakeType,
} from "../types";

const STORAGE_KEY = "wegenz_mistakes_v1";

interface MistakesState {
  mistakes: MistakeEntry[];
  isLoading: boolean;
  loadMistakes: () => Promise<void>;
  recordSessionMistakes: (
    testId: string,
    questions: InfinitePracticeQuestion[],
    diagnoses: QuestionDiagnostic[],
    solutions: InfinitePracticeQuestionSolution[],
  ) => Promise<void>;
  toggleMastered: (questionId: string) => Promise<void>;
  updatePersonalNote: (questionId: string, note: string) => Promise<void>;
  removeMistake: (questionId: string) => Promise<void>;
  clearMistakes: () => Promise<void>;
  getChapterMasterySummary: () => {
    chapterId: string;
    chapterName: string;
    subjectName: string;
    totalMistakes: number;
    activeMistakes: number;
    masteredCount: number;
    masteryPercentage: number;
  }[];
}

export const useMistakesStore = create<MistakesState>((set, get) => ({
  mistakes: [],
  isLoading: true,

  loadMistakes: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ mistakes: JSON.parse(stored), isLoading: false });
      } else {
        set({ mistakes: [], isLoading: false });
      }
    } catch {
      set({ mistakes: [], isLoading: false });
    }
  },

  recordSessionMistakes: async (testId, questions, diagnoses, solutions) => {
    const incorrectDiagnoses = diagnoses.filter((d) => d.status === "INCORRECT");
    if (incorrectDiagnoses.length === 0) return;

    const currentMistakes = [...get().mistakes];
    const existingMap = new Map(currentMistakes.map((m) => [m.questionId, m]));

    incorrectDiagnoses.forEach((diag) => {
      const q = questions.find((item) => item.questionId === diag.questionId);
      const sol = solutions.find((item) => item.questionId === diag.questionId);
      if (!q) return;

      const existing = existingMap.get(diag.questionId);
      const entry: MistakeEntry = {
        questionId: q.questionId,
        testId,
        chapterId: q.chapterId || diag.chapterId,
        chapterName: q.chapterName || diag.chapterName,
        subjectName: q.subjectName || diag.subjectName,
        mistakeType: diag.mistakeType || "CONCEPTUAL_TRAP",
        mistakeTitle: diag.mistakeTitle || "Mistake Logged",
        mistakeAdvice:
          diag.mistakeAdvice ||
          "Review step-by-step KaTeX solutions and note the core theorem.",
        recordedAt: new Date().toISOString(),
        mastered: false,
        personalNote: existing?.personalNote || "",
        timeTakenMs: diag.timeTakenMs || sol?.timeTaken || 0,
        question: q,
      };

      existingMap.set(q.questionId, entry);
    });

    const updated = Array.from(existingMap.values());
    set({ mistakes: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  toggleMastered: async (questionId) => {
    const updated = get().mistakes.map((m) =>
      m.questionId === questionId ? { ...m, mastered: !m.mastered } : m,
    );
    set({ mistakes: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  updatePersonalNote: async (questionId, note) => {
    const updated = get().mistakes.map((m) =>
      m.questionId === questionId ? { ...m, personalNote: note } : m,
    );
    set({ mistakes: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  removeMistake: async (questionId) => {
    const updated = get().mistakes.filter((m) => m.questionId !== questionId);
    set({ mistakes: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  clearMistakes: async () => {
    set({ mistakes: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },

  getChapterMasterySummary: () => {
    const mistakes = get().mistakes;
    const map = new Map<
      string,
      {
        chapterId: string;
        chapterName: string;
        subjectName: string;
        total: number;
        mastered: number;
      }
    >();

    mistakes.forEach((m) => {
      const key = m.chapterId || m.chapterName;
      if (!map.has(key)) {
        map.set(key, {
          chapterId: m.chapterId,
          chapterName: m.chapterName,
          subjectName: m.subjectName,
          total: 0,
          mastered: 0,
        });
      }
      const data = map.get(key)!;
      data.total += 1;
      if (m.mastered) data.mastered += 1;
    });

    return Array.from(map.values())
      .map((item) => ({
        chapterId: item.chapterId,
        chapterName: item.chapterName,
        subjectName: item.subjectName,
        totalMistakes: item.total,
        activeMistakes: item.total - item.mastered,
        masteredCount: item.mastered,
        masteryPercentage: item.total > 0 ? Math.round((item.mastered / item.total) * 100) : 0,
      }))
      .sort((a, b) => b.activeMistakes - a.activeMistakes);
  },
}));
