import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, layout, radii, spacing, typography } from "@/theme";

// Shared by the exercise demonstration video (K2F-71) and the coach video review (K2F-58)
type VideoPlayerCardProps = {
  uri: string;
  // Small label above the video, e.g. "VIDEO · BENCH PRESS"
  eyebrow: string;
  // What screen readers call the video, e.g. "demonstration video for Bench Press"
  videoName: string;
  caption?: string;
};

export function VideoPlayerCard({ uri, eyebrow, videoName, caption }: VideoPlayerCardProps) {
  // No autoplay, the user starts it with the play button.
  // The player is released when this card unmounts, so nothing keeps playing in the background.
  const player = useVideoPlayer(uri);
  const { status } = useEvent(player, "statusChange", { status: player.status });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  // Android reports "idle" once a clip ends, so only block the button while it loads
  const canPlay = status !== "loading";

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
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <VideoView
        accessibilityLabel={videoName}
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
        nativeControls
        player={player}
        style={styles.video}
      />
      <Pressable
        accessibilityLabel={`${isPlaying ? "Pause" : "Play"} ${videoName}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canPlay }}
        disabled={!canPlay}
        onPress={togglePlayback}
        style={({ pressed }) => [styles.playButton, !canPlay && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={styles.playButtonText}>{isPlaying ? "Pause video" : "Play video"}</Text>
      </Pressable>
      {/* Slow or no internet leaves the player black, so say what's happening */}
      {status === "loading" && <Text style={styles.caption}>Loading video...</Text>}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

export function UnavailableCard({ message }: { message: string }) {
  return (
    <View accessibilityRole="text" style={styles.unavailable}>
      <Text style={styles.unavailableText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  // Width follows the parent, height follows the 16:9 shape, so it fits any phone
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
