import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import { MediaItem } from "@/context/PlayerContext";
import { useLocale } from "@/context/LocaleContext";
import { MediaTypeBadge, MediaTypeIcon } from "./MediaTypeIcon";

interface MediaCardProps {
  item: MediaItem;
  onPlay: (item: MediaItem) => void;
  onDelete?: (id: string) => void;
  onFavorite?: (id: string) => void;
  showFavoriteButton?: boolean;
}

function formatDate(ts: number, t: any): string {
  const ct = t.card;
  const now = new Date();
  const diff = now.getTime() - ts;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const d = new Date(ts);

  if (minutes < 1) return ct.justNow;
  if (minutes < 60) return ct.minutesAgo(minutes);
  if (hours < 24) return ct.hoursAgo(hours);
  if (days < 7) return ct.daysAgo(days);
  return d.toLocaleDateString();
}

export function MediaCard({
  item,
  onPlay,
  onDelete,
  onFavorite,
  showFavoriteButton = true,
}: MediaCardProps) {
  const { t, isRTL } = useLocale();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPlay(item);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t.card.remove, t.card.removeMsg, [
      { text: t.card.cancel, style: "cancel" },
      { text: t.card.remove, style: "destructive", onPress: () => onDelete?.(item.id) },
    ]);
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite?.(item.id);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, isRTL && styles.cardRTL]}
      onPress={handlePress}
    >
      <View style={styles.iconArea}>
        <MediaTypeIcon type={item.type} size={22} color={Colors.text} />
      </View>
      <View style={styles.info}>
        <View style={[styles.titleRow, isRTL && styles.titleRowRTL]}>
          <Text style={[styles.title, isRTL && styles.textRTL]} numberOfLines={1}>
            {item.title || "Untitled"}
          </Text>
          <MediaTypeBadge type={item.type} />
        </View>
        <Text style={[styles.url, isRTL && styles.textRTL]} numberOfLines={1}>{item.url}</Text>
        <Text style={[styles.date, isRTL && styles.textRTL]}>{formatDate(item.addedAt, t)}</Text>
      </View>
      <View style={[styles.actions, isRTL && styles.actionsRTL]}>
        {showFavoriteButton && onFavorite && (
          <Pressable onPress={handleFavorite} style={styles.actionBtn} hitSlop={8}>
            <Feather name="heart" size={16} color={item.isFavorite ? "#FF4466" : Colors.textMuted} />
          </Pressable>
        )}
        {onDelete && (
          <Pressable onPress={handleDelete} style={styles.actionBtn} hitSlop={8}>
            <Feather name="trash-2" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardRTL: { flexDirection: "row-reverse" },
  cardPressed: { opacity: 0.7, backgroundColor: Colors.surfaceElevated },
  iconArea: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 12,
  },
  info: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  titleRowRTL: { flexDirection: "row-reverse" },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text, flex: 1 },
  textRTL: { textAlign: "right" },
  url: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  date: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  actions: { flexDirection: "row", gap: 4, marginStart: 8 },
  actionsRTL: { flexDirection: "row-reverse" },
  actionBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: Colors.surfaceElevated },
});
