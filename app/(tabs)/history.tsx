import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MediaCard } from "@/components/MediaCard";
import Colors from "@/constants/colors";
import { MediaItem, usePlayer } from "@/context/PlayerContext";
import { useLocale } from "@/context/LocaleContext";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history, removeFromHistory, clearHistory, toggleFavorite } = usePlayer();
  const { t, isRTL } = useLocale();
  const th = t.history;

  const handlePlay = (item: MediaItem) => {
    router.push({
      pathname: "/player",
      params: { id: item.id, url: item.url, title: item.title, type: item.type, userAgent: item.userAgent || "" },
    });
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(th.clearTitle, th.clearMsg, [
      { text: t.cancel, style: "cancel" },
      { text: t.clearAll, style: "destructive", onPress: clearHistory },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <View style={isRTL ? styles.headerTextRTL : undefined}>
          <Text style={styles.headerTitle}>{th.title}</Text>
          <Text style={styles.headerSub}>{th.subtitle(history.length)}</Text>
        </View>
        {history.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.7 }]}
            onPress={handleClear}
          >
            <Feather name="trash-2" size={16} color={Colors.danger} />
            <Text style={styles.clearBtnText}>{th.clear}</Text>
          </Pressable>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="clock" size={44} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>{th.empty.title}</Text>
          <Text style={styles.emptyDesc}>{th.empty.desc}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {history.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onPlay={handlePlay}
              onDelete={removeFromHistory}
              onFavorite={toggleFavorite}
            />
          ))}
        </ScrollView>
      )}
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
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(255,68,68,0.1)" },
  clearBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.danger },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon: { width: 88, height: 88, borderRadius: 22, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text },
  emptyDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 40 },
});
