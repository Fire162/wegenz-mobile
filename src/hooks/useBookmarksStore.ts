import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InfinitePracticeQuestion } from "../types";

const STORAGE_KEY = "wegenz_bookmarks_v1";

interface BookmarksState {
  bookmarks: InfinitePracticeQuestion[];
  isLoading: boolean;
  loadBookmarks: () => Promise<void>;
  toggleBookmark: (question: InfinitePracticeQuestion) => Promise<void>;
  isBookmarked: (questionId: string) => boolean;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  isLoading: true,

  loadBookmarks: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ bookmarks: JSON.parse(stored), isLoading: false });
      } else {
        set({ bookmarks: [], isLoading: false });
      }
    } catch {
      set({ bookmarks: [], isLoading: false });
    }
  },

  toggleBookmark: async (question) => {
    const list = get().bookmarks;
    const exists = list.some((b) => b.questionId === question.questionId);
    const next = exists
      ? list.filter((b) => b.questionId !== question.questionId)
      : [question, ...list];

    set({ bookmarks: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  isBookmarked: (questionId) => {
    return get().bookmarks.some((b) => b.questionId === questionId);
  },
}));
