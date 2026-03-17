import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddMediaModal } from "@/components/AddMediaModal";
import { MediaCard } from "@/components/MediaCard";
import Colors from "@/constants/colors";
import { MediaItem, usePlayer } from "@/context/PlayerContext";
import { useLocale } from "@/context/LocaleContext";

type FilterKey = "all" | "video" | "audio" | "image" | "docs";

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const { history, addToHistory, removeFromHistory, toggleFavorite } = usePlayer();
  const { t, isRTL } = useLocale();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t.home.filters.all },
    { key: "video", label: t.home.filters.video },
    { key: "audio", label: t.home.filters.audio },
    { key: "image", label: t.home.filters.image },
    { key: "docs", label: t.home.filters.docs },
  ];

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    if (filter === "video") return item.type === "video";
    if (filter === "audio") return item.type === "audio";
    if (filter === "image") return item.type === "image";
    if (filter === "docs") return item.type === "pdf" || item.type === "text";
    return true;
  });

  const handlePlay = (item: MediaItem) => {
    router.push({
      pathname: "/player",
      params: { id: item.id, url: item.url, title: item.title, type: item.type, userAgent: item.userAgent || "" },
    });
  };

  const handleSubmit = (title: string, url: string, userAgent?: string) => {
    const item = addToHistory({ title, url, userAgent });
    setShowModal(false);
    handlePlay(item);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <View style={isRTL ? styles.headerTextRTL : undefined}>
          <Text style={styles.headerTitle}>{t.appTitle}</Text>
          <Text style={styles.headerSub}>{t.home.subtitle(history.length)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
        >
          <Feather name="plus" size={20} color={Colors.accentForeground} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterContainer, isRTL && styles.filterContainerRTL]}
        style={styles.filterScroll}
      >
        {filters.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => { setFilter(f.key); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <EmptyState onAdd={() => setShowModal(true)} t={t} />
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyFilter}>
            <Text style={styles.emptyFilterText}>
              {t.home.noItems(filters.find((f) => f.key === filter)?.label ?? filter)}
            </Text>
          </View>
        ) : (
          filteredHistory.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onPlay={handlePlay}
              onDelete={removeFromHistory}
              onFavorite={toggleFavorite}
            />
          ))
        )}
      </ScrollView>

      <AddMediaModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

function EmptyState({ onAdd, t }: { onAdd: () => void; t: any }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Feather name="play-circle" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>{t.home.empty.title}</Text>
      <Text style={styles.emptyDesc}>{t.home.empty.desc}</Text>
      <Pressable
        style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
        onPress={onAdd}
      >
        <Feather name="plus" size={16} color={Colors.accentForeground} />
        <Text style={styles.emptyBtnText}>{t.home.empty.btn}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  headerRTL: { flexDirection: "row-reverse" },
  headerTextRTL: { alignItems: "flex-end" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.text, alignItems: "center", justifyContent: "center" },
  addButtonPressed: { opacity: 0.8 },
  filterScroll: { maxHeight: 44, marginBottom: 4 },
  filterContainer: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  filterContainerRTL: { flexDirection: "row-reverse" },
  filterTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.surface },
  filterTabActive: { backgroundColor: Colors.text },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: Colors.accentForeground },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { width: 88, height: 88, borderRadius: 22, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 40, lineHeight: 22 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.text, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.accentForeground },
  emptyFilter: { alignItems: "center", paddingTop: 60 },
  emptyFilterText: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textMuted },
});
