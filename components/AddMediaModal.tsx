import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { detectMediaType } from "@/context/PlayerContext";
import { useLocale } from "@/context/LocaleContext";
import { MediaTypeIcon } from "./MediaTypeIcon";

interface AddMediaModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, url: string, userAgent?: string) => void;
}

export function AddMediaModal({ visible, onClose, onSubmit }: AddMediaModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const insets = useSafeAreaInsets();
  const urlRef = useRef<TextInput>(null);
  const { t, isRTL } = useLocale();
  const tm = t.modal;

  const QUICK_EXAMPLES = [
    { label: isRTL ? "فيديو نموذجي" : "Sample Video", url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const },
    { label: isRTL ? "صوت نموذجي" : "Sample Audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", type: "audio" as const },
    { label: isRTL ? "صورة نموذجية" : "Sample Image", url: "https://picsum.photos/800/600", type: "image" as const },
    { label: isRTL ? "PDF نموذجي" : "Sample PDF", url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf", type: "pdf" as const },
  ];

  const detectedType = url ? detectMediaType(url) : null;

  const handleSubmit = () => {
    if (!url.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(title.trim() || url.trim(), url.trim(), userAgent.trim() || undefined);
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setUserAgent("");
    setShowAdvanced(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const applyExample = (example: (typeof QUICK_EXAMPLES)[0]) => {
    setUrl(example.url);
    setTitle(example.label);
    Haptics.selectionAsync();
  };

  const isValid = url.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            <View style={[styles.header, isRTL && styles.headerRTL]}>
              <Text style={styles.headerTitle}>{tm.title}</Text>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <View style={[styles.fieldHeader, isRTL && styles.fieldHeaderRTL]}>
                  <Feather name="link" size={14} color={Colors.textSecondary} />
                  <Text style={styles.fieldLabel}>{tm.urlLabel}</Text>
                  {detectedType && (
                    <View style={[styles.detectedType, isRTL && styles.detectedTypeRTL]}>
                      <MediaTypeIcon type={detectedType} size={12} color={Colors.textSecondary} />
                    </View>
                  )}
                </View>
                <TextInput
                  ref={urlRef}
                  style={[styles.input, url.length > 0 && styles.inputActive, isRTL && styles.inputRTL]}
                  placeholder={tm.urlPlaceholder}
                  placeholderTextColor={Colors.textMuted}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="next"
                  selectionColor={Colors.text}
                  textAlign={isRTL ? "right" : "left"}
                />
              </View>

              <View style={styles.field}>
                <View style={[styles.fieldHeader, isRTL && styles.fieldHeaderRTL]}>
                  <Feather name="type" size={14} color={Colors.textSecondary} />
                  <Text style={styles.fieldLabel}>{tm.titleLabel}</Text>
                </View>
                <TextInput
                  style={[styles.input, title.length > 0 && styles.inputActive, isRTL && styles.inputRTL]}
                  placeholder={tm.titlePlaceholder}
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="done"
                  selectionColor={Colors.text}
                  textAlign={isRTL ? "right" : "left"}
                />
              </View>

              <Pressable
                style={[styles.advancedToggle, isRTL && styles.advancedToggleRTL]}
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                <Feather name={showAdvanced ? "chevron-up" : "chevron-down"} size={14} color={Colors.textMuted} />
                <Text style={styles.advancedLabel}>{tm.advanced}</Text>
              </Pressable>

              {showAdvanced && (
                <View style={styles.field}>
                  <View style={[styles.fieldHeader, isRTL && styles.fieldHeaderRTL]}>
                    <Feather name="globe" size={14} color={Colors.textSecondary} />
                    <Text style={styles.fieldLabel}>{tm.userAgentLabel}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, isRTL && styles.inputRTL]}
                    placeholder={tm.userAgentPlaceholder}
                    placeholderTextColor={Colors.textMuted}
                    value={userAgent}
                    onChangeText={setUserAgent}
                    autoCapitalize="none"
                    returnKeyType="done"
                    selectionColor={Colors.text}
                    textAlign={isRTL ? "right" : "left"}
                  />
                  <Text style={[styles.fieldHint, isRTL && styles.textRTL]}>{tm.userAgentHint}</Text>
                </View>
              )}

              <Text style={[styles.sectionLabel, isRTL && styles.textRTL]}>{tm.examples}</Text>
              <View style={[styles.examples, isRTL && styles.examplesRTL]}>
                {QUICK_EXAMPLES.map((ex) => (
                  <Pressable
                    key={ex.url}
                    style={({ pressed }) => [
                      styles.exampleChip,
                      pressed && styles.exampleChipPressed,
                      url === ex.url && styles.exampleChipActive,
                    ]}
                    onPress={() => applyExample(ex)}
                  >
                    <MediaTypeIcon type={ex.type} size={12} color={url === ex.url ? Colors.accentForeground : Colors.textSecondary} />
                    <Text style={[styles.exampleLabel, url === ex.url && styles.exampleLabelActive]}>{ex.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                !isValid && styles.submitBtnDisabled,
                pressed && isValid && styles.submitBtnPressed,
              ]}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Feather name="play" size={18} color={Colors.accentForeground} />
              <Text style={styles.submitText}>{tm.play}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
  container: { justifyContent: "flex-end" },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12, maxHeight: "90%" },
  handle: { width: 40, height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerRTL: { flexDirection: "row-reverse" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  field: { marginBottom: 16 },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  fieldHeaderRTL: { flexDirection: "row-reverse" },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  detectedType: { marginLeft: "auto" },
  detectedTypeRTL: { marginLeft: 0, marginRight: "auto" },
  input: { backgroundColor: Colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.text },
  inputActive: { backgroundColor: Colors.inputFocus },
  inputRTL: { textAlign: "right" },
  fieldHint: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  textRTL: { textAlign: "right" },
  advancedToggle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  advancedToggleRTL: { flexDirection: "row-reverse" },
  advancedLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textMuted },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, marginTop: 4 },
  examples: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  examplesRTL: { flexDirection: "row-reverse" },
  exampleChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: Colors.surfaceElevated, borderRadius: 8 },
  exampleChipPressed: { opacity: 0.7 },
  exampleChipActive: { backgroundColor: Colors.text },
  exampleLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  exampleLabelActive: { color: Colors.accentForeground },
  submitBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnPressed: { opacity: 0.85 },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.accentForeground },
});
