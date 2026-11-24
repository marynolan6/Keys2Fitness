import { useLocalSearchParams, router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";

import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { getPendingVideos, type MockVideo } from "@/videos/mockVideos";

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

  const pendingVideo = getPendingVideos().find(
    (video) => video.clientId === clientId,
  );
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
          {pendingVideo && <PendingVideoCard video={pendingVideo} />}
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
function PendingVideoCard({ video }: { video: MockVideo }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Uploaded Form Checks</Text>

        <View style={styles.videoSummary}>
          <Text style={styles.videoIcon}>🎥</Text>

          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>{video.workoutName}</Text>
            <Text style={styles.description}>
              Uploaded {formatVideoTimestamp(video.createdAt)} · Awaiting your review
            </Text>
          </View>
        </View>

        <BuilderButton label="Review Form-Check Video" secondary onPress={() => setShowVideo(true)} />
      </View>

      {showVideo && (
        <VideoModal
          video={video}
          onClose={() => setShowVideo(false)}
        />
      )}
    </>
  );
}

function VideoModal({
  video,
  onClose,
}: {
  video: MockVideo;
  onClose: () => void;
}) {
  const player = useVideoPlayer(video.videoUri);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.sectionTitle}>{video.workoutName}</Text>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <VideoView
            player={player}
            nativeControls
            contentFit="contain"
            style={styles.video}
          />
        </View>
      </View>
    </Modal>
  );
}

function formatVideoTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} · ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
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

  videoSummary: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },

  videoIcon: {
    color: colors.primary,
    fontSize: 24,
  },

  videoInfo: {
    flex: 1,
  },

  videoTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },

  modalOverlay: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },

  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    gap: spacing.md,
    padding: spacing.lg,
  },

  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  closeText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },

  video: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.text,
    borderRadius: radii.control,
    width: "100%",
  },
});
