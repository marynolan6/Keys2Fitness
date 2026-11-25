import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClientAvatar } from "@/components/ClientAvatar";
import { K2FBrand } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { colors, layout, radii, spacing, typography } from "@/theme";
import { formatVideoDate, splitByStatus, type VideoSubmission } from "@/videoReviews/videoReview";
import { useVideoSubmissions } from "@/videoReviews/videoReviewStore";

// K2F-265: coach-facing list of client videos, waiting ones first
export default function VideoReviewQueue() {
  const insets = useSafeAreaInsets();
  const { pending, reviewed } = splitByStatus(useVideoSubmissions());

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/coach"))}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <K2FBrand coach />
        <Text accessibilityRole="header" style={styles.heading}>Video reviews</Text>
        <Text style={styles.subtitle}>
          {pending.length === 0
            ? "You're all caught up."
            : `${pending.length} ${pending.length === 1 ? "video is" : "videos are"} waiting for your feedback.`}
        </Text>

        <Text accessibilityRole="header" style={styles.sectionTitle}>Awaiting review ({pending.length})</Text>
        {pending.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No videos waiting for review.</Text>
          </View>
        ) : (
          pending.map((video) => <VideoRow key={video.id} video={video} />)
        )}

        {/* Reviewed videos stay visible below, marked so they don't read as new */}
        {reviewed.length > 0 && (
          <>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Reviewed ({reviewed.length})</Text>
            {reviewed.map((video) => <VideoRow key={video.id} video={video} />)}
          </>
        )}
      </ScrollView>
    </ThemedBackground>
  );
}

function VideoRow({ video }: { video: VideoSubmission }) {
  const isPending = video.status === "pending";
  const date = formatVideoDate(isPending ? video.submittedAt : video.reviewedAt ?? video.submittedAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${video.clientName}, ${video.exerciseName}, ${isPending ? `awaiting review, submitted ${date}` : `reviewed ${date}`}`}
      accessibilityHint={isPending ? "Opens the video to review" : "Opens the video and your feedback"}
      onPress={() => router.push({ pathname: "/coach-videos/[videoId]", params: { videoId: video.id } })}
      style={({ pressed }) => [styles.card, !isPending && styles.reviewedCard, pressed && styles.pressed]}
    >
      <ClientAvatar name={video.clientName} />
      <View style={styles.cardText}>
        <Text style={styles.clientName}>{video.clientName}</Text>
        <Text style={styles.exercise}>{video.exerciseName}</Text>
        <Text style={styles.detail}>{isPending ? `Submitted ${date}` : `Reviewed ${date}`}</Text>
        {isPending && video.clientNote ? <Text style={styles.note}>&quot;{video.clientNote}&quot;</Text> : null}
        <View style={[styles.badge, isPending ? styles.pendingBadge : styles.reviewedBadge]}>
          {!isPending && (
            <SymbolView name={{ ios: "checkmark", android: "check", web: "check" }} size={spacing.md} tintColor={colors.achieved} />
          )}
          <Text style={[styles.badgeText, isPending ? styles.pendingBadgeText : styles.reviewedBadgeText]}>
            {isPending ? "Awaiting review" : "Reviewed"}
          </Text>
        </View>
      </View>
      <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={spacing.md} tintColor={colors.primaryDark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    minWidth: layout.minTouchTarget,
  },
  backText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "600",
  },
  heading: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "300",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: layout.minTouchTarget,
    padding: spacing.md,
  },
  reviewedCard: {
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.7,
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
  },
  clientName: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "700",
  },
  exercise: {
    color: colors.text,
    fontSize: typography.body,
  },
  detail: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  note: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontStyle: "italic",
  },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.control,
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pendingBadge: {
    backgroundColor: colors.surfaceMuted,
  },
  reviewedBadge: {
    backgroundColor: colors.achievedMuted,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: "700",
  },
  pendingBadgeText: {
    color: colors.primaryDark,
  },
  reviewedBadgeText: {
    color: colors.achieved,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
});
