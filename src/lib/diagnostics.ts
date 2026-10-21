import {
  InfinitePracticeQuestion,
  InfinitePracticeQuestionSolution,
  PracticeDiagnosticReport,
  QuestionDiagnostic,
  ChapterDiagnostic,
  MistakeType,
} from "../types";

export function resolveQuestionStatus(
  resp: InfinitePracticeQuestionSolution,
  questions: InfinitePracticeQuestion[],
): "CORRECT" | "INCORRECT" | "SKIPPED" {
  if (resp.status === "CORRECT" || resp.status === "INCORRECT" || resp.status === "SKIPPED") {
    return resp.status;
  }
  const marked = resp.markedSolutions || [];
  if (marked.length === 0) return "SKIPPED";

  const question = questions.find((q) => q.questionId === resp.questionId);
  const correctIndices = (resp.options ?? question?.options ?? [])
    .map((opt, idx) => (opt.isCorrect ? idx + 1 : null))
    .filter((val): val is number => val !== null);

  if (correctIndices.length > 0) {
    const isCorrect =
      correctIndices.length === marked.length &&
      correctIndices.every((val) => marked.includes(val));
    return isCorrect ? "CORRECT" : "INCORRECT";
  }

  const numAns = resp.numericAnswer ?? question?.numericAnswer;
  if (numAns !== undefined && numAns !== null) {
    const userNum = Number(marked[0]);
    const correctNum = Number(numAns);
    const isNumCorrect =
      !isNaN(userNum) && !isNaN(correctNum)
        ? Math.abs(userNum - correctNum) < 0.001
        : String(marked[0]).trim().toLowerCase() === String(numAns).trim().toLowerCase();
    return isNumCorrect ? "CORRECT" : "INCORRECT";
  }

  return "INCORRECT";
}

export function diagnosePracticeSession(
  sessionQuestions: InfinitePracticeQuestion[],
  responses: InfinitePracticeQuestionSolution[],
): PracticeDiagnosticReport {
  const diagnoses: QuestionDiagnostic[] = [];
  const mistakeBreakdown: Record<MistakeType, number> = {
    RUSHED_GUESS: 0,
    TIME_SINK: 0,
    CALCULATION_ERROR: 0,
    CONCEPTUAL_TRAP: 0,
    FATIGUE_SLIP: 0,
  };

  const totalQuestions = sessionQuestions.length || responses.length || 1;
  const lateCutoffIndex = Math.floor(totalQuestions * 0.7);
  let consecutiveLateErrors = 0;

  const allTimesMs = responses.map((r) => r.timeTaken || 0).filter((t) => t > 0);
  const medianTimeMs =
    allTimesMs.length > 0
      ? allTimesMs.sort((a, b) => a - b)[Math.floor(allTimesMs.length / 2)]
      : 60000;
  const timeSinkThreshold = Math.max(150000, medianTimeMs * 2.2);

  const chapterMap = new Map<
    string,
    {
      chapterId: string;
      chapterName: string;
      subjectName: string;
      subjectId?: string;
      total: number;
      correct: number;
      incorrect: number;
      skipped: number;
      totalTimeMs: number;
      mistakeCounts: Partial<Record<MistakeType, number>>;
    }
  >();

  responses.forEach((resp, idx) => {
    const qNum = resp.questionNumber ?? idx + 1;
    const sessionQ = sessionQuestions.find((q) => q.questionId === resp.questionId) || sessionQuestions[idx];
    const status = resolveQuestionStatus(resp, sessionQuestions);
    const timeMs = resp.timeTaken || 0;
    const chapterId = resp.chapterId || sessionQ?.chapterId || "general";
    const chapterName = resp.chapterName || sessionQ?.chapterName || "General Chapter";
    const subjectName = resp.subjectName || sessionQ?.subjectName || "Subject";
    const subjectId = resp.subjectId || sessionQ?.subjectId;
    const isNumerical =
      (resp.type === 3 || (!resp.options || resp.options.length === 0)) &&
      (resp.numericAnswer !== undefined || sessionQ?.numericAnswer !== undefined);

    let mistakeType: MistakeType | undefined;
    let mistakeTitle: string | undefined;
    let mistakeAdvice: string | undefined;

    if (status === "INCORRECT") {
      if (idx >= lateCutoffIndex) {
        consecutiveLateErrors += 1;
      }

      if (timeMs > 0 && timeMs < 25000) {
        mistakeType = "RUSHED_GUESS";
        mistakeTitle = "Rushed Attempt (<25s)";
        mistakeAdvice = "You answered this question in under 25 seconds. Slow down and check all options before locking in.";
      } else if (timeMs >= timeSinkThreshold) {
        mistakeType = "TIME_SINK";
        mistakeTitle = `Time Sink (${Math.round(timeMs / 1000)}s)`;
        mistakeAdvice = "You spent significant time here without arriving at the right answer. Practice the 90s bail-out rule.";
      } else if (isNumerical) {
        mistakeType = "CALCULATION_ERROR";
        mistakeTitle = "Numerical / Value Error";
        mistakeAdvice = "Numerical question missed. Check unit conversions, decimal placements, or intermediate signs.";
      } else if (idx >= lateCutoffIndex && consecutiveLateErrors >= 2) {
        mistakeType = "FATIGUE_SLIP";
        mistakeTitle = "End-of-Test Fatigue";
        mistakeAdvice = "Late-test error detected. Deep breathing between questions helps sustain focus under exam pressure.";
      } else {
        mistakeType = "CONCEPTUAL_TRAP";
        mistakeTitle = "Conceptual Trap";
        mistakeAdvice = "Fell for a distractor option. Revisit foundational definitions and standard exceptions in this chapter.";
      }

      mistakeBreakdown[mistakeType] += 1;
    } else {
      consecutiveLateErrors = 0;
    }

    diagnoses.push({
      questionId: resp.questionId,
      questionNumber: qNum,
      subjectName,
      chapterName,
      chapterId,
      status,
      timeTakenMs: timeMs,
      mistakeType,
      mistakeTitle,
      mistakeAdvice,
    });

    if (!chapterMap.has(chapterId)) {
      chapterMap.set(chapterId, {
        chapterId,
        chapterName,
        subjectName,
        subjectId,
        total: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        totalTimeMs: 0,
        mistakeCounts: {},
      });
    }

    const cData = chapterMap.get(chapterId)!;
    cData.total += 1;
    cData.totalTimeMs += timeMs;
    if (status === "CORRECT") cData.correct += 1;
    else if (status === "INCORRECT") {
      cData.incorrect += 1;
      if (mistakeType) {
        cData.mistakeCounts[mistakeType] = (cData.mistakeCounts[mistakeType] || 0) + 1;
      }
    } else {
      cData.skipped += 1;
    }
  });

  const chapterDiagnostics: ChapterDiagnostic[] = Array.from(chapterMap.values()).map((c) => {
    const accuracy = c.correct + c.incorrect > 0 ? Math.round((c.correct / (c.correct + c.incorrect)) * 100) : 0;
    const netScore = c.correct * 4 - c.incorrect * 1;
    let urgency: "CRITICAL" | "MODERATE" | "STRONGHOLD" = "MODERATE";

    if (c.incorrect > c.correct || (c.total >= 2 && accuracy < 50)) {
      urgency = "CRITICAL";
    } else if (accuracy >= 75 && c.correct >= 2) {
      urgency = "STRONGHOLD";
    }

    return {
      chapterId: c.chapterId,
      chapterName: c.chapterName,
      subjectName: c.subjectName,
      subjectId: c.subjectId,
      totalQuestions: c.total,
      correct: c.correct,
      incorrect: c.incorrect,
      skipped: c.skipped,
      accuracy,
      netScore,
      urgency,
      avgTimeMs: c.total > 0 ? Math.round(c.totalTimeMs / c.total) : 0,
      mistakeCounts: c.mistakeCounts,
    };
  });

  chapterDiagnostics.sort((a, b) => a.accuracy - b.accuracy || a.netScore - b.netScore);

  const weakestChapters = chapterDiagnostics.filter((c) => c.urgency === "CRITICAL" || c.accuracy < 60);

  let productiveTimeMs = 0;
  let lostTimeMs = 0;
  let skippedTimeMs = 0;

  diagnoses.forEach((d) => {
    if (d.status === "CORRECT") productiveTimeMs += d.timeTakenMs;
    else if (d.status === "INCORRECT") lostTimeMs += d.timeTakenMs;
    else skippedTimeMs += d.timeTakenMs;
  });

  const totalTimeMs = productiveTimeMs + lostTimeMs + skippedTimeMs;
  const lostTimePercentage = totalTimeMs > 0 ? Math.round((lostTimeMs / totalTimeMs) * 100) : 0;

  const totalCorrect = diagnoses.filter((d) => d.status === "CORRECT").length;
  const totalIncorrect = diagnoses.filter((d) => d.status === "INCORRECT").length;
  const totalScore = totalCorrect * 4 - totalIncorrect * 1;
  const overallAccuracy =
    totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

  const prescription: string[] = [];
  if (mistakeBreakdown.RUSHED_GUESS >= 2) {
    prescription.push("Enforce a 30-second minimum per question before selecting an option to avoid impulsive misses.");
  }
  if (mistakeBreakdown.TIME_SINK >= 1) {
    prescription.push("Implement the 2-minute bail-out rule: if no clear path is visible by 120s, flag and move forward.");
  }
  if (mistakeBreakdown.CALCULATION_ERROR >= 2) {
    prescription.push("Review intermediate units (SI vs CGS) and rewrite formulas cleanly in scratch margins.");
  }
  if (weakestChapters.length > 0) {
    prescription.push(`Target high-priority revision in: ${weakestChapters.slice(0, 2).map((c) => c.chapterName).join(", ")}.`);
  }
  if (prescription.length === 0) {
    prescription.push("Consistent performance. Continue timed sets and drill varied difficulties.");
  }

  return {
    diagnoses,
    chapterDiagnostics,
    weakestChapters,
    mistakeBreakdown,
    timeEconomy: {
      totalTimeMs,
      productiveTimeMs,
      lostTimeMs,
      skippedTimeMs,
      lostTimePercentage,
    },
    totalScore,
    overallAccuracy,
    prescription,
  };
}
