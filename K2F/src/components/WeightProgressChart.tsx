import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import type { CheckIn } from "@/checkins/checkIn";
import { buildWeightChart, rangeLabel, weightRanges, type WeightPlot, type WeightRange } from "@/checkins/weightChart";
import { formatMeasurement, formatShortGoalDate, formatSignedMeasurement, type FitnessGoal } from "@/goals/goal";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

const dateLabel = (date: string, year = false) => `${formatShortGoalDate(date)}${year ? `, ${date.slice(0, 4)}` : ""}`;
const weightLabel = (kg: number) => formatMeasurement(kg, "kg");

type WeightProgressChartProps = {
  checkIns: readonly CheckIn[];
  through: string;
  // An active weight goal, drawn as a target line.
  goal?: FitnessGoal;
};

export function WeightProgressChart({ checkIns, through, goal }: WeightProgressChartProps) {
  const [range, setRange] = useState<WeightRange>(30);
  const targetKg = goal?.targetValue;
  const chart = useMemo(() => buildWeightChart(checkIns, range, through, targetKg), [checkIns, range, through, targetKg]);
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);

  return <View style={[styles.card, compact && styles.compactCard]}>
    <View style={styles.group}>
      <Text style={styles.title} accessibilityRole="header">Weight over time</Text>
      <Text style={styles.caption}>Sample check-ins · Ranges end {dateLabel(through, true)}</Text>
    </View>
    <View style={[styles.controls, compact && fontScale >= layout.largeFontScale && styles.stacked]}>
      {weightRanges.map((option) => {
        const selected = range === option;
        return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected }}
          accessibilityLabel={`${rangeLabel(option)} weight chart`} onPress={() => setRange(option)}
          style={({ pressed }) => [styles.control, selected && styles.selected, pressed && (selected ? styles.selectedPressed : styles.pressed)]}>
          <Text style={[styles.controlText, selected && styles.selectedText]}>{rangeLabel(option)}</Text>
        </Pressable>;
      })}
    </View>
    {chart.kind === "empty" ? <Text accessibilityLiveRegion="polite" style={styles.notice}>
      {chart.hasEarlier ? "No weight check-ins in this range. Choose All time to see earlier readings."
        : "No check-in weights yet. Your first weigh-in will appear here."}
    </Text> : <WeightPlotView chart={chart} goal={goal} />}
  </View>;
}

function WeightPlotView({ chart, goal }: { chart: WeightPlot; goal?: FitnessGoal }) {
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const first = chart.points[0];
  const latest = chart.points[chart.points.length - 1];
  const radius = spacing.xs;
  const inset = spacing.sm * fontScale;
  const height = spacing.xl * 4 + 2 * inset;
  const x = (fraction: number) => radius + fraction * (width - 2 * radius);
  const y = (fraction: number) => inset + fraction * (height - 2 * inset);
  const crossYear = chart.startDate.slice(0, 4) !== chart.endDate.slice(0, 4);
  const singleDate = chart.startDate === chart.endDate;
  const ticks = [chart.highKg, (chart.highKg + chart.lowKg) / 2, chart.lowKg];
  const targetY = goal ? chart.targetY : undefined;
  const goalText = goal && targetY !== undefined
    ? `Goal ${weightLabel(goal.targetValue)} by ${dateLabel(goal.targetDate, true)}`
    : undefined;
  const description = [
    chart.points.map((point) => `${dateLabel(point.date, true)}: ${weightLabel(point.weightKg)}`).join("; "),
    goalText,
  ].filter(Boolean).join(". ");

  return <>
    <View style={styles.stats}>
      <View style={styles.group}>
        <Text style={styles.caption}>Latest check-in</Text>
        <Text style={styles.value}>{weightLabel(latest.weightKg)}</Text>
      </View>
      {chart.kind === "line" && <View style={styles.group}>
        <Text style={styles.caption}>Change in range</Text>
        <Text style={styles.value}>{formatSignedMeasurement(latest.weightKg - first.weightKg, "kg")}</Text>
      </View>}
    </View>
    <View accessible accessibilityRole="image" accessibilityLabel={`Weight in pounds by check-in date. ${description}`}>
      <Text style={styles.axisTitle}>Weight (lb)</Text>
      <View style={styles.plotRow}>
        <View style={[styles.scale, { height }]}>
          {ticks.map((kg, index) => <Text key={index} style={styles.axisLabel}>{weightLabel(kg)}</Text>)}
        </View>
        <View style={styles.plotColumn} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          <View style={{ height }}>
            {width > 2 * radius && <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {ticks.map((_, i) => <Line key={i} x1={x(0)} x2={x(1)} y1={y(i / 2)} y2={y(i / 2)} stroke={colors.border} />)}
              {/* Drawn before the weight line and points so it never covers them. */}
              {targetY !== undefined && <Line x1={x(0)} x2={x(1)} y1={y(targetY)} y2={y(targetY)}
                stroke={colors.achieved} strokeWidth={2} strokeDasharray="6 4" />}
              {chart.kind === "line" && <Polyline points={chart.points.map((p) => `${x(p.x)},${y(p.y)}`).join(" ")}
                fill="none" stroke={colors.primaryDark} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />}
              {chart.points.map((p) => <Circle key={p.id} cx={x(p.x)} cy={y(p.y)} r={radius} fill={colors.primaryDeep} />)}
            </Svg>}
          </View>
          <View style={[styles.dates, singleDate && styles.centered]}>
            <Text style={styles.axisLabel}>{dateLabel(chart.startDate, crossYear)}</Text>
            {!singleDate && <Text style={[styles.axisLabel, styles.endDate]}>{dateLabel(chart.endDate, crossYear)}</Text>}
          </View>
          <Text style={[styles.axisTitle, styles.dateTitle]}>Check-in date</Text>
        </View>
      </View>
      {goalText && <View style={styles.legend}>
        <View style={styles.legendSwatch} />
        <Text style={styles.legendText}>{goalText}</Text>
      </View>}
    </View>
    <Text accessibilityLiveRegion="polite" style={chart.kind === "line" ? styles.caption : styles.notice}>
      {chart.kind === "single" ? `One check-in: ${dateLabel(latest.date, true)}. A second date is needed to show a trend.`
        : chart.kind === "same-day" ? `${chart.points.length} check-ins on ${dateLabel(latest.date, true)}. A second date is needed to show a trend.`
          : `${chart.points.length} check-ins in this range`}
    </Text>
  </>;
}

const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", padding: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radii.card, gap: spacing.md, marginVertical: spacing.md },
  compactCard: { padding: spacing.md },
  group: { gap: spacing.xs },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: "500" },
  caption: { color: colors.textMuted, fontSize: typography.label },
  controls: { flexDirection: "row", gap: spacing.xs },
  stacked: { flexDirection: "column" },
  control: { flexGrow: 1, flexBasis: 0, minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget,
    justifyContent: "center", alignItems: "center", padding: spacing.sm, backgroundColor: colors.surfaceMuted, borderRadius: radii.control },
  selected: { backgroundColor: colors.primaryDark },
  pressed: { backgroundColor: colors.border },
  selectedPressed: { backgroundColor: colors.primaryDeep },
  controlText: { color: colors.primaryDeep, fontSize: typography.label, fontWeight: "600", textAlign: "center" },
  selectedText: { color: colors.surface },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, columnGap: spacing.xl },
  value: { color: colors.text, fontSize: typography.heading, fontWeight: "600" },
  notice: { color: colors.text, fontSize: typography.body, backgroundColor: colors.surfaceMuted, borderRadius: radii.control, padding: spacing.md },
  axisTitle: { color: colors.textMuted, fontSize: typography.caption, fontWeight: "600" },
  axisLabel: { color: colors.textMuted, fontSize: typography.caption, flexShrink: 1, fontVariant: ["tabular-nums"] },
  plotRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  scale: { justifyContent: "space-between", alignItems: "flex-end" },
  plotColumn: { flex: 1, minWidth: 0 },
  dates: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  centered: { justifyContent: "center" },
  endDate: { textAlign: "right" },
  dateTitle: { textAlign: "center", marginTop: spacing.xs },
  legend: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  legendSwatch: { width: spacing.lg, borderTopWidth: 2, borderStyle: "dashed", borderColor: colors.achieved },
  legendText: { color: colors.text, fontSize: typography.label, fontWeight: "600", flexShrink: 1 },
});
