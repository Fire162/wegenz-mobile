import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { TRACK_BATCHES, InfinitePracticeChapter } from "../../src/types";
import { fetchSubjects, fetchChapters, fetchPracticeQuestions } from "../../src/api/client";

export default function PracticeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Selected state
  const [selectedTrack, setSelectedTrack] = useState<string>("11th_JEE");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedChapterNames, setSelectedChapterNames] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [practiceMode, setPracticeMode] = useState<"EXAM" | "QUIZ">("EXAM");
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Queries
  const subjectsQuery = useQuery({
    queryKey: ["subjects", selectedTrack],
    queryFn: () => fetchSubjects(selectedTrack),
  });

  const subjects = subjectsQuery.data || [];

  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.some((s) => s.subjectId === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].subjectId);
    }
  }, [subjects, selectedSubjectId]);

  const chaptersQuery = useQuery({
    queryKey: ["chapters", selectedTrack, selectedSubjectId],
    queryFn: () => (selectedSubjectId ? fetchChapters(selectedTrack, selectedSubjectId) : Promise.resolve([])),
    enabled: Boolean(selectedSubjectId),
  });

  const chapters: InfinitePracticeChapter[] = chaptersQuery.data || [];

  const toggleChapter = (name: string) => {
    setSelectedChapterNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const selectAllChapters = () => {
    setSelectedChapterNames(chapters.map((c) => c.englishName));
  };

  const clearChapters = () => {
    setSelectedChapterNames([]);
  };

  const handleStartPractice = async () => {
    if (isStarting) return;
    if (selectedChapterNames.length === 0) {
      Alert.alert("Select Chapters", "Please select at least one chapter to begin practice.");
      return;
    }

    setIsStarting(true);
    try {
      const activeSubject = subjects.find((s) => s.subjectId === selectedSubjectId);
      const questions = await fetchPracticeQuestions({
        batchId: selectedTrack,
        count: questionCount,
        subjectNames: activeSubject ? [activeSubject.subjectName] : [],
        chapterNames: selectedChapterNames,
      });

      if (!questions || questions.length === 0) {
        Alert.alert("No Questions", "No questions found for the chosen selection. Try other chapters.");
        return;
      }

      const testId = `test-${Date.now()}`;
      // Global memory store pass-through via navigation params or local store
      (globalThis as any).__ACTIVE_TEST_SESSION__ = {
        testId,
        questions,
        practiceMode,
        timeLimitSeconds: timerSeconds,
        trackName: selectedTrack,
      };

      router.push(`/room/${testId}` as any);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load practice questions.");
    } finally {
      setIsStarting(false);
    }
  };

  const bgStyle = { backgroundColor: isDark ? "#020617" : "#f8fafc" };
  const cardBgStyle = { backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#1e293b" : "#e2e8f0" };
  const textColor = { color: isDark ? "#f8fafc" : "#0f172a" };
  const subtextColor = { color: isDark ? "#94a3b8" : "#64748b" };

  return (
    <View style={[styles.root, bgStyle]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Track Selector */}
        <Text style={[styles.sectionTitle, textColor]}>Exam Track</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {TRACK_BATCHES.map((b) => {
            const isSelected = selectedTrack === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                onPress={() => setSelectedTrack(b.id)}
                style={[
                  styles.trackPill,
                  isSelected
                    ? styles.trackPillSelected
                    : { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: isDark ? "#334155" : "#e2e8f0" },
                ]}
              >
                <Text style={[styles.trackPillText, isSelected ? styles.trackPillTextSelected : textColor]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Subject Selector */}
        <Text style={[styles.sectionTitle, textColor, { marginTop: 18 }]}>Subject</Text>
        {subjectsQuery.isLoading ? (
          <ActivityIndicator size="small" color="#4f46e5" style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.subjectsRow}>
            {subjects.map((s) => {
              const isSelected = selectedSubjectId === s.subjectId;
              return (
                <TouchableOpacity
                  key={s.subjectId}
                  onPress={() => setSelectedSubjectId(s.subjectId)}
                  style={[
                    styles.subjectCard,
                    cardBgStyle,
                    isSelected && styles.subjectCardSelected,
                  ]}
                >
                  <Text style={[styles.subjectName, isSelected ? styles.textIndigo : textColor]}>
                    {s.subjectName}
                  </Text>
                  <Text style={[styles.subjectCount, subtextColor]}>
                    {s.chapterCount} Chs • {s.questionCount} Qs
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Chapters Section */}
        <View style={styles.chapterHeader}>
          <Text style={[styles.sectionTitle, textColor, { marginBottom: 0 }]}>
            Pick Chapters ({selectedChapterNames.length}/{chapters.length})
          </Text>
          <View style={styles.chapterActions}>
            <TouchableOpacity onPress={selectAllChapters} style={styles.miniBtn}>
              <Text style={styles.miniBtnText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearChapters} style={styles.miniBtn}>
              <Text style={[styles.miniBtnText, { color: "#ef4444" }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {chaptersQuery.isLoading ? (
          <ActivityIndicator size="small" color="#4f46e5" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.chaptersGrid}>
            {chapters.map((ch) => {
              const selected = selectedChapterNames.includes(ch.englishName);
              return (
                <TouchableOpacity
                  key={ch.chapterId}
                  onPress={() => toggleChapter(ch.englishName)}
                  style={[
                    styles.chapterItem,
                    cardBgStyle,
                    selected && styles.chapterItemSelected,
                  ]}
                >
                  <Ionicons
                    name={selected ? "checkbox" : "square-outline"}
                    size={20}
                    color={selected ? "#4f46e5" : isDark ? "#64748b" : "#cbd5e1"}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.chapterName, textColor]} numberOfLines={2}>
                      {ch.englishName}
                    </Text>
                    <Text style={[styles.chapterCount, subtextColor]}>
                      {ch.questionCount} questions
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Practice Mode Options */}
        <Text style={[styles.sectionTitle, textColor, { marginTop: 22 }]}>Mode & Timer</Text>
        <View style={styles.modesRow}>
          <TouchableOpacity
            onPress={() => setPracticeMode("EXAM")}
            style={[styles.modeCard, cardBgStyle, practiceMode === "EXAM" && styles.modeCardSelected]}
          >
            <Ionicons name="timer-outline" size={20} color={practiceMode === "EXAM" ? "#4f46e5" : "#64748b"} />
            <Text style={[styles.modeTitle, textColor]}>Exam Mode</Text>
            <Text style={[styles.modeDesc, subtextColor]}>Solutions at end</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPracticeMode("QUIZ")}
            style={[styles.modeCard, cardBgStyle, practiceMode === "QUIZ" && styles.modeCardSelected]}
          >
            <Ionicons name="flash-outline" size={20} color={practiceMode === "QUIZ" ? "#4f46e5" : "#64748b"} />
            <Text style={[styles.modeTitle, textColor]}>Quiz Mode</Text>
            <Text style={[styles.modeDesc, subtextColor]}>Instant feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Question Count Presets */}
        <Text style={[styles.sectionTitle, textColor, { marginTop: 18 }]}>Questions ({questionCount})</Text>
        <View style={styles.presetsRow}>
          {[5, 10, 15, 20, 25, 30].map((num) => {
            const isSelected = questionCount === num;
            return (
              <TouchableOpacity
                key={num}
                onPress={() => setQuestionCount(num)}
                style={[styles.presetBtn, isSelected ? styles.presetBtnSelected : cardBgStyle]}
              >
                <Text style={[styles.presetText, isSelected ? { color: "#fff" } : textColor]}>
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Start CTA */}
      <View style={[styles.bottomBar, cardBgStyle]}>
        <TouchableOpacity
          onPress={handleStartPractice}
          disabled={isStarting || selectedChapterNames.length === 0}
          style={[
            styles.startBtn,
            (selectedChapterNames.length === 0 || isStarting) && styles.startBtnDisabled,
          ]}
        >
          {isStarting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.startBtnText}>
                Start Practice ({questionCount} Qs)
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  horizontalScroll: { marginBottom: 4 },
  trackPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  trackPillSelected: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  trackPillText: { fontSize: 13, fontWeight: "700" },
  trackPillTextSelected: { color: "#ffffff" },
  subjectsRow: { flexDirection: "row", gap: 10 },
  subjectCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  subjectCardSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#4f46e510",
  },
  subjectName: { fontSize: 14, fontWeight: "800" },
  subjectCount: { fontSize: 11, marginTop: 4 },
  textIndigo: { color: "#4f46e5" },
  chapterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  chapterActions: { flexDirection: "row", gap: 12 },
  miniBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  miniBtnText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  chaptersGrid: { gap: 8 },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  chapterItemSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#4f46e50c",
  },
  chapterName: { fontSize: 13, fontWeight: "700" },
  chapterCount: { fontSize: 11, marginTop: 2 },
  modesRow: { flexDirection: "row", gap: 10 },
  modeCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  modeCardSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#4f46e510",
  },
  modeTitle: { fontSize: 14, fontWeight: "800", marginTop: 6 },
  modeDesc: { fontSize: 11, marginTop: 2 },
  presetsRow: { flexDirection: "row", justifyContent: "space-between" },
  presetBtn: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  presetBtnSelected: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  presetText: { fontSize: 13, fontWeight: "800" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    borderTopWidth: 1,
  },
  startBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});
