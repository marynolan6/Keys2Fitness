import { StyleSheet, Text, View } from "react-native";

import { GoalNoDataNotice } from "@/components/GoalStatusBanner";
import { formatShortGoalDate } from "@/goals/goal";
import { buildStatItems, ClientStats, StatItem } from "@/profile/stats";
import { colors, radii, spacing, typography } from "@/theme";

type ProgressStatsSectionProps = {
  stats: ClientStats;
};

export function ProgressStatsSection({ stats }: ProgressStatsSectionProps) {
  const items = buildStatItems(stats, formatShortGoalDate);
  const nothingRecorded = items.every((item) => item.value === null);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.eyebrow}>PROGRESS</Text>
      <Text style={styles.cardTitle} accessibilityRole="header">
        Body & fitness statistics
      </Text>
      <Text style={styles.caption}>
        {stats.latestWeight
          ? `Most recent check-in: ${formatShortGoalDate(stats.latestWeight.date)}`
          : "No weigh-in recorded yet"}
      </Text>

      {nothingRecorded ? (
        <GoalNoDataNotice
          title="No statistics yet"
          body="Your stats will fill in as you and your coach record check-ins and workouts."
        />
      ) : (
        <View style={styles.grid}>
          {items.map((item) => (
            <StatTile key={item.label} item={item} />
          ))}
        </View>
      )}
    </View>
  );
}

function StatTile({ item }: { item: StatItem }) {
  const missing = item.value === null;
  const sublabel = missing ? "Not recorded" : item.detail;

  return (
    <View
      style={styles.tile}
      accessible
      accessibilityLabel={`${item.label}: ${missing ? "not recorded" : item.value}${
        item.detail && !missing ? `, ${item.detail}` : ""
      }`}
    >
      {/* Single line + shrink-to-fit so long values never push the grid out of shape. */}
      <Text style={[styles.value, missing && styles.valueMissing]} numberOfLines={1} adjustsFontSizeToFit>
        {missing ? "—" : item.value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {item.label}
      </Text>
      {/* Always rendered so tiles in a row keep the same height. */}
      <Text style={[styles.sublabel, missing && styles.sublabelMissing]} numberOfLines={1}>
        {sublabel ?? " "}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: "300",
    marginTop: spacing.xs,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.sm,
    rowGap: spacing.md,
  },
  tile: {
    paddingRight: spacing.sm,
    width: "33.33%",
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "300",
  },
  valueMissing: {
    color: colors.textMuted,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.label,
  },
  sublabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sublabelMissing: {
    fontStyle: "italic",
  },
});
