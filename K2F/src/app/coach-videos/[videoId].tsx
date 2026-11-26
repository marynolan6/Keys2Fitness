import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClientAvatar } from "@/components/ClientAvatar";
import { K2FBrand, PageTitle } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { VideoPlayerCard } from "@/components/VideoPlayerCard";
import { colors, layout, radii, spacing, typography } from "@/theme";
import { formatVideoDate, MAX_FEEDBACK_LENGTH, type ReviewError } from "@/videoReviews/videoReview";
import { submitVideoReview, useVideoSubmissions } from "@/videoReviews/videoReviewStore";

const errorMessages: Record<ReviewError, string> = {
  "empty-feedback": "Write some feedback before sending.",
  "already-reviewed": "This video was already reviewed.",
  "not-found": "This video is no longer available.",
};

// K2F-266: open and play one client video
// K2F-267: write feedback and mark it reviewed
export default function VideoReviewScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const video = useVideoSubmissions().find((item) => item.id === videoId);
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/coach-videos"));
  const canSend = feedback.trim().length > 0;

  const sendFeedback = () => {
    if (!video) return;
    const result = submitVideoReview(video.id, feedback);
    if (result.ok) {
      setError(null);
      setJustSent(true);
    } else {
      setError(errorMessages[result.error]);
    }
  };

  return (
    <ThemedBackground>
      {/* Keep the feedback box above the keyboard: Android shrinks the screen,
          iOS lets the ScrollView add room and scroll to the box */}
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "android" ? "height" : undefined}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to video reviews"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>Back to video reviews</Text>
          </Pressable>

          <K2FBrand coach />

          {!video ? (
            <>
              <PageTitle>Video not found</PageTitle>
              <View style={styles.card}>
                <Text style={styles.body}>It may have been removed. Go back to see the videos waiting for review.</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.clientRow}>
                <ClientAvatar name={video.clientName} />
                <View style={styles.clientText}>
                  <PageTitle>{video.exerciseName}</PageTitle>
                  <Text style={styles.body}>{video.clientName} · submitted {formatVideoDate(video.submittedAt)}</Text>
                </View>
              </View>

              <VideoPlayerCard
                uri={video.uri}
                eyebrow={`${video.clientName.toUpperCase()} · ${video.exerciseName.toUpperCase()}`}
                videoName={`${video.clientName}'s ${video.exerciseName} video`}
                caption={video.isSample ? "Sample clip for the prototype. Client uploads are coming soon." : undefined}
              />

              <View style={styles.card}>
                <Text style={styles.label}>Client note</Text>
                <Text style={styles.body}>{video.clientNote ?? "No note from the client."}</Text>
              </View>

              {video.status === "reviewed" ? (
                <View style={[styles.card, styles.reviewedCard]}>
                  {justSent && (
                    <Text accessibilityLiveRegion="polite" style={styles.sentText}>Feedback saved. Video marked as reviewed.</Text>
                  )}
                  <Text style={styles.label}>Your feedback</Text>
                  <Text style={styles.body}>{video.feedback}</Text>
                  {video.reviewedAt && <Text style={styles.caption}>Reviewed {formatVideoDate(video.reviewedAt)}</Text>}
                </View>
              ) : (
                <View style={styles.card}>
                  <Text nativeID="feedbackLabel" style={styles.label}>Feedback for {video.clientName}</Text>
                  <TextInput
                    accessibilityLabel={`Feedback for ${video.clientName}`}
                    accessibilityLabelledBy="feedbackLabel"
                    value={feedback}
                    onChangeText={(text) => {
                      setFeedback(text);
                      if (error) setError(null);
                    }}
                    placeholder="What looks good, and what should they fix?"
                    placeholderTextColor={colors.textMuted}
                    maxLength={MAX_FEEDBACK_LENGTH}
                    multiline
                    textAlignVertical="top"
                    style={styles.input}
                  />
                  {error && <Text accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text>}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Send feedback to ${video.clientName}`}
                    accessibilityState={{ disabled: !canSend }}
                    disabled={!canSend}
                    onPress={sendFeedback}
                    style={({ pressed }) => [styles.sendButton, !canSend && styles.disabled, pressed && styles.pressed]}
                  >
                    <Text style={styles.sendText}>Send feedback</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  backButton: {
    alignSelf: "flex-start",
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
  },
  backText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
  clientRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  clientText: {
    flex: 1,
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    gap: spacing.sm,
    padding: spacing.md,
  },
  reviewedCard: {
    backgroundColor: colors.achievedMuted,
  },
  label: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
  body: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  caption: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  sentText: {
    color: colors.achieved,
    fontSize: typography.body,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.control,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: layout.minTouchTarget * 2,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.label,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  sendText: {
    color: colors.surface,
    fontSize: typography.label,
    fontWeight: "700",
  },
});
