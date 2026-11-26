import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClientAvatar } from "@/components/ClientAvatar";
import { PageTitle, SectionMasthead } from "@/components/K2FBrand";
import { ThemedBackground } from "@/components/ThemedBackground";
import { colors, layout, radii, spacing, textStyles } from "@/theme";
import { formatVideoDate, type VideoSubmission } from "@/videoReviews/videoReview";
import { useVideoReviewQueue } from "@/videoReviews/videoReviewStore";

// K2F-265: coach-facing list of client videos, waiting ones first
export default function VideoReviewQueue() {
  const insets = useSafeAreaInsets();
  const { pending, reviewed } = useVideoReviewQueue();

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl }]}>
        <SectionMasthead coach onBack={() => router.canGoBack() ? router.back() : router.replace("/coach")} />

        <PageTitle>Video reviews</PageTitle>
        <Text style={textStyles.meta}>Form checks are ordered by time waiting.</Text>

        <Text accessibilityRole="header" style={styles.sectionTitle}>Awaiting review ({pending.length})</Text>
        {pending.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No videos waiting for review.</Text>
          </View>
        ) : (
          <View style={styles.list}>{pending.map((video) => <VideoRow key={video.id} video={video} />)}</View>
        )}

        {/* Reviewed videos stay visible below, marked so they don't read as new */}
        {reviewed.length > 0 && (
          <>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Reviewed ({reviewed.length})</Text>
            <View style={styles.list}>{reviewed.map((video) => <VideoRow key={video.id} video={video} />)}</View>
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
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ClientAvatar name={video.clientName} />
      <View style={styles.cardText}>
        <Text style={textStyles.label}>{video.exerciseName}</Text>
        <Text style={textStyles.body}>{video.clientName}</Text>
        <Text style={textStyles.meta}>{isPending ? `Submitted ${date}` : `Reviewed ${date}`}</Text>
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
  list: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, overflow: "hidden" },
  sectionTitle: textStyles.section,
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: layout.minTouchTarget,
    padding: spacing.md,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  emptyText: textStyles.meta,
});
