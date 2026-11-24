import { StyleSheet, Text, View } from "react-native";

import { UnavailableCard, VideoPlayerCard } from "@/components/VideoPlayerCard";
import { exerciseKey } from "@/workouts/coachTips";
import { getExerciseVideo } from "@/workouts/exerciseVideos";
import { colors, spacing, typography } from "@/theme";

// K2F-110: demonstration video for the exercise open in the details modal
// K2F-279: a calm "no video" card instead of a broken player
export function ExerciseVideoSection({ exerciseName }: { exerciseName: string }) {
  const video = getExerciseVideo(exerciseKey(exerciseName));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Demonstration</Text>
      {video ? (
        <VideoPlayerCard
          // key makes a fresh player if the exercise changes while the modal is open
          key={video.uri + exerciseName}
          uri={video.uri}
          eyebrow={`VIDEO · ${exerciseName.toUpperCase()}`}
          videoName={`demonstration video for ${exerciseName}`}
          caption={video.isSample ? "Sample clip for the prototype. The real demonstration is coming soon." : undefined}
        />
      ) : (
        <UnavailableCard message="No demonstration video for this exercise yet." />
      )}
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
});
