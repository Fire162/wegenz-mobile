import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMistakesStore } from "../../src/hooks/useMistakesStore";
import { MathView } from "../../src/components/MathView";
import { MistakeEntry } from "../../src/types";

export default function ErrorVaultScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState<"JOURNAL" | "RADAR">("JOURNAL");
  const [filter, setFilter] = useState<"ACTIVE" | "ALL" | "MASTERED">("ACTIVE");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [expandedSolutionId, setExpandedSolutionId] = useState<string | null>(null);

  const {
    mistakes,
    toggleMastered,
    updatePersonalNote,
    removeMistake,
    getChapterMasterySummary,
  } = useMistakesStore();

  const chapterSummary = getChapterMasterySummary();

  const filteredMistakes = mistakes.filter((m) => {
    if (filter === "ACTIVE") return !m.mastered;
    if (filter === "MASTERED") return m.mastered;
    return true;
  });

  const handleStartChapterDrill = (chapterId: string, chapterName: string) => {
    const chapterMistakes = mistakes
      .filter((m) => (m.chapterId === chapterId || m.chapterName === chapterName) && !m.mastered)
      .map((m) => m.question);

    if (chapterMistakes.length === 0) {
      Alert.alert("All Mastered", "You have mastered all mistakes in this chapter!");
      return;
    }

    const testId = `drill-${Date.now()}`;
    (globalThis as any).__ACTIVE_TEST_SESSION__ = {
      testId,
      questions: chapterMistakes,
      practiceMode: "QUIZ",
      timeLimitSeconds: 0,
      trackName: "Mistake Drill",
    };

    router.push(`/room/${testId}` as any);
  };

  const bgStyle = { backgroundColor: isDark ? "#020617" : "#f8fafc" };
  const cardBgStyle = { backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#1e293b" : "#e2e8f0" };
  const textColor = { color: isDark ? "#f8fafc" : "#0f172a" };
  const subtextColor = { color: isDark ? "#94a3b8" : "#64748b" };

  return (
    <View style={[styles.root, bgStyle]}>
      {/* Top View Mode Switcher */}
      <View style={[styles.tabBar, cardBgStyle]}>
        <TouchableOpacity
          onPress={() => setActiveTab("JOURNAL")}
          style={[styles.tabBtn, activeTab === "JOURNAL" && styles.tabBtnActive]}
        >
          <Ionicons
            name="book-outline"
            size={16}
            color={activeTab === "JOURNAL" ? "#4f46e5" : isDark ? "#94a3b8" : "#64748b"}
          />
          <Text style={[styles.tabText, activeTab === "JOURNAL" ? styles.tabTextActive : textColor]}>
            Journal ({mistakes.filter((m) => !m.mastered).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("RADAR")}
          style={[styles.tabBtn, activeTab === "RADAR" && styles.tabBtnActive]}
        >
          <Ionicons
            name="pie-chart-outline"
            size={16}
            color={activeTab === "RADAR" ? "#4f46e5" : isDark ? "#94a3b8" : "#64748b"}
          />
          <Text style={[styles.tabText, activeTab === "RADAR" ? styles.tabTextActive : textColor]}>
            Mastery Radar ({chapterSummary.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "JOURNAL" ? (
          <>
            {/* Filter pills */}
            <View style={styles.filterRow}>
              {(["ACTIVE", "ALL", "MASTERED"] as const).map((f) => {
                const isSelected = filter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[
                      styles.filterPill,
                      cardBgStyle,
                      isSelected && styles.filterPillActive,
                    ]}
                  >
                    <Text style={[styles.filterText, isSelected ? { color: "#fff" } : textColor]}>
                      {f === "ACTIVE"
                        ? `Active (${mistakes.filter((m) => !m.mastered).length})`
                        : f === "MASTERED"
                        ? `Mastered (${mistakes.filter((m) => m.mastered).length})`
                        : `All (${mistakes.length})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredMistakes.length === 0 ? (
              <View style={[styles.emptyCard, cardBgStyle]}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                <Text style={[styles.emptyTitle, textColor]}>Mistake Notebook is Clean!</Text>
                <Text style={[styles.emptySubtitle, subtextColor]}>
                  Whenever you miss a question during practice, it will automatically appear here with diagnostic insights and notes.
                </Text>
              </View>
            ) : (
              filteredMistakes.map((m: MistakeEntry, idx: number) => {
                const isEditingNote = editingNoteId === m.questionId;
                const isSolutionOpen = expandedSolutionId === m.questionId;

                return (
                  <View key={m.questionId} style={[styles.mistakeCard, cardBgStyle]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.tagGroup}>
                        <Text style={styles.badgeChapter}>{m.chapterName}</Text>
                        <Text style={styles.badgeType}>{m.mistakeTitle}</Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleMastered(m.questionId)}>
                        <Ionicons
                          name={m.mastered ? "checkmark-circle" : "ellipse-outline"}
                          size={24}
                          color={m.mastered ? "#10b981" : isDark ? "#64748b" : "#94a3b8"}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Question Content */}
                    <View style={styles.mathContainer}>
                      <MathView htmlContent={m.question.content} fontSize={14} />
                    </View>

                    {/* Diagnostic Advice */}
                    <View style={styles.adviceBox}>
                      <Ionicons name="information-circle-outline" size={16} color="#d97706" />
                      <Text style={styles.adviceText}>{m.mistakeAdvice}</Text>
                    </View>

                    {/* Personal Takeaway Note */}
                    <View style={styles.noteSection}>
                      <View style={styles.noteHeader}>
                        <Text style={[styles.noteTitle, textColor]}>My Takeaway Note</Text>
                        {!isEditingNote && (
                          <TouchableOpacity
                            onPress={() => {
                              setEditingNoteId(m.questionId);
                              setNoteDraft(m.personalNote || "");
                            }}
                          >
                            <Text style={styles.noteActionText}>
                              {m.personalNote ? "Edit" : "+ Add Note"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {isEditingNote ? (
                        <View style={styles.noteEditBox}>
                          <TextInput
                            value={noteDraft}
                            onChangeText={setNoteDraft}
                            placeholder="Type formula, concept or reason to remember..."
                            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                            style={[styles.noteInput, textColor]}
                            multiline
                          />
                          <View style={styles.noteBtnRow}>
                            <TouchableOpacity
                              onPress={() => {
                                updatePersonalNote(m.questionId, noteDraft.trim());
                                setEditingNoteId(null);
                              }}
                              style={styles.saveNoteBtn}
                            >
                              <Text style={styles.saveNoteBtnText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setEditingNoteId(null)}
                              style={styles.cancelNoteBtn}
                            >
                              <Text style={subtextColor}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <Text style={[styles.noteText, m.personalNote ? textColor : subtextColor]}>
                          {m.personalNote || "No takeaway note recorded yet."}
                        </Text>
                      )}
                    </View>

                    {/* Solution Accordion */}
                    <TouchableOpacity
                      onPress={() => setExpandedSolutionId(isSolutionOpen ? null : m.questionId)}
                      style={styles.solHeader}
                    >
                      <Text style={styles.solHeaderText}>
                        {isSolutionOpen ? "Hide Solution" : "View Step-by-Step Solution"}
                      </Text>
                      <Ionicons
                        name={isSolutionOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#4f46e5"
                      />
                    </TouchableOpacity>

                    {isSolutionOpen && (
                      <View style={styles.solBody}>
                        {m.question.solutions && m.question.solutions.length > 0 ? (
                          m.question.solutions.map((sol, sIdx) => (
                            <MathView key={sIdx} htmlContent={sol.content} fontSize={13} />
                          ))
                        ) : (
                          <Text style={subtextColor}>No detailed solution provided.</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        ) : (
          /* Chapter Mastery Radar View */
          <View style={styles.radarContainer}>
            <Text style={[styles.radarHeading, textColor]}>Chapter Error Breakdown</Text>
            {chapterSummary.length === 0 ? (
              <View style={[styles.emptyCard, cardBgStyle]}>
                <Ionicons name="bar-chart-outline" size={48} color="#4f46e5" />
                <Text style={[styles.emptyTitle, textColor]}>No Chapter Data Yet</Text>
                <Text style={[styles.emptySubtitle, subtextColor]}>
                  Complete practice tests to build your cumulative weakness radar.
                </Text>
              </View>
            ) : (
              chapterSummary.map((ch) => (
                <View key={ch.chapterId || ch.chapterName} style={[styles.radarCard, cardBgStyle]}>
                  <View style={styles.radarCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.radarChapterName, textColor]}>{ch.chapterName}</Text>
                      <Text style={[styles.radarMeta, subtextColor]}>
                        {ch.totalMistakes} errors • {ch.activeMistakes} active • {ch.masteredCount} mastered
                      </Text>
                    </View>
                    <Text style={styles.radarPercentage}>{ch.masteryPercentage}%</Text>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${ch.masteryPercentage}%`,
                          backgroundColor: ch.masteryPercentage > 70 ? "#10b981" : "#4f46e5",
                        },
                      ]}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => handleStartChapterDrill(ch.chapterId, ch.chapterName)}
                    style={styles.drillBtn}
                  >
                    <Ionicons name="flash" size={14} color="#fff" />
                    <Text style={styles.drillBtnText}>Drill Chapter ({ch.activeMistakes} Qs)</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#4f46e512",
  },
  tabText: { fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: "#4f46e5" },
  scrollContent: { padding: 16 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  filterText: { fontSize: 12, fontWeight: "700" },
  mistakeCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tagGroup: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  badgeChapter: {
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeType: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mathContainer: { marginBottom: 10 },
  adviceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fffbeb",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  adviceText: { fontSize: 12, color: "#b45309", flex: 1, fontWeight: "500" },
  noteSection: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f030",
    paddingTop: 10,
    marginBottom: 10,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  noteTitle: { fontSize: 12, fontWeight: "800" },
  noteActionText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  noteText: { fontSize: 13, fontStyle: "italic" },
  noteEditBox: { marginTop: 6 },
  noteInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    minHeight: 50,
  },
  noteBtnRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  saveNoteBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveNoteBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  cancelNoteBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  solHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  solHeaderText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  solBody: { marginTop: 8 },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 12 },
  emptySubtitle: { fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 18 },
  radarContainer: { gap: 12 },
  radarHeading: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  radarCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  radarCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  radarChapterName: { fontSize: 14, fontWeight: "800" },
  radarMeta: { fontSize: 12, marginTop: 2 },
  radarPercentage: { fontSize: 16, fontWeight: "900", color: "#4f46e5" },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#e2e8f050",
    borderRadius: 3,
    marginVertical: 10,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  drillBtn: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  drillBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
