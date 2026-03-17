import { Feather } from "@expo/vector-icons";
import { Audio, Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { MediaType } from "@/context/PlayerContext";
import { useLocale } from "@/context/LocaleContext";
import {
  SubtitleCue,
  parseSubtitles,
  getCurrentCue,
} from "@/utils/subtitleParser";

function formatTime(ms: number): string {
  if (!isFinite(ms) || isNaN(ms)) return "0:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
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
    barRef.current.measure((_x, _y, w) => {
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

interface SubtitlePanelProps {
  visible: boolean;
  onClose: () => void;
  onLoadUrl: (url: string) => void;
  onPickFile: () => void;
  onClear: () => void;
  hasSubtitles: boolean;
  isRTL: boolean;
  t: any;
}

function SubtitlePanel({
  visible, onClose, onLoadUrl, onPickFile, onClear, hasSubtitles, isRTL, t,
}: SubtitlePanelProps) {
  const [subUrl, setSubUrl] = useState("");
  const pt = t.player;

  const handleLoad = () => {
    if (!subUrl.trim()) return;
    onLoadUrl(subUrl.trim());
    setSubUrl("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={subStyles.overlay}>
        <Pressable style={subStyles.backdrop} onPress={onClose} />
        <View style={subStyles.sheet}>
          <View style={subStyles.handle} />
          <Text style={subStyles.title}>{pt.subtitle}</Text>

          {hasSubtitles && (
            <Pressable style={subStyles.clearBtn} onPress={onClear}>
              <Feather name="x-circle" size={16} color={Colors.danger} />
              <Text style={subStyles.clearText}>{pt.subtitleNone}</Text>
            </Pressable>
          )}

          <Text style={subStyles.label}>{pt.subtitleUrl}</Text>
          <View style={[subStyles.inputRow, isRTL && { flexDirection: "row-reverse" }]}>
            <TextInput
              style={[subStyles.input, isRTL && { textAlign: "right" }]}
              value={subUrl}
              onChangeText={setSubUrl}
              placeholder={pt.subtitleUrlPlaceholder}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Pressable
              style={[subStyles.loadBtn, !subUrl.trim() && { opacity: 0.4 }]}
              onPress={handleLoad}
              disabled={!subUrl.trim()}
            >
              <Text style={subStyles.loadBtnText}>{pt.subtitleLoad}</Text>
            </Pressable>
          </View>

          {Platform.OS !== "web" && (
            <Pressable style={subStyles.fileBtn} onPress={onPickFile}>
              <Feather name="folder" size={18} color={Colors.text} />
              <Text style={subStyles.fileBtnText}>{pt.subtitleFile}</Text>
            </Pressable>
          )}

          <Pressable style={subStyles.cancelBtn} onPress={onClose}>
            <Text style={subStyles.cancelText}>{pt.subtitleCancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
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
  loadingText: string;
}

function AudioPlayer({
  url, title, userAgent, soundRef, isPlaying, isLoading,
  progress, duration, position, onPlayPause, onSkip, onSeek,
  onStatusUpdate, setIsLoading, setHasError, loadingText,
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
    return () => { s?.unloadAsync(); };
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
          <Text style={styles.loadingText}>{loadingText}</Text>
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
  const { t, isRTL } = useLocale();
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
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);

  const [showSubtitlePanel, setShowSubtitlePanel] = useState(false);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);

  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();

  useEffect(() => {
    if (type === "text") loadTextContent();
    if (type === "audio") setupAudio();
    return () => { cleanup(); };
  }, [url, type]);

  useEffect(() => {
    const sub = ScreenOrientation.addOrientationChangeListener((evt) => {
      const o = evt.orientationInfo.orientation;
      setIsLandscape(
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      );
    });
    return () => ScreenOrientation.removeOrientationChangeListener(sub);
  }, []);

  useEffect(() => {
    if (subtitleCues.length > 0) {
      setCurrentCue(getCurrentCue(subtitleCues, position));
    } else {
      setCurrentCue(null);
    }
  }, [position, subtitleCues]);

  const cleanup = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch {}
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
    if (status.didJustFinish) setIsPlaying(false);
  }, []);

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === "video" && videoRef.current) {
      isPlaying ? await videoRef.current.pauseAsync() : await videoRef.current.playAsync();
    } else if (type === "audio" && soundRef.current) {
      isPlaying ? await soundRef.current.pauseAsync() : await soundRef.current.playAsync();
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

  const handleToggleLandscape = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isLandscape) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsLandscape(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsLandscape(true);
      }
    } catch {}
  };

  const loadSubtitleFromUrl = async (subUrl: string) => {
    try {
      const resp = await fetch(subUrl);
      if (!resp.ok) throw new Error("fetch failed");
      const text = await resp.text();
      const filename = subUrl.split("?")[0].split("/").pop() ?? "";
      const cues = parseSubtitles(text, filename);
      setSubtitleCues(cues);
      setShowSubtitlePanel(false);
    } catch {
      Alert.alert(t.player.subtitle, t.player.subtitleError);
    }
  };

  const pickSubtitleFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/*", "application/x-subrip"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);
      const cues = parseSubtitles(content, asset.name ?? "");
      setSubtitleCues(cues);
      setShowSubtitlePanel(false);
    } catch {
      Alert.alert(t.player.subtitle, t.player.subtitleError);
    }
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

    const pt = t.player.download;

    try {
      if (type === "image" || type === "video" || type === "audio") {
        if (!mediaLibraryPermission?.granted) {
          const { granted } = await requestMediaLibraryPermission();
          if (!granted) {
            Alert.alert(t.player.permNeeded, t.player.permMsg);
            return;
          }
        }
      }

      setIsDownloading(true);
      setDownloadProgress(0);

      const rawExt = url.split("?")[0].split(".").pop() ?? "";
      const ext = rawExt.length > 0 && rawExt.length <= 5 ? rawExt : "bin";
      const fileName = `urlplayer_${Date.now()}.${ext}`;
      const fileUri = (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "") + fileName;

      const headers: Record<string, string> = {};
      if (params.userAgent) headers["User-Agent"] = params.userAgent;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        { headers },
        (progress) => {
          const total = progress.totalBytesExpectedToWrite;
          const written = progress.totalBytesWritten;
          setDownloadProgress(total > 0 ? written / total : 0);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) throw new Error("No result URI");

      if (type === "image" || type === "video" || type === "audio") {
        await MediaLibrary.createAssetAsync(result.uri);
        Alert.alert(pt.success, pt.successMsg);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri);
        } else {
          Alert.alert(pt.success, result.uri);
        }
      }
    } catch {
      Alert.alert(t.player.download.fail, t.player.download.failMsg);
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
        Alert.alert(t.player.download.copied, t.player.download.copiedMsg);
      }
    }
  };

  const progress = duration > 0 ? position / duration : 0;
  const pt = t.player;

  const renderContent = () => {
    if (hasError) {
      return (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorTitle}>{pt.error.title}</Text>
          <Text style={styles.errorDesc}>{pt.error.desc}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => { setHasError(false); setIsLoading(true); }}
          >
            <Text style={styles.retryText}>{pt.error.retry}</Text>
          </Pressable>
        </View>
      );
    }

    if (type === "video") {
      return (
        <Pressable style={styles.videoWrapper} onPress={resetControlsTimer}>
          <Video
            ref={videoRef}
            source={{ uri: url, headers: params.userAgent ? { "User-Agent": params.userAgent } : {} }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onError={() => { setHasError(true); setIsLoading(false); }}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.text} />
              <Text style={styles.loadingText}>{pt.loading.video}</Text>
            </View>
          )}
          {currentCue && (
            <View style={styles.subtitleOverlay} pointerEvents="none">
              <Text style={styles.subtitleText}>{currentCue.text}</Text>
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
              <View style={styles.bottomControls}>
                <Pressable onPress={() => setShowSubtitlePanel(true)} style={styles.subBtn}>
                  <Feather name="type" size={16} color={subtitleCues.length > 0 ? "#FFF" : "rgba(255,255,255,0.5)"} />
                  <Text style={[styles.subBtnText, subtitleCues.length > 0 && { color: "#FFF" }]}>{pt.subtitle}</Text>
                </Pressable>
                <Pressable onPress={handleToggleLandscape} style={styles.subBtn}>
                  <Feather name={isLandscape ? "minimize-2" : "maximize-2"} size={16} color="rgba(255,255,255,0.7)" />
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
          url={url} title={title} userAgent={params.userAgent || ""}
          soundRef={soundRef} isPlaying={isPlaying} isLoading={isLoading}
          progress={progress} duration={duration} position={position}
          onPlayPause={handlePlayPause} onSkip={handleSkip} onSeek={handleSeek}
          onStatusUpdate={onPlaybackStatusUpdate}
          setIsLoading={setIsLoading} setHasError={setHasError}
          loadingText={pt.loading.audio}
        />
      );
    }

    if (type === "image") {
      return (
        <View style={styles.imageContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.text} />
              <Text style={styles.loadingText}>{pt.loading.image}</Text>
            </View>
          )}
          <Image
            source={{ uri: url, headers: params.userAgent ? { "User-Agent": params.userAgent } : {} }}
            style={styles.image}
            contentFit="contain"
            onLoad={() => setIsLoading(false)}
            onError={() => { setHasError(true); setIsLoading(false); }}
          />
        </View>
      );
    }

    if (type === "text") {
      if (isLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.text} />
            <Text style={styles.loadingText}>{pt.loading.content}</Text>
          </View>
        );
      }
      return (
        <ScrollView style={styles.textContainer} contentContainerStyle={styles.textContent}>
          <Text style={[styles.textBody, isRTL && { textAlign: "right" }]}>{textContent || "No content"}</Text>
        </ScrollView>
      );
    }

    if (type === "pdf") {
      return (
        <View style={styles.pdfContainer}>
          <Feather name="file-text" size={64} color={Colors.textMuted} />
          <Text style={styles.pdfTitle}>{pt.pdf.title}</Text>
          <Text style={styles.pdfDesc}>{pt.pdf.desc}</Text>
          <Pressable
            style={({ pressed }) => [styles.pdfDownloadBtn, pressed && { opacity: 0.8 }]}
            onPress={handleDownload}
          >
            <Feather name="download" size={18} color={Colors.accentForeground} />
            <Text style={styles.pdfDownloadText}>{pt.pdf.btn}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.unknownContainer}>
        <Feather name="link" size={48} color={Colors.textMuted} />
        <Text style={styles.pdfTitle}>{pt.unknown.title}</Text>
        <Text style={styles.pdfDesc}>{pt.unknown.desc}</Text>
        <Pressable
          style={({ pressed }) => [styles.pdfDownloadBtn, pressed && { opacity: 0.8 }]}
          onPress={handleDownload}
        >
          <Feather name="download" size={18} color={Colors.accentForeground} />
          <Text style={styles.pdfDownloadText}>{pt.unknown.btn}</Text>
        </Pressable>
      </View>
    );
  };

  const topBarStyle = [
    styles.topBar,
    isRTL && { flexDirection: "row-reverse" as const },
  ];

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape, { paddingTop: isLandscape ? 0 : insets.top }]}>
      {!isLandscape && (
        <View style={topBarStyle}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
          >
            <Feather name="chevron-down" size={24} color={Colors.text} />
          </Pressable>

          <View style={styles.topCenter}>
            <Text style={[styles.topTitle, isRTL && { textAlign: "right" }]} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={[styles.topActions, isRTL && { flexDirection: "row-reverse" as const }]}>
            {type !== "pdf" && type !== "text" && type !== "unknown" && (
              <Pressable
                onPress={handleToggleMute}
                style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
              >
                <Feather name={isMuted ? "volume-x" : "volume-2"} size={20} color={Colors.text} />
              </Pressable>
            )}
            {type === "video" && (
              <Pressable
                onPress={() => setShowSubtitlePanel(true)}
                style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
              >
                <Feather
                  name="type"
                  size={20}
                  color={subtitleCues.length > 0 ? Colors.text : Colors.textMuted}
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
      )}

      {isDownloading && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${downloadProgress * 100}%` }]} />
        </View>
      )}

      <View style={styles.content}>{renderContent()}</View>

      {!isLandscape && (
        <View style={[styles.urlBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <Feather name="link" size={12} color={Colors.textMuted} />
          <Text style={styles.urlText} numberOfLines={1}>{url}</Text>
        </View>
      )}

      {isLandscape && type === "video" && (
        <Pressable
          style={styles.exitLandscapeBtn}
          onPress={handleToggleLandscape}
        >
          <Feather name="minimize-2" size={20} color="#FFF" />
        </Pressable>
      )}

      <SubtitlePanel
        visible={showSubtitlePanel}
        onClose={() => setShowSubtitlePanel(false)}
        onLoadUrl={loadSubtitleFromUrl}
        onPickFile={pickSubtitleFile}
        onClear={() => { setSubtitleCues([]); setCurrentCue(null); setShowSubtitlePanel(false); }}
        hasSubtitles={subtitleCues.length > 0}
        isRTL={isRTL}
        t={t}
      />
    </View>
  );
}

const pbStyles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.7)", minWidth: 36, textAlign: "center" },
  track: { flex: 1, height: 20, justifyContent: "center" },
  trackBg: { position: "absolute", left: 0, right: 0, height: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 },
  trackFill: { position: "absolute", left: 0, height: 3, backgroundColor: "#FFFFFF", borderRadius: 2 },
  thumb: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFFFFF", marginLeft: -6, top: "50%", marginTop: -6 },
});

const subStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted, alignSelf: "center", marginBottom: 16 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: Colors.text, marginBottom: 16, textAlign: "center" },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: { flex: 1, backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: Colors.text, fontFamily: "Inter_400Regular", fontSize: 13 },
  loadBtn: { backgroundColor: Colors.text, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: "center" },
  loadBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.accentForeground },
  fileBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surfaceElevated, padding: 14, borderRadius: 12, marginBottom: 12 },
  fileBtnText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,68,68,0.1)", padding: 12, borderRadius: 10, marginBottom: 16 },
  clearText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.danger },
  cancelBtn: { alignItems: "center", paddingTop: 8 },
  cancelText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.playerBg },
  containerLandscape: { paddingTop: 0 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0 },
  topBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  topCenter: { flex: 1, paddingHorizontal: 8 },
  topTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text, textAlign: "center" },
  topActions: { flexDirection: "row", gap: 4 },
  progressBar: { height: 2, backgroundColor: "#222" },
  progressFill: { height: 2, backgroundColor: Colors.text },
  content: { flex: 1 },
  videoWrapper: { flex: 1, backgroundColor: "#000", position: "relative" },
  video: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "rgba(0,0,0,0.5)" },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  videoControls: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 20, paddingTop: 60, backgroundColor: "transparent", gap: 12 },
  controlRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32 },
  ctrlBtn: { alignItems: "center", justifyContent: "center", width: 44, height: 44 },
  skipLabel: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: "#FFF", marginTop: 1 },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  bottomControls: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  subBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6 },
  subBtnText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.5)" },
  subtitleOverlay: { position: "absolute", bottom: 80, left: 16, right: 16, alignItems: "center" },
  subtitleText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFF", textAlign: "center", textShadowColor: "#000", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  exitLandscapeBtn: { position: "absolute", top: 12, right: 16, width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8 },
  audioContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 20 },
  audioIcon: { width: 120, height: 120, borderRadius: 30, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  audioTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.text, textAlign: "center" },
  audioLoading: { alignItems: "center", gap: 8 },
  audioControls: { width: "100%", gap: 12 },
  imageContainer: { flex: 1, position: "relative" },
  image: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  textContainer: { flex: 1, backgroundColor: Colors.surface },
  textContent: { padding: 20 },
  textBody: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text, lineHeight: 22 },
  pdfContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  pdfTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text, textAlign: "center" },
  pdfDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  pdfDownloadBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.text, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  pdfDownloadText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.accentForeground },
  unknownContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  errorTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text, textAlign: "center" },
  errorDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  retryBtn: { backgroundColor: Colors.text, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.accentForeground },
  urlBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 0 },
  urlText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted },
});
