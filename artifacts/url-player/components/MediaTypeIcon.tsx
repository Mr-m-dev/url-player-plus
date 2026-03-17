import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, StyleSheet } from "react-native";

import { MediaType } from "@/context/PlayerContext";
import Colors from "@/constants/colors";

interface MediaTypeIconProps {
  type: MediaType;
  size?: number;
  color?: string;
}

export function MediaTypeIcon({ type, size = 20, color }: MediaTypeIconProps) {
  const iconColor = color || Colors.textSecondary;

  switch (type) {
    case "video":
      return <Feather name="film" size={size} color={iconColor} />;
    case "audio":
      return <Feather name="music" size={size} color={iconColor} />;
    case "image":
      return <Feather name="image" size={size} color={iconColor} />;
    case "pdf":
      return <Feather name="file-text" size={size} color={iconColor} />;
    case "text":
      return <Feather name="file" size={size} color={iconColor} />;
    default:
      return <Feather name="link" size={size} color={iconColor} />;
  }
}

interface MediaTypeBadgeProps {
  type: MediaType;
}

export function MediaTypeBadge({ type }: MediaTypeBadgeProps) {
  const colors: Record<MediaType, { bg: string; text: string }> = {
    video: { bg: "#1A2A1A", text: "#44DD88" },
    audio: { bg: "#1A1A2A", text: "#6688FF" },
    image: { bg: "#2A1A2A", text: "#DD66FF" },
    pdf: { bg: "#2A1A1A", text: "#FF6644" },
    text: { bg: "#2A2A1A", text: "#DDBB44" },
    unknown: { bg: "#1A1A1A", text: "#888888" },
  };

  const labels: Record<MediaType, string> = {
    video: "VIDEO",
    audio: "AUDIO",
    image: "IMAGE",
    pdf: "PDF",
    text: "TEXT",
    unknown: "URL",
  };

  const c = colors[type];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <MediaTypeIcon type={type} size={10} color={c.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
