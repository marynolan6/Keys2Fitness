import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type GoalAchievedBannerProps = {
  // e.g. "Reached October 20"
  detail?: string;
};

export function GoalAchievedBanner({ detail }: GoalAchievedBannerProps) {
  return (
    <View
      style={[styles.banner, styles.achievedBanner]}
      accessible
      accessibilityLabel={detail ? `Goal achieved. ${detail}` : "Goal achieved"}
    >
      <View style={styles.checkBadge}>
        <Text style={styles.checkMark}>✓</Text>
      </View>
      <View style={styles.bannerText}>
        <Text style={styles.achievedTitle}>Goal achieved</Text>
        {detail && <Text style={styles.achievedDetail}>{detail}</Text>}
      </View>
    </View>
  );
}

type GoalNoDataNoticeProps = {
  title: string;
  body: string;
};

export function GoalNoDataNotice({ title, body }: GoalNoDataNoticeProps) {
  return (
    <View style={[styles.banner, styles.noDataBanner]} accessible accessibilityLabel={`${title}. ${body}`}>
      <View style={styles.pendingBadge}>
        <View style={styles.pendingDot} />
      </View>
      <View style={styles.bannerText}>
        <Text style={styles.noDataTitle}>{title}</Text>
        <Text style={styles.noDataBody}>{body}</Text>
      </View>
    </View>
  );
}

const BADGE_SIZE = 28;

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    borderRadius: radii.control,
    flexDirection: "row",
    gap: spacing.sm + spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm + spacing.xs,
  },
  bannerText: {
    flex: 1,
  },
  achievedBanner: {
    backgroundColor: colors.achievedMuted,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: colors.achieved,
    borderRadius: BADGE_SIZE / 2,
    height: BADGE_SIZE,
    justifyContent: "center",
    width: BADGE_SIZE,
  },
  checkMark: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },
  achievedTitle: {
    color: colors.achieved,
    fontSize: typography.body,
    fontWeight: "700",
  },
  achievedDetail: {
    color: colors.text,
    fontSize: typography.label,
    marginTop: 2,
  },
  noDataBanner: {
    backgroundColor: colors.surfaceMuted,
  },
  pendingBadge: {
    alignItems: "center",
    borderColor: colors.primaryDark,
    borderRadius: BADGE_SIZE / 2,
    borderStyle: "dashed",
    borderWidth: 2,
    height: BADGE_SIZE,
    justifyContent: "center",
    width: BADGE_SIZE,
  },
  pendingDot: {
    backgroundColor: colors.primaryDark,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  noDataTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  noDataBody: {
    color: colors.textMuted,
    fontSize: typography.label,
    marginTop: 2,
  },
});
