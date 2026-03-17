import { Feather } from "@expo/vector-icons";
import { Audio, Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { MediaType } from "@/context/PlayerContext";

function formatTime(ms: number): string {
  if (!isFinite(ms) || isNaN(ms)) return "0:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface AudioPlayerProps {
  url: string;
  title: string;
  userAgent: string;
  soundRef: React.MutableRefObject<Audio.Sound | null>;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  position: number;
  onPlayPause: () => void;
  onSkip: (s: number) => void;
  onSeek: (v: number) => void;
  onStatusUpdate: (s: AVPlaybackStatus) => void;
  setIsLoading: (v: boolean) => void;
  setHasError: (v: boolean) => void;
}

function AudioPlayer({
  url, title, userAgent, soundRef, isPlaying, isLoading,
  progress, duration, position, onPlayPause, onSkip, onSeek,
  onStatusUpdate, setIsLoading, setHasError,
}: AudioPlayerProps) {
  useEffect(() => {
    let s: Audio.Sound | null = null;
    (async () => {
      try {
        const headers: Record<string, string> = userAgent ? { "User-Agent": userAgent } : {};
        const { sound } = await Audio.Sound.createAsync(
          { uri: url, headers },
          { shouldPlay: true },
          onStatusUpdate
        );
        soundRef.current = sound;
        s = sound;
        setIsLoading(false);
      } catch {
        setHasError(true);
        setIsLoading(false);
      }
    })();
    return () => {
      s?.unloadAsync();
    };
  }, [url]);

  return (
    <View style={styles.audioContainer}>
      <View style={styles.audioIcon}>
        <Feather name="music" size={64} color={Colors.text} />
      </View>
      <Text style={styles.audioTitle} numberOfLines={2}>{title}</Text>
      {isLoading ? (
        <View style={styles.audioLoading}>
          <ActivityIndicator color={Colors.text} />
          <Text style={styles.loadingText}>Loading audio...</Text>
        </View>
      ) : (
        <View style={styles.audioControls}>
          <VideoProgressBar progress={progress} duration={duration} position={position} onSeek={onSeek} />
          <View style={styles.controlRow}>
            <Pressable onPress={() => onSkip(-15)} style={styles.ctrlBtn}>
              <Feather name="rotate-ccw" size={20} color="#FFF" />
              <Text style={styles.skipLabel}>15</Text>
            </Pressable>
            <Pressable onPress={onPlayPause} style={styles.playBtn}>
              <Feather name={isPlaying ? "pause" : "play"} size={28} color={Colors.accentForeground} />
            </Pressable>
            <Pressable onPress={() => onSkip(15)} style={styles.ctrlBtn}>
              <Feather name="rotate-cw" size={20} color="#FFF" />
              <Text style={styles.skipLabel}>15</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    url: string;
    title: string;
    type: string;
    userAgent: string;
  }>();

  const url = params.url || "";
  const title = params.title || "Media";
  const type = (params.type || "video") as MediaType;

  const videoRef = useRef<Video>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();

  useEffect(() => {
    if (type === "text") {
      loadTextContent();
    }
    if (type === "audio") {
      setupAudio();
    }
    return () => {
      cleanup();
    };
  }, [url, type]);

  const cleanup = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
  };

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch {}
  };

  const loadTextContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(url);
      const text = await response.text();
      setTextContent(text.slice(0, 50000));
      setIsLoading(false);
    } catch {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setHasError(true);
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(false);
    setIsPlaying(!!status.isPlaying);
    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  }, []);

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === "video" && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } else if (type === "audio" && soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    }
  };

  const handleSeek = async (value: number) => {
    const newPos = value * duration;
    if (type === "video" && videoRef.current) {
      await videoRef.current.setPositionAsync(newPos);
    } else if (type === "audio" && soundRef.current) {
      await soundRef.current.setPositionAsync(newPos);
    }
  };

  const handleSkip = async (seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPos = Math.max(0, Math.min(duration, position + seconds * 1000));
    if (type === "video" && videoRef.current) {
      await videoRef.current.setPositionAsync(newPos);
    } else if (type === "audio" && soundRef.current) {
      await soundRef.current.setPositionAsync(newPos);
    }
  };

  const handleToggleMute = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (type === "video" && videoRef.current) {
      await videoRef.current.setIsMutedAsync(newMuted);
    } else if (type === "audio" && soundRef.current) {
      await soundRef.current.setIsMutedAsync(newMuted);
    }
  };

  const resetControlsTimer = () => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setShowControls(true);
    controlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleVideoPress = () => {
    resetControlsTimer();
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS === "web") {
      const a = document.createElement("a");
      a.href = url;
      a.download = title;
      a.click();
      return;
    }

    try {
      if (type === "image" || type === "video" || type === "audio") {
        if (!mediaLibraryPermission?.granted) {
          const { granted } = await requestMediaLibraryPermission();
          if (!granted) {
            Alert.alert(
              "Permission Required",
              "Please allow access to save media to your library."
            );
            return;
          }
        }
      }

      setIsDownloading(true);
      setDownloadProgress(0);

      const ext = url.split("?")[0].split(".").pop() || "mp4";
      const fileName = `urlplayer_${Date.now()}.${ext}`;
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (progress) => {
          const pct =
            progress.totalBytesExpectedToDownload > 0
              ? progress.totalBytesWritten /
                progress.totalBytesExpectedToDownload
              : 0;
          setDownloadProgress(pct);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error("Download failed");

      if (type === "image" || type === "video" || type === "audio") {
        await MediaLibrary.saveToLibraryAsync(result.uri);
        Alert.alert("Saved!", "Media saved to your library.");
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, { mimeType: "application/octet-stream" });
        } else {
          Alert.alert("Downloaded!", `Saved to: ${result.uri}`);
        }
      }
    } catch (e) {
      Alert.alert("Download Failed", "Could not download the file. Please check the URL and try again.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(url);
    } else if (Platform.OS === "web") {
      if (navigator.share) {
        navigator.share({ url, title });
      } else {
        await navigator.clipboard?.writeText(url);
        Alert.alert("Copied!", "URL copied to clipboard.");
      }
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  const renderContent = () => {
    if (hasError) {
      return (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorTitle}>Could Not Load Media</Text>
          <Text style={styles.errorDesc}>
            The URL may be invalid or the media format is not supported.
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              setHasError(false);
              setIsLoading(true);
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    if (type === "video") {
      return (
        <Pressable style={styles.videoWrapper} onPress={handleVideoPress}>
          <Video
            ref={videoRef}
            source={{ uri: url, headers: params.userAgent ? { "User-Agent": params.userAgent } : {} }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.text} />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          {showControls && !isLoading && (
            <View style={styles.videoControls}>
              <VideoProgressBar progress={progress} duration={duration} position={position} onSeek={handleSeek} />
              <View style={styles.controlRow}>
                <Pressable onPress={() => handleSkip(-10)} style={styles.ctrlBtn}>
                  <Feather name="rotate-ccw" size={20} color="#FFF" />
                  <Text style={styles.skipLabel}>10</Text>
                </Pressable>
                <Pressable onPress={handlePlayPause} style={styles.playBtn}>
                  <Feather name={isPlaying ? "pause" : "play"} size={28} color={Colors.accentForeground} />
                </Pressable>
                <Pressable onPress={() => handleSkip(10)} style={styles.ctrlBtn}>
                  <Feather name="rotate-cw" size={20} color="#FFF" />
                  <Text style={styles.skipLabel}>10</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      );
    }

    if (type === "audio") {
      return (
        <AudioPlayer
          url={url}
          title={title}
          userAgent={params.userAgent || ""}
          soundRef={soundRef}
          isPlaying={isPlaying}
          isLoading={isLoading}
          progress={progress}
          duration={duration}
          position={position}
          onPlayPause={handlePlayPause}
          onSkip={handleSkip}
          onSeek={handleSeek}
          onStatusUpdate={onPlaybackStatusUpdate}
          setIsLoading={setIsLoading}
          setHasError={setHasError}
        />
      );
    }

    if (type === "image") {
      return (
        <View style={styles.imageContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.text} />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          )}
          <Image
            source={{ uri: url, headers: params.userAgent ? { "User-Agent": params.userAgent } : {} }}
            style={styles.image}
            contentFit="contain"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        </View>
      );
    }

    if (type === "text") {
      if (isLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.text} />
            <Text style={styles.loadingText}>Loading content...</Text>
          </View>
        );
      }
      return (
        <ScrollView style={styles.textContainer} contentContainerStyle={styles.textContent}>
          <Text style={styles.textBody}>{textContent || "No content"}</Text>
        </ScrollView>
      );
    }

    if (type === "pdf") {
      return (
        <View style={styles.pdfContainer}>
          <Feather name="file-text" size={64} color={Colors.textMuted} />
          <Text style={styles.pdfTitle}>PDF Document</Text>
          <Text style={styles.pdfDesc}>
            Tap Download to save the PDF to your device and open it with a PDF viewer.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.pdfDownloadBtn, pressed && { opacity: 0.8 }]}
            onPress={handleDownload}
          >
            <Feather name="download" size={18} color={Colors.accentForeground} />
            <Text style={styles.pdfDownloadText}>Download PDF</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.unknownContainer}>
        <Feather name="link" size={48} color={Colors.textMuted} />
        <Text style={styles.pdfTitle}>Unknown Media Type</Text>
        <Text style={styles.pdfDesc}>Download the file to your device to open it.</Text>
        <Pressable
          style={({ pressed }) => [styles.pdfDownloadBtn, pressed && { opacity: 0.8 }]}
          onPress={handleDownload}
        >
          <Feather name="download" size={18} color={Colors.accentForeground} />
          <Text style={styles.pdfDownloadText}>Download File</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
        >
          <Feather name="chevron-down" size={24} color={Colors.text} />
        </Pressable>

        <View style={styles.topCenter}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.topActions}>
          {type !== "pdf" && type !== "text" && type !== "unknown" && (
            <Pressable
              onPress={handleToggleMute}
              style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
            >
              <Feather
                name={isMuted ? "volume-x" : "volume-2"}
                size={20}
                color={Colors.text}
              />
            </Pressable>
          )}
          <Pressable
            onPress={handleDownload}
            style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Feather name="download" size={20} color={Colors.text} />
            )}
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="share" size={20} color={Colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Download Progress */}
      {isDownloading && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${downloadProgress * 100}%` }]} />
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* URL Info Bar */}
      <View style={[styles.urlBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Feather name="link" size={12} color={Colors.textMuted} />
        <Text style={styles.urlText} numberOfLines={1}>
          {url}
        </Text>
      </View>
    </View>
  );
}

interface VideoProgressBarProps {
  progress: number;
  duration: number;
  position: number;
  onSeek: (value: number) => void;
}

function VideoProgressBar({ progress, duration, position, onSeek }: VideoProgressBarProps) {
  const barRef = useRef<View>(null);

  const handlePress = (e: any) => {
    if (!barRef.current) return;
    barRef.current.measure((x, y, w) => {
      const touchX = e.nativeEvent.locationX;
      const value = Math.max(0, Math.min(1, touchX / w));
      onSeek(value);
    });
  };

  return (
    <View style={pbStyles.wrapper}>
      <Text style={pbStyles.time}>{formatTime(position)}</Text>
      <TouchableOpacity
        activeOpacity={1}
        style={pbStyles.track}
        ref={barRef as any}
        onPress={handlePress}
      >
        <View style={pbStyles.trackBg} />
        <View style={[pbStyles.trackFill, { width: `${Math.min(100, progress * 100)}%` }]} />
        <View style={[pbStyles.thumb, { left: `${Math.min(100, progress * 100)}%` }]} />
      </TouchableOpacity>
      <Text style={pbStyles.time}>{formatTime(duration)}</Text>
    </View>
  );
}

const pbStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    minWidth: 36,
    textAlign: "center",
  },
  track: {
    flex: 1,
    height: 20,
    justifyContent: "center",
  },
  trackBg: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  trackFill: {
    position: "absolute",
    left: 0,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    marginLeft: -6,
    top: "50%",
    marginTop: -6,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.playerBg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  topBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  topCenter: {
    flex: 1,
    paddingHorizontal: 8,
  },
  topTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    textAlign: "center",
  },
  topActions: {
    flexDirection: "row",
    gap: 4,
  },
  progressBar: {
    height: 2,
    backgroundColor: "#222",
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.text,
  },
  content: {
    flex: 1,
  },

  // Video
  videoWrapper: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  video: {
    flex: 1,
  },
  videoControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: "linear-gradient(transparent, rgba(0,0,0,0.8))",
    gap: 8,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  ctrlBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
  },
  skipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#FFF",
    marginTop: 1,
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },

  // Audio
  audioContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  audioIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  audioTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
  },
  audioLoading: {
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  audioControls: {
    width: "100%",
    gap: 12,
    marginTop: 12,
  },

  // Image
  imageContainer: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  image: {
    flex: 1,
  },

  // Text
  textContainer: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  textContent: {
    padding: 20,
  },
  textBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#CCCCCC",
    lineHeight: 22,
  },

  // PDF / Unknown
  pdfContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  unknownContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  pdfTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  pdfDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  pdfDownloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.text,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  pdfDownloadText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.accentForeground,
  },

  // Loading/Error
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10,
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  errorDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },

  // URL Bar
  urlBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
  },
  urlText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
});
