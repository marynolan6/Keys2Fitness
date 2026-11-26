import { useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ActionButton } from "./ActionButton";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import type { CheckIn } from "@/checkins/checkIn";
import { buildWeightChart, rangeLabel, weightRanges, type WeightPlot, type WeightRange } from "@/checkins/weightChart";
import { formatMeasurement, formatShortGoalDate, formatSignedMeasurement } from "@/goals/goal";
import { colors, isCompactLayout, layout, radii, spacing, textStyles, typography } from "@/theme";

const dateLabel = (date: string, year = false) => `${formatShortGoalDate(date)}${year ? `, ${date.slice(0, 4)}` : ""}`;
const weightLabel = (kg: number) => formatMeasurement(kg, "kg");

export function WeightProgressChart({ checkIns, through }: { checkIns: readonly CheckIn[]; through: string }) {
  const [range, setRange] = useState<WeightRange>(30);
  const chart = useMemo(() => buildWeightChart(checkIns, range, through), [checkIns, range, through]);
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
        return <ActionButton key={option} label={rangeLabel(option)} selected={selected} style={styles.control}
          accessibilityLabel={`${rangeLabel(option)} weight chart`} onPress={() => setRange(option)} />;
      })}
    </View>
    {chart.kind === "empty" ? <Text accessibilityLiveRegion="polite" style={styles.notice}>
      {chart.hasEarlier ? "No weight check-ins in this range. Choose All time to see earlier readings."
        : "No check-in weights yet. Your first weigh-in will appear here."}
    </Text> : <WeightPlotView key={range} chart={chart} />}
  </View>;
}

function WeightPlotView({ chart }: { chart: WeightPlot }) {
  const [width, setWidth] = useState(0);
  const [visibleReadings, setVisibleReadings] = useState(0);
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
  const change = chart.kind === "line" ? formatSignedMeasurement(latest.weightKg - first.weightKg, "kg") : null;

  return <>
    <View style={styles.stats}>
      <View style={styles.group}>
        <Text style={styles.caption}>Latest check-in</Text>
        <Text style={styles.value}>{weightLabel(latest.weightKg)}</Text>
      </View>
      {chart.kind === "line" && <View style={styles.group}>
        <Text style={styles.caption}>Change in range</Text>
        <Text style={styles.value}>{change}</Text>
      </View>}
    </View>
    <View accessible accessibilityRole="image" accessibilityLabel={`Weight by check-in date. Latest: ${weightLabel(latest.weightKg)} on ${dateLabel(latest.date, true)}.${change ? ` Change: ${change}.` : ""}`}>
      <Text style={styles.axisTitle}>Weight (lb)</Text>
      <View style={styles.plotRow}>
        <View style={[styles.scale, { height }]}>
          {ticks.map((kg, index) => <Text key={index} style={styles.axisLabel}>{weightLabel(kg)}</Text>)}
        </View>
        <View style={styles.plotColumn} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          <View style={{ height }}>
            {width > 2 * radius && <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {ticks.map((_, i) => <Line key={i} x1={x(0)} x2={x(1)} y1={y(i / 2)} y2={y(i / 2)} stroke={colors.border} />)}
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
    </View>
    <Text accessibilityLiveRegion="polite" style={chart.kind === "line" ? styles.caption : styles.notice}>
      {chart.kind === "single" ? `One check-in: ${dateLabel(latest.date, true)}. A second date is needed to show a trend.`
        : chart.kind === "same-day" ? `${chart.points.length} check-ins on ${dateLabel(latest.date, true)}. A second date is needed to show a trend.`
         : `${chart.points.length} check-ins in this range`}
    </Text>
    <ActionButton secondary expanded={visibleReadings > 0} label={visibleReadings ? "Hide readings" : "Show readings"}
      onPress={() => setVisibleReadings(visibleReadings ? 0 : 10)} />
    {visibleReadings > 0 && <>
      {chart.points.slice(-visibleReadings).reverse().map((point) => <View key={point.id} accessible
        accessibilityLabel={`${dateLabel(point.date, true)}, ${weightLabel(point.weightKg)}`} style={styles.reading}>
        <Text style={textStyles.meta}>{dateLabel(point.date, true)}</Text><Text style={textStyles.label}>{weightLabel(point.weightKg)}</Text>
      </View>)}
      {visibleReadings < chart.points.length && <ActionButton secondary label="Show older readings" onPress={() => setVisibleReadings((n) => n + 10)} />}
    </>}
  </>;
}

const styles = StyleSheet.create({
  card: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center", padding: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radii.card, gap: spacing.md, marginVertical: spacing.md },
  compactCard: { padding: spacing.md },
  group: { gap: spacing.xs },
  title: textStyles.section,
  caption: { color: colors.textMuted, fontSize: typography.label },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stacked: { flexDirection: "column" },
  control: { flexGrow: 1, paddingHorizontal: spacing.sm },
  reading: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm,
    paddingTop: spacing.sm, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, columnGap: spacing.xl },
  value: textStyles.metric,
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
});
