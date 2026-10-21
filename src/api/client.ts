import {
  InfinitePracticeSubject,
  InfinitePracticeChapter,
  InfinitePracticeQuestion,
} from "../types";

export const API_BASE_URL = "https://wegenz.in/api";

const HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "x-api-key": "arjunonfire",
};

export async function fetchSubjects(batchId: string): Promise<InfinitePracticeSubject[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/subjects?batchId=${encodeURIComponent(batchId)}`, {
      headers: HEADERS,
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    return (json?.data?.subjects || []).map((s: any) => ({
      subjectId: s.subjectId,
      subjectName: s.englishName || s.subjectName || s.subjectId,
      chapterCount: s.chaptersCount || 0,
      questionCount: s.totalQuestions || 0,
    }));
  } catch (error) {
    console.error("fetchSubjects error:", error);
    return [];
  }
}

export async function fetchChapters(
  batchId: string,
  subjectId: string,
): Promise<InfinitePracticeChapter[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/chapters?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}`,
      { headers: HEADERS },
    );
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();
    const rawChapters = json?.data?.chapters || json?.chapters || [];
    return rawChapters.map((ch: any) => ({
      chapterId: ch.chapterId,
      englishName: ch.englishName || ch.chapterName || ch.name,
      questionCount: ch.questionCount || 0,
      classId: ch.classId || batchId,
      subjectId: ch.subjectId || subjectId,
      subjectName: ch.subjectName || subjectId,
    }));
  } catch (error) {
    console.error("fetchChapters error:", error);
    return [];
  }
}

export interface FetchQuestionsParams {
  batchId: string;
  count: number;
  subjectNames: string[];
  chapterNames: string[];
  difficulty?: number[];
  types?: number[];
}

export async function fetchPracticeQuestions(
  params: FetchQuestionsParams,
): Promise<InfinitePracticeQuestion[]> {
  const { batchId, count, subjectNames, chapterNames, difficulty = [1, 2, 3], types = [1, 2, 3, 6, 8] } = params;

  let query = `grade=${encodeURIComponent(batchId)}&count=${Math.min(Math.max(1, count), 100)}`;
  if (subjectNames.length > 0) {
    query += `&subjects=${encodeURIComponent(subjectNames.join(","))}`;
  }
  if (chapterNames.length > 0) {
    query += `&chapters=${encodeURIComponent(chapterNames.join(","))}`;
  }
  query += `&types=${encodeURIComponent(types.join(","))}`;
  query += `&difficulty=${encodeURIComponent(difficulty.join(","))}`;

  const res = await fetch(`${API_BASE_URL}/random?${query}`, {
    headers: HEADERS,
  });

  if (!res.ok) {
    throw new Error(`Failed to load questions: ${res.status}`);
  }

  const json = await res.json();
  const rawQuestions = json?.questions || json?.data?.questions || [];

  return rawQuestions.map((item: any, idx: number) => {
    const q = item.question || item;
    return {
      questionId: q.questionId || `q-${Date.now()}-${idx}`,
      content: q.content || "",
      plainQuestionText: q.plainQuestionText || "",
      options: (q.options || []).map((opt: any) => ({
        text: opt.text || "",
        isCorrect: Boolean(opt.isCorrect),
      })),
      solutions: (q.solutions || []).map((sol: any) => ({
        content: sol.content || "",
      })),
      type: q.type ?? 1,
      difficulty: q.difficulty ?? 2,
      chapterId: q.chapterId || "",
      chapterName: q.chapterName || "General Chapter",
      subjectId: q.subjectId || "",
      subjectName: q.subjectName || "General Subject",
      numericAnswer: q.numericAnswer ?? null,
    };
  });
}
