import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookmarksStore } from "../../src/hooks/useBookmarksStore";
import { MathView } from "../../src/components/MathView";
import { InfinitePracticeQuestion } from "../../src/types";

export default function BookmarksScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { bookmarks, toggleBookmark } = useBookmarksStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStartBookmarksDrill = () => {
    if (bookmarks.length === 0) {
      Alert.alert("No Bookmarks", "Save questions to start a bookmark practice drill.");
      return;
    }

    const testId = `bookmarks-${Date.now()}`;
    (globalThis as any).__ACTIVE_TEST_SESSION__ = {
      testId,
      questions: bookmarks,
      practiceMode: "EXAM",
      timeLimitSeconds: 0,
      trackName: "Saved Bookmarks",
    };

    router.push(`/room/${testId}` as any);
  };

  const bgStyle = { backgroundColor: isDark ? "#020617" : "#f8fafc" };
  const cardBgStyle = { backgroundColor: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#1e293b" : "#e2e8f0" };
  const textColor = { color: isDark ? "#f8fafc" : "#0f172a" };
  const subtextColor = { color: isDark ? "#94a3b8" : "#64748b" };

  return (
    <View style={[styles.root, bgStyle]}>
      {bookmarks.length > 0 && (
        <View style={[styles.topBar, cardBgStyle]}>
          <TouchableOpacity onPress={handleStartBookmarksDrill} style={styles.startBtn}>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.startBtnText}>
              Practise Saved Questions ({bookmarks.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {bookmarks.length === 0 ? (
          <View style={[styles.emptyCard, cardBgStyle]}>
            <Ionicons name="bookmark-outline" size={48} color="#f59e0b" />
            <Text style={[styles.emptyTitle, textColor]}>No Bookmarks Saved</Text>
            <Text style={[styles.emptySubtitle, subtextColor]}>
              Tap the bookmark icon on any question during your practice tests to review it here.
            </Text>
          </View>
        ) : (
          bookmarks.map((q: InfinitePracticeQuestion, idx: number) => {
            const isExpanded = expandedId === q.questionId;
            return (
              <View key={q.questionId} style={[styles.card, cardBgStyle]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.badgeChapter}>
                    {q.chapterName || "General Chapter"}
                  </Text>
                  <TouchableOpacity onPress={() => toggleBookmark(q)}>
                    <Ionicons name="bookmark" size={22} color="#f59e0b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.mathBox}>
                  <MathView htmlContent={q.content} fontSize={14} />
                </View>

                {/* Toggle Solution */}
                <TouchableOpacity
                  onPress={() => setExpandedId(isExpanded ? null : q.questionId)}
                  style={styles.solutionHeader}
                >
                  <Text style={styles.solutionHeaderText}>
                    {isExpanded ? "Hide Solution" : "View KaTeX Solution"}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#4f46e5"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.solutionBody}>
                    {q.solutions && q.solutions.length > 0 ? (
                      q.solutions.map((sol, sIdx) => (
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    padding: 12,
    borderBottomWidth: 1,
  },
  startBtn: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  startBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  scrollContent: { padding: 16 },
  card: {
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
  badgeChapter: {
    backgroundColor: "#fef3c7",
    color: "#b45309",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mathBox: { marginBottom: 10 },
  solutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  solutionHeaderText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  solutionBody: { marginTop: 8 },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 12 },
  emptySubtitle: { fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 18 },
});
