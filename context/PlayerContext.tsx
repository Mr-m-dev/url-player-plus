import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type MediaType = "video" | "audio" | "image" | "pdf" | "text" | "unknown";

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  userAgent?: string;
  type: MediaType;
  addedAt: number;
  lastPlayedAt?: number;
  isFavorite?: boolean;
  thumbnail?: string;
}

interface PlayerContextType {
  history: MediaItem[];
  favorites: MediaItem[];
  currentItem: MediaItem | null;
  addToHistory: (item: Omit<MediaItem, "id" | "addedAt" | "type">) => MediaItem;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  toggleFavorite: (id: string) => void;
  setCurrentItem: (item: MediaItem | null) => void;
  detectMediaType: (url: string) => MediaType;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

const HISTORY_KEY = "@url_player_history";
const FAVORITES_KEY = "@url_player_favorites";

export function detectMediaType(url: string): MediaType {
  if (!url) return "unknown";
  const lower = url.toLowerCase().split("?")[0];

  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".avi") ||
    lower.endsWith(".mkv") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".m4v") ||
    lower.endsWith(".3gp") ||
    lower.endsWith(".flv") ||
    lower.endsWith(".wmv") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".m3u8") ||
    lower.endsWith(".mpd") ||
    lower.includes("video") ||
    lower.includes("stream") ||
    lower.includes("hls")
  ) {
    return "video";
  }

  if (
    lower.endsWith(".mp3") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".aac") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".flac") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".opus") ||
    lower.endsWith(".wma") ||
    lower.includes("audio") ||
    lower.includes("podcast") ||
    lower.includes("radio")
  ) {
    return "audio";
  }

  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".bmp") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".heic") ||
    lower.includes("image") ||
    lower.includes("photo") ||
    lower.includes("img")
  ) {
    return "image";
  }

  if (lower.endsWith(".pdf") || lower.includes("pdf")) {
    return "pdf";
  }

  if (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".json") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".log") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm")
  ) {
    return "text";
  }

  return "video";
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<MediaItem[]>([]);
  const [currentItem, setCurrentItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [h, f] = await Promise.all([
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
      ]);
      if (h) setHistory(JSON.parse(h));
      if (f) setFavorites(JSON.parse(f));
    } catch {}
  };

  const saveHistory = async (items: MediaItem[]) => {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  };

  const saveFavorites = async (items: MediaItem[]) => {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  };

  const addToHistory = useCallback(
    (item: Omit<MediaItem, "id" | "addedAt" | "type">): MediaItem => {
      const type = detectMediaType(item.url);
      const newItem: MediaItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        addedAt: Date.now(),
        lastPlayedAt: Date.now(),
        type,
      };

      setHistory((prev) => {
        const filtered = prev.filter(
          (h) => h.url !== item.url || h.title !== item.title
        );
        const updated = [newItem, ...filtered].slice(0, 100);
        saveHistory(updated);
        return updated;
      });

      return newItem;
    },
    []
  );

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      const item = history.find((h) => h.id === id);
      if (!item) return;

      setFavorites((prev) => {
        const exists = prev.find((f) => f.id === id);
        let updated: MediaItem[];
        if (exists) {
          updated = prev.filter((f) => f.id !== id);
        } else {
          updated = [{ ...item, isFavorite: true }, ...prev];
        }
        saveFavorites(updated);
        return updated;
      });

      setHistory((prev) => {
        const updated = prev.map((h) =>
          h.id === id ? { ...h, isFavorite: !h.isFavorite } : h
        );
        saveHistory(updated);
        return updated;
      });
    },
    [history]
  );

  return (
    <PlayerContext.Provider
      value={{
        history,
        favorites,
        currentItem,
        addToHistory,
        removeFromHistory,
        clearHistory,
        toggleFavorite,
        setCurrentItem,
        detectMediaType,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
