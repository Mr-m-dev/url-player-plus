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

const MEDIA_TYPES = ["All", "Video", "Audio", "Image", "Docs"] as const;
type Filter = (typeof MEDIA_TYPES)[number];

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const { history, addToHistory, removeFromHistory, toggleFavorite } = usePlayer();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");

  const filteredHistory = history.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Video") return item.type === "video";
    if (filter === "Audio") return item.type === "audio";
    if (filter === "Image") return item.type === "image";
    if (filter === "Docs") return item.type === "pdf" || item.type === "text";
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>URL Player+</Text>
          <Text style={styles.headerSub}>
            {history.length > 0
              ? `${history.length} item${history.length !== 1 ? "s" : ""} in history`
              : "Add your first media URL"}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowModal(true);
          }}
        >
          <Feather name="plus" size={20} color={Colors.accentForeground} />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
      >
        {MEDIA_TYPES.map((t) => (
          <Pressable
            key={t}
            style={[styles.filterTab, filter === t && styles.filterTabActive]}
            onPress={() => {
              setFilter(t);
              Haptics.selectionAsync();
            }}
          >
            <Text
              style={[
                styles.filterText,
                filter === t && styles.filterTextActive,
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
          <EmptyState onAdd={() => setShowModal(true)} />
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyFilter}>
            <Text style={styles.emptyFilterText}>
              No {filter.toLowerCase()} items yet
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Feather name="play-circle" size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Media Added</Text>
      <Text style={styles.emptyDesc}>
        Add a URL to start playing videos, audio, images, PDFs, and more
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.emptyBtn,
          pressed && { opacity: 0.8 },
        ]}
        onPress={onAdd}
      >
        <Feather name="plus" size={16} color={Colors.accentForeground} />
        <Text style={styles.emptyBtnText}>Add Media URL</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  filterScroll: {
    maxHeight: 44,
    marginBottom: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: "center",
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.accentForeground,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  emptyDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.text,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.accentForeground,
  },
  emptyFilter: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyFilterText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textMuted,
  },
});
