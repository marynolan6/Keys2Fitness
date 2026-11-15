import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { exerciseKey } from "@/workouts/coachTips";
import { getExerciseVideo, type ExerciseVideo } from "@/workouts/exerciseVideos";
import { colors, layout, radii, spacing, typography } from "@/theme";

// K2F-110: demonstration video for the exercise open in the details modal
// K2F-279: a calm "no video" card instead of a broken player
export function ExerciseVideoSection({ exerciseName }: { exerciseName: string }) {
  const video = getExerciseVideo(exerciseKey(exerciseName));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Demonstration</Text>
      {video
        // key makes a fresh player if the exercise changes while the modal is open
        ? <VideoCard key={video.uri + exerciseName} exerciseName={exerciseName} video={video} />
        : <UnavailableCard message="No demonstration video for this exercise yet." />}
    </View>
  );
}

function VideoCard({ exerciseName, video }: { exerciseName: string; video: ExerciseVideo }) {
  // No autoplay, the client starts it with the play button.
  // The player is released when the modal closes, so nothing keeps playing behind the workout.
  const player = useVideoPlayer(video.uri);
  const { status } = useEvent(player, "statusChange", { status: player.status });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  // Our own button so playback doesn't depend on the native controls showing up
  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
      return;
    }
    // Start over once the clip has finished
    if (player.duration > 0 && player.currentTime >= player.duration - 0.1) player.replay();
    player.play();
  };

  if (status === "error") {
    return <UnavailableCard message="The video couldn't load. Check your connection and try again later." />;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>VIDEO · {exerciseName.toUpperCase()}</Text>
      <VideoView
        accessibilityLabel={`Demonstration video for ${exerciseName}`}
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
        nativeControls
        player={player}
        style={styles.video}
      />
      <Pressable
        accessibilityLabel={`${isPlaying ? "Pause" : "Play"} demonstration video for ${exerciseName}`}
        accessibilityRole="button"
        disabled={status !== "readyToPlay"}
        onPress={togglePlayback}
        style={({ pressed }) => [styles.playButton, status !== "readyToPlay" && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.playButtonText}>{isPlaying ? "Pause video" : "Play video"}</Text>
      </Pressable>
      {/* Slow or no internet leaves the player black, so say what's happening */}
      {status === "loading" && <Text style={styles.caption}>Loading video...</Text>}
      {video.isSample && (
        <Text style={styles.caption}>Sample clip for the prototype. The real demonstration is coming soon.</Text>
      )}
    </View>
  );
}

function UnavailableCard({ message }: { message: string }) {
  return (
    <View accessibilityRole="text" style={styles.unavailable}>
      <Text style={styles.unavailableText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.button,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
  },
  // Width follows the modal, height follows the 16:9 shape, so it fits any phone
  video: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.text,
    borderRadius: radii.control,
    overflow: "hidden",
    width: "100%",
  },
  playButton: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.button,
    justifyContent: "center",
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
  },
  playButtonText: {
    color: colors.surface,
    fontSize: typography.label,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  caption: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  unavailable: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.button,
    padding: spacing.md,
  },
  unavailableText: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontStyle: "italic",
    lineHeight: typography.bodyLineHeight,
  },
});
