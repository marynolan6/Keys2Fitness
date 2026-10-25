import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { formatMeasurement } from "@/goals/goal";
import { colors, isCompactLayout, spacing, typography } from "@/theme";

const MARKER_SIZE = 16;

type GoalProgressBarProps = {
  // 0–1
  fraction: number;
  percent: number;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  // Colors the bar as complete.
  achieved?: boolean;
};

export function GoalProgressBar({
  fraction,
  percent,
  startValue,
  currentValue,
  targetValue,
  unit,
  achieved = false,
}: GoalProgressBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const current = formatMeasurement(currentValue, unit);
  const target = formatMeasurement(targetValue, unit);

  return (
    <View>
      <View
        style={styles.barArea}
        accessibilityRole="progressbar"
        accessibilityLabel={`Goal progress: ${current} now, target ${target}`}
        accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}% of goal reached` }}
      >
        <View style={styles.track}>
          <View
            style={[styles.fill, achieved && styles.achievedFill, { width: `${fraction * 100}%` }]}
          />
        </View>
        <View
          style={[
            styles.marker,
            styles.targetMarker,
            achieved && styles.targetMarkerAchieved,
            { left: "100%" },
          ]}
        />
        <View
          style={[
            styles.marker,
            styles.currentMarker,
            achieved && styles.achievedFill,
            { left: `${fraction * 100}%` },
          ]}
        />
      </View>

      <View style={[styles.legend, compact && styles.compactLegend]}>
        <Text style={styles.startText}>Start {formatMeasurement(startValue, unit)}</Text>
        <View style={styles.legendRight}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.currentSwatch, achieved && styles.achievedFill]} />
            <Text style={styles.currentText}>Now {current}</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendSwatch, styles.targetSwatch, achieved && styles.targetMarkerAchieved]}
            />
            <Text style={[styles.targetText, achieved && styles.achievedText]}>
              Target {target}
              {achieved ? " ✓" : ""}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Horizontal padding keeps the markers inside the card at 0% and 100%.
  barArea: {
    height: MARKER_SIZE,
    justifyContent: "center",
    marginHorizontal: MARKER_SIZE / 2,
    marginTop: spacing.md,
  },
  track: {
    backgroundColor: colors.progressTrack,
    borderRadius: 5,
    height: 10,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: colors.primary,
    height: "100%",
  },
  marker: {
    borderRadius: MARKER_SIZE / 2,
    height: MARKER_SIZE,
    marginLeft: -MARKER_SIZE / 2,
    position: "absolute",
    width: MARKER_SIZE,
  },
  currentMarker: {
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderWidth: 3,
  },
  targetMarker: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryDark,
    borderWidth: 3,
  },
  legend: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  compactLegend: { flexDirection: "column", gap: spacing.sm },
  legendRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  legendSwatch: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  currentSwatch: {
    backgroundColor: colors.primary,
  },
  targetSwatch: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryDark,
    borderWidth: 2,
  },
  startText: {
    color: colors.textMuted,
    fontSize: typography.label,
  },
  currentText: {
    color: colors.text,
    fontSize: typography.label,
    fontWeight: "700",
  },
  achievedFill: {
    backgroundColor: colors.achieved,
  },
  targetMarkerAchieved: {
    backgroundColor: colors.achieved,
    borderColor: colors.achieved,
  },
  achievedText: {
    color: colors.achieved,
  },
  targetText: {
    color: colors.primaryDark,
    fontSize: typography.label,
    fontWeight: "700",
  },
});
