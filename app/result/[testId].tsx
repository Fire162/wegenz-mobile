import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MathView } from "../../src/components/MathView";
import { fetchPracticeQuestions } from "../../src/api/client";
import {
  InfinitePracticeQuestion,
  InfinitePracticeQuestionSolution,
  PracticeDiagnosticReport,
} from "../../src/types";

export default function TestResultScreen() {
  const router = useRouter();
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const resultData = (globalThis as any).__LAST_TEST_RESULT__ || null;
  const questions: InfinitePracticeQuestion[] = resultData?.questions || [];
  const solutions: InfinitePracticeQuestionSolution[] = resultData?.solutions || [];
  const report: PracticeDiagnosticReport | null = resultData?.report || null;

  const [filterTab, setFilterTab] = useState<"ALL" | "INCORRECT" | "CORRECT" | "SKIPPED">("ALL");
  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [isLoadingFreshDrill, setIsLoadingFreshDrill] = useState(false);

  const totalQuestions = questions.length || 1;
  const correctCount = report?.diagnoses.filter((d) => d.status === "CORRECT").length || 0;
  const incorrectCount = report?.diagnoses.filter((d) => d.status === "INCORRECT").length || 0;
  const skippedCount = report?.diagnoses.filter((d) => d.status === "SKIPPED").length || 0;
  const score = report?.totalScore ?? correctCount * 4 - incorrectCount * 1;
  const accuracy = report?.overallAccuracy ?? Math.round((correctCount / totalQuestions) * 100);

  const handleRetryMissed = () => {
    const missed = questions.filter((q) => {
      const diag = report?.diagnoses.find((d) => d.questionId === q.questionId);
      return diag?.status === "INCORRECT";
    });

    if (missed.length === 0) {
      Alert.alert("No Mistakes", "You scored 100% or had no incorrect answers in this test!");
      return;
    }

    const nextTestId = `missed-${Date.now()}`;
    (globalThis as any).__ACTIVE_TEST_SESSION__ = {
      testId: nextTestId,
      questions: missed,
      practiceMode: "QUIZ",
      timeLimitSeconds: 0,
      trackName: "Mistake Remediation",
    };

    router.replace(`/room/${nextTestId}` as any);
  };

  const handlePrescribeFreshDrill = async () => {
    if (!report?.weakestChapters || report.weakestChapters.length === 0) {
      Alert.alert("High Accuracy", "You have no weak chapters in this test session!");
      return;
    }

    setIsLoadingFreshDrill(true);
    try {
      const weakChapterNames = report.weakestChapters.map((c) => c.chapterName);
      const weakSubjectNames = Array.from(new Set(report.weakestChapters.map((c) => c.subjectName)));

      const freshQuestions = await fetchPracticeQuestions({
        batchId: resultData?.session?.trackName || "11th_JEE",
        count: Math.min(10, weakChapterNames.length * 4),
        subjectNames: weakSubjectNames,
        chapterNames: weakChapterNames,
      });

      if (!freshQuestions || freshQuestions.length === 0) {
        Alert.alert("Info", "Could not fetch fresh questions from origin. Try drilling missed questions.");
        return;
      }

      const nextTestId = `fresh-drill-${Date.now()}`;
      (globalThis as any).__ACTIVE_TEST_SESSION__ = {
        testId: nextTestId,
        questions: freshQuestions,
        practiceMode: "QUIZ",
        timeLimitSeconds: 0,
        trackName: "Prescribed Weakness Drill",
      };

      router.replace(`/room/${nextTestId}` as any);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load fresh weakness drill.");
    } finally {
      setIsLoadingFreshDrill(false);
    }
  };

  const bgStyle = { backgroundColor: isDark ? "#020617" : "#f8fafc" };
  const cardBgStyle = { backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#1e293b" : "#e2e8f0" };
  const textColor = { color: isDark ? "#f8fafc" : "#0f172a" };
  const subtextColor = { color: isDark ? "#94a3b8" : "#64748b" };

  const filteredSolutions = solutions.filter((sol) => {
    const diag = report?.diagnoses.find((d) => d.questionId === sol.questionId);
    const status = diag?.status || sol.status;
    if (filterTab === "CORRECT") return status === "CORRECT";
    if (filterTab === "INCORRECT") return status === "INCORRECT";
    if (filterTab === "SKIPPED") return status === "SKIPPED";
    return true;
  });

  return (
    <SafeAreaView style={[styles.root, bgStyle]}>
      {/* Top Header */}
      <View style={[styles.header, cardBgStyle]}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.headerBtn}>
          <Ionicons name="home-outline" size={20} color={textColor.color} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, textColor]}>Test Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Card Hero */}
        <View style={[styles.heroCard, cardBgStyle]}>
          <Text style={styles.heroBadge}>
            {accuracy >= 80 ? "🏆 Outstanding" : accuracy >= 50 ? "⚡ Good Effort" : "🎯 Needs Practice"}
          </Text>
          <Text style={[styles.heroScore, textColor]}>{score > 0 ? `+${score}` : score}</Text>
          <Text style={[styles.heroSub, subtextColor]}>Net Examination Score</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: "#10b981" }]}>{correctCount}</Text>
              <Text style={[styles.metricLabel, subtextColor]}>Correct</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: "#ef4444" }]}>{incorrectCount}</Text>
              <Text style={[styles.metricLabel, subtextColor]}>Incorrect</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: "#f59e0b" }]}>{skippedCount}</Text>
              <Text style={[styles.metricLabel, subtextColor]}>Skipped</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: "#4f46e5" }]}>{accuracy}%</Text>
              <Text style={[styles.metricLabel, subtextColor]}>Accuracy</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {incorrectCount > 0 && (
            <TouchableOpacity onPress={handleRetryMissed} style={styles.actionBtnMissed}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Drill Missed Only ({incorrectCount} Qs)</Text>
            </TouchableOpacity>
          )}

          {report?.weakestChapters && report.weakestChapters.length > 0 && (
            <TouchableOpacity
              onPress={handlePrescribeFreshDrill}
              disabled={isLoadingFreshDrill}
              style={styles.actionBtnFresh}
            >
              {isLoadingFreshDrill ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Auto-Prescribe Fresh Drill</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Intelligent Diagnostic Report Card */}
        {report && (
          <View style={[styles.diagCard, cardBgStyle]}>
            <View style={styles.diagHeader}>
              <Ionicons name="pulse" size={20} color="#4f46e5" />
              <Text style={[styles.diagTitle, textColor]}>Mistake & Weakness Diagnostic</Text>
            </View>

            {/* Error Breakdown Pills */}
            <View style={styles.pillsWrap}>
              {Object.entries(report.mistakeBreakdown).map(([mType, count]) => {
                if (count === 0) return null;
                const labels: Record<string, string> = {
                  RUSHED_GUESS: "Rushed Guess (<25s)",
                  TIME_SINK: "Time Sink (>150s)",
                  CALCULATION_ERROR: "Calculation Slip",
                  CONCEPTUAL_TRAP: "Conceptual Trap",
                  FATIGUE_SLIP: "Late-Test Fatigue",
                };
                return (
                  <View key={mType} style={styles.mPill}>
                    <Text style={styles.mPillText}>
                      {labels[mType] || mType}: {count}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Time Economy */}
            <View style={styles.economyBox}>
              <Text style={[styles.economyTitle, textColor]}>Exam Time Economy</Text>
              <Text style={subtextColor}>
                Productive: {Math.round(report.timeEconomy.productiveTimeMs / 1000)}s • Lost on errors: {Math.round(report.timeEconomy.lostTimeMs / 1000)}s ({report.timeEconomy.lostTimePercentage}%)
              </Text>
            </View>

            {/* Prescriptions */}
            {report.prescription.map((tip, idx) => (
              <View key={idx} style={styles.tipItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
                <Text style={[styles.tipText, textColor]}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Detailed Solutions Section */}
        <Text style={[styles.sectionHeading, textColor]}>Step-by-Step Question Review</Text>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(["ALL", "INCORRECT", "CORRECT", "SKIPPED"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilterTab(tab)}
              style={[
                styles.solFilterPill,
                cardBgStyle,
                filterTab === tab && styles.solFilterPillActive,
              ]}
            >
              <Text style={[styles.solFilterText, filterTab === tab ? { color: "#fff" } : textColor]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredSolutions.map((sol, idx) => {
          const diag = report?.diagnoses.find((d) => d.questionId === sol.questionId);
          const status = diag?.status || sol.status;
          const isExpanded = expandedQId === sol.questionId;

          const statusColor =
            status === "CORRECT" ? "#10b981" : status === "INCORRECT" ? "#ef4444" : "#f59e0b";

          return (
            <View key={sol.questionId} style={[styles.solCard, cardBgStyle]}>
              <View style={styles.solTopRow}>
                <Text style={[styles.qNumBadge, { color: statusColor }]}>
                  Q{sol.questionNumber || idx + 1} • {status}
                </Text>
                <Text style={[styles.qChapter, subtextColor]}>{sol.chapterName}</Text>
              </View>

              <MathView htmlContent={sol.content} fontSize={14} />

              {/* Solution accordion */}
              <TouchableOpacity
                onPress={() => setExpandedQId(isExpanded ? null : sol.questionId)}
                style={styles.expandBtn}
              >
                <Text style={styles.expandBtnText}>
                  {isExpanded ? "Hide Solution" : "View Full KaTeX Solution"}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#4f46e5"
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.solContentBox}>
                  {sol.solutions && sol.solutions.length > 0 ? (
                    sol.solutions.map((s, sIdx) => (
                      <MathView key={sIdx} htmlContent={s.content} fontSize={13} />
                    ))
                  ) : (
                    <Text style={subtextColor}>No step-by-step solution available.</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  scrollContent: { padding: 16 },
  heroCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 14,
  },
  heroBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4f46e5",
    backgroundColor: "#4f46e515",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  heroScore: { fontSize: 44, fontWeight: "900" },
  heroSub: { fontSize: 12, marginTop: 2 },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f030",
    paddingTop: 14,
  },
  metricItem: { alignItems: "center" },
  metricVal: { fontSize: 18, fontWeight: "800" },
  metricLabel: { fontSize: 11, marginTop: 2 },
  actionRow: { gap: 10, marginBottom: 16 },
  actionBtnMissed: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnFresh: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  diagCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  diagHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  diagTitle: { fontSize: 15, fontWeight: "800" },
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  mPill: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mPillText: { color: "#991b1b", fontSize: 12, fontWeight: "700" },
  economyBox: {
    backgroundColor: "#4f46e50c",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  economyTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  tipItem: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  tipText: { fontSize: 12, flex: 1, fontWeight: "500" },
  sectionHeading: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  solFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  solFilterPillActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  solFilterText: { fontSize: 12, fontWeight: "700" },
  solCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  solTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  qNumBadge: { fontSize: 13, fontWeight: "800" },
  qChapter: { fontSize: 11, maxWidth: "60%" },
  expandBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f030",
  },
  expandBtnText: { color: "#4f46e5", fontSize: 12, fontWeight: "700" },
  solContentBox: { marginTop: 8 },
});
