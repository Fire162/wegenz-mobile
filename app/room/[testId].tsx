import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
  Alert,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MathView } from "../../src/components/MathView";
import { useBookmarksStore } from "../../src/hooks/useBookmarksStore";
import { useMistakesStore } from "../../src/hooks/useMistakesStore";
import { diagnosePracticeSession } from "../../src/lib/diagnostics";
import {
  InfinitePracticeQuestion,
  InfinitePracticeQuestionSolution,
} from "../../src/types";

export default function QuestionRoomScreen() {
  const router = useRouter();
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const session = (globalThis as any).__ACTIVE_TEST_SESSION__ || null;
  const questions: InfinitePracticeQuestion[] = session?.questions || [];
  const practiceMode: "EXAM" | "QUIZ" = session?.practiceMode || "EXAM";
  const timeLimitSeconds: number = session?.timeLimitSeconds || 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number[]>>({});
  const [numericInputs, setNumericInputs] = useState<Record<string, string>>({});
  const [questionTimeMap, setQuestionTimeMap] = useState<Record<string, number>>({});
  const [elapsedTotal, setElapsedTotal] = useState(0);
  const [showPalette, setShowPalette] = useState(false);

  const { isBookmarked, toggleBookmark } = useBookmarksStore();
  const recordSessionMistakes = useMistakesStore((s) => s.recordSessionMistakes);

  const qStartTimeRef = useRef(Date.now());

  const currentQ: InfinitePracticeQuestion | undefined = questions[currentIndex];

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTotal((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update time spent on current question before switching
  const commitQuestionTime = () => {
    if (!currentQ) return;
    const now = Date.now();
    const spent = now - qStartTimeRef.current;
    setQuestionTimeMap((prev) => ({
      ...prev,
      [currentQ.questionId]: (prev[currentQ.questionId] || 0) + spent,
    }));
    qStartTimeRef.current = now;
  };

  const handleSelectOption = (optIndex: number) => {
    if (!currentQ) return;
    Haptics.selectionAsync().catch(() => {});

    setSelectedAnswers((prev) => {
      const existing = prev[currentQ.questionId] || [];
      if (currentQ.type === 2) {
        // Multi-choice
        return {
          ...prev,
          [currentQ.questionId]: existing.includes(optIndex)
            ? existing.filter((i) => i !== optIndex)
            : [...existing, optIndex],
        };
      }
      // Single choice
      return {
        ...prev,
        [currentQ.questionId]: [optIndex],
      };
    });
  };

  const goToNext = () => {
    commitQuestionTime();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleConfirmSubmit();
    }
  };

  const goToPrev = () => {
    commitQuestionTime();
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const jumpToQuestion = (index: number) => {
    commitQuestionTime();
    setCurrentIndex(index);
    setShowPalette(false);
  };

  const handleConfirmSubmit = () => {
    Alert.alert("Submit Practice Test", "Are you sure you want to finish and see your diagnostic score?", [
      { text: "Continue Test", style: "cancel" },
      { text: "Submit Now", style: "default", onPress: handleSubmitTest },
    ]);
  };

  const handleSubmitTest = () => {
    commitQuestionTime();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Build question solutions
    const solutions: InfinitePracticeQuestionSolution[] = questions.map((q, idx) => {
      const selected = selectedAnswers[q.questionId] || [];
      const numInput = numericInputs[q.questionId];
      const markedSolutions: (number | string)[] =
        numInput !== undefined && numInput !== ""
          ? [numInput]
          : selected.map((s) => s + 1);

      return {
        questionId: q.questionId,
        content: q.content,
        plainQuestionText: q.plainQuestionText,
        options: q.options,
        solutions: q.solutions,
        type: q.type,
        difficulty: q.difficulty,
        chapterId: q.chapterId,
        chapterName: q.chapterName,
        subjectId: q.subjectId,
        subjectName: q.subjectName,
        status: markedSolutions.length === 0 ? "SKIPPED" : "INCORRECT", // Evaluated by diagnosePracticeSession
        markedSolutions,
        timeTaken: questionTimeMap[q.questionId] || 0,
        questionNumber: idx + 1,
        numericAnswer: q.numericAnswer,
      };
    });

    const report = diagnosePracticeSession(questions, solutions);

    // Save session mistakes to error vault
    recordSessionMistakes(testId as string, questions, report.diagnoses, solutions);

    (globalThis as any).__LAST_TEST_RESULT__ = {
      testId,
      session,
      questions,
      solutions,
      report,
    };

    router.replace(`/result/${testId}` as any);
  };

  if (!currentQ) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: isDark ? "#fff" : "#000" }}>No questions loaded.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: "#4f46e5", fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const bgStyle = { backgroundColor: isDark ? "#020617" : "#f8fafc" };
  const cardBgStyle = { backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#1e293b" : "#e2e8f0" };
  const textColor = { color: isDark ? "#f8fafc" : "#0f172a" };
  const subtextColor = { color: isDark ? "#94a3b8" : "#64748b" };

  const currentMarked = selectedAnswers[currentQ.questionId] || [];
  const bookmarked = isBookmarked(currentQ.questionId);

  return (
    <SafeAreaView style={[styles.root, bgStyle]}>
      {/* Top Examination Bar */}
      <View style={[styles.navHeader, cardBgStyle]}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert("Exit Test", "Your progress will be discarded. Exit now?", [
              { text: "Stay", style: "cancel" },
              { text: "Exit", style: "destructive", onPress: () => router.back() },
            ]);
          }}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={22} color={isDark ? "#fff" : "#0f172a"} />
        </TouchableOpacity>

        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={16} color="#4f46e5" />
          <Text style={styles.timerText}>{formatTime(elapsedTotal)}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => toggleBookmark(currentQ)}
            style={styles.headerBtn}
          >
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={bookmarked ? "#f59e0b" : isDark ? "#fff" : "#0f172a"}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowPalette(true)} style={styles.headerBtn}>
            <Ionicons name="grid-outline" size={20} color={isDark ? "#fff" : "#0f172a"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress & Chapter Subheader */}
      <View style={styles.subBar}>
        <Text style={[styles.qProgress, textColor]}>
          Q{currentIndex + 1} of {questions.length}
        </Text>
        <Text style={[styles.chapterTag, subtextColor]} numberOfLines={1}>
          {currentQ.chapterName}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question Statement */}
        <View style={[styles.questionCard, cardBgStyle]}>
          <MathView htmlContent={currentQ.content} fontSize={15} />
        </View>

        {/* Options */}
        {currentQ.options && currentQ.options.length > 0 ? (
          <View style={styles.optionsList}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = currentMarked.includes(idx);
              const isQuiz = practiceMode === "QUIZ";
              const showResult = isQuiz && isSelected;

              const selectedStyle = isSelected
                ? isQuiz
                  ? opt.isCorrect
                    ? styles.optionCorrect
                    : styles.optionIncorrect
                  : styles.optionSelected
                : null;

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectOption(idx)}
                  style={[styles.optionCard, cardBgStyle, selectedStyle]}
                >
                  <View style={[styles.optIndexCircle, isSelected && styles.optIndexCircleActive]}>
                    <Text
                      style={[
                        styles.optIndexText,
                        isSelected ? { color: "#fff" } : subtextColor,
                      ]}
                    >
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <MathView htmlContent={opt.text} fontSize={14} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* Numeric Input Question */
          <View style={[styles.numericCard, cardBgStyle]}>
            <Text style={[styles.numericLabel, textColor]}>Enter Numerical Answer:</Text>
            <TextInput
              keyboardType="numeric"
              value={numericInputs[currentQ.questionId] || ""}
              onChangeText={(val) =>
                setNumericInputs((prev) => ({ ...prev, [currentQ.questionId]: val }))
              }
              placeholder="e.g. 42.5"
              placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
              style={[styles.numericInput, textColor]}
            />
          </View>
        )}

        {/* Quiz Mode Solution on Answer */}
        {practiceMode === "QUIZ" && currentMarked.length > 0 && currentQ.solutions?.length > 0 && (
          <View style={[styles.quizSolCard, cardBgStyle]}>
            <Text style={styles.quizSolTitle}>Explanation & Solution</Text>
            {currentQ.solutions.map((sol, sIdx) => (
              <MathView key={sIdx} htmlContent={sol.content} fontSize={13} />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomBar, cardBgStyle]}>
        <TouchableOpacity
          onPress={goToPrev}
          disabled={currentIndex === 0}
          style={[styles.navBtn, currentIndex === 0 && { opacity: 0.3 }]}
        >
          <Ionicons name="chevron-back" size={20} color={textColor.color} />
          <Text style={[styles.navBtnText, textColor]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleConfirmSubmit} style={styles.submitMidBtn}>
          <Text style={styles.submitMidText}>Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNext} style={[styles.navBtn, styles.nextBtn]}>
          <Text style={styles.nextBtnText}>
            {currentIndex === questions.length - 1 ? "Finish" : "Next"}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Question Palette Modal */}
      {showPalette && (
        <View style={[styles.paletteModal, bgStyle]}>
          <View style={[styles.paletteHeader, cardBgStyle]}>
            <Text style={[styles.paletteTitle, textColor]}>Question Palette</Text>
            <TouchableOpacity onPress={() => setShowPalette(false)}>
              <Ionicons name="close" size={24} color={textColor.color} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.paletteGrid}>
            {questions.map((q, idx) => {
              const isAnswered = (selectedAnswers[q.questionId] || []).length > 0 || Boolean(numericInputs[q.questionId]);
              const isCurrent = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={q.questionId}
                  onPress={() => jumpToQuestion(idx)}
                  style={[
                    styles.paletteChip,
                    cardBgStyle,
                    isAnswered && styles.paletteChipAnswered,
                    isCurrent && styles.paletteChipCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.paletteChipText,
                      isAnswered || isCurrent ? { color: "#fff" } : textColor,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 4 },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4f46e515",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: { fontSize: 14, fontWeight: "800", color: "#4f46e5" },
  subBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  qProgress: { fontSize: 13, fontWeight: "800" },
  chapterTag: { fontSize: 12, maxWidth: "60%" },
  scrollContent: { padding: 16 },
  questionCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  optionsList: { gap: 10 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#4f46e512",
  },
  optionCorrect: {
    borderColor: "#10b981",
    backgroundColor: "#10b98115",
  },
  optionIncorrect: {
    borderColor: "#ef4444",
    backgroundColor: "#ef444415",
  },
  optIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#94a3b850",
    alignItems: "center",
    justifyContent: "center",
  },
  optIndexCircleActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  optIndexText: { fontSize: 12, fontWeight: "800" },
  numericCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  numericLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  numericInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  quizSolCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  quizSolTitle: { fontSize: 13, fontWeight: "800", color: "#4f46e5", marginBottom: 6 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navBtnText: { fontSize: 14, fontWeight: "700" },
  nextBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  nextBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  submitMidBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  submitMidText: { color: "#ef4444", fontSize: 13, fontWeight: "800" },
  paletteModal: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  paletteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  paletteTitle: { fontSize: 16, fontWeight: "800" },
  paletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 16,
  },
  paletteChip: {
    width: 45,
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paletteChipAnswered: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  paletteChipCurrent: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  paletteChipText: { fontSize: 14, fontWeight: "800" },
});
