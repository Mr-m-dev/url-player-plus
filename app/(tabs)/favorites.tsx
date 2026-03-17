import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MediaCard } from "@/components/MediaCard";
import Colors from "@/constants/colors";
import { MediaItem, usePlayer } from "@/context/PlayerContext";

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { favorites, toggleFavorite } = usePlayer();

  const handlePlay = (item: MediaItem) => {
    router.push({
      pathname: "/player",
      params: {
        id: item.id,
        url: item.url,
        title: item.title,
        type: item.type,
        userAgent: item.userAgent || "",
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Favorites</Text>
          <Text style={styles.headerSub}>
            {favorites.length > 0
              ? `${favorites.length} saved item${favorites.length !== 1 ? "s" : ""}`
              : "Save your favorite media"}
          </Text>
        </View>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="heart" size={44} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Favorites</Text>
          <Text style={styles.emptyDesc}>
            Tap the heart icon on any media item to save it here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {favorites.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onPlay={handlePlay}
              onFavorite={toggleFavorite}
              showFavoriteButton={true}
            />
          ))}
        </ScrollView>
      )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  },
});
