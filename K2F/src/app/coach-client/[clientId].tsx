import { useLocalSearchParams, router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatVideoDate } from "@/videoReviews/videoReview";
import { useVideoReviewQueue } from "@/videoReviews/videoReviewStore";

import { colors, radii, spacing, typography, layout } from "@/theme";

import { ThemedBackground } from "@/components/ThemedBackground";
import { K2FBrand, PageTitle } from "@/components/K2FBrand";

import { getClientById } from "@/clients/mockClients";
import { ClientAvatar } from "@/components/ClientAvatar";
import { BuilderButton } from "@/components/WorkoutBuilderControls";

export default function ClientProfile() {
  const insets = useSafeAreaInsets();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const client = getClientById(clientId);

  const { pending, reviewed } = useVideoReviewQueue();
  const videos = [...pending, ...reviewed].filter((video) => video.clientId === clientId);
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/coach/client_list");
    }
  };

  // Sample schedule; completed workout history does not track scheduled workouts.
  const completedWorkouts = 8;
  const totalWorkouts = 10;
  const progressPercent = (completedWorkouts / totalWorkouts) * 100;

  return (
    <ThemedBackground>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      >
        <K2FBrand coach />
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        {!client ? <View style={[styles.card, styles.profileCard]}>
          <PageTitle style={styles.sectionTitle}>Client not found</PageTitle>
          <Text style={styles.description}>No client matches ID {clientId ?? "(none)"}.</Text>
        </View> : <>
          <PageTitle>Client Profile</PageTitle>
          <View style={[styles.card, styles.profileCard]}>
            <ClientAvatar name={client.name} size={64} />
            <Text style={styles.name}>{client.name}</Text>
            <Text style={styles.detail}>Client ID: {clientId}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Current Fitness Plan</Text>
            <Text style={styles.description}>{client.plan}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
            <Text style={styles.description}>{client.goal}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Recent Progress</Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.description}>Sample schedule: {completedWorkouts} of {totalWorkouts} workouts completed.</Text>
          </View>
          {videos.length > 0 && <View style={styles.card}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Uploaded Form Checks</Text>
            {videos.map((video) => <View key={video.id} style={styles.videoRow}>
              <Text style={styles.description}>{video.status === "pending" ? "Awaiting review" : "Reviewed"} · {formatVideoDate(video.reviewedAt ?? video.submittedAt)}</Text>
              <BuilderButton label={`${video.status === "pending" ? "Review" : "View feedback for"} ${video.exerciseName}`} secondary
                onPress={() => router.push({ pathname: "/coach-videos/[videoId]", params: { videoId: video.id } })} />
            </View>)}
          </View>}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Client Details</Text>
            <BuilderButton label="Nutrition targets and tips" secondary onPress={() => router.push({
              pathname: "/coach-client/[clientId]/nutrition", params: { clientId },
            })} />
            <BuilderButton label="View Workouts →" secondary onPress={() => router.push({
              pathname: "/coach-client/[clientId]/workouts", params: { clientId },
            })} />
            <BuilderButton label="View Progress →" secondary onPress={() => router.push({
              pathname: "/coach-client/[clientId]/progress", params: { clientId },
            })} />
          </View>
        </>}
      </ScrollView>
    </ThemedBackground>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  backButton: {
    minHeight: layout.minTouchTarget,
    justifyContent: "center",
  },

  back: {
    color: colors.primaryDark,
    fontSize: typography.body,
  },


  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },

  profileCard: {
    alignItems: "center",
  },

  name: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },

  detail: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },

  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  progressPercent: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },

  progressTrack: {
    height: 12,
    backgroundColor: colors.progressTrack,
    borderRadius: radii.control,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radii.control,
  },

  videoRow: { gap: spacing.xs },
});
