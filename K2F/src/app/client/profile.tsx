import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Image,
  useWindowDimensions,
} from "react-native";

import { CheckInHistory } from "@/components/CheckInHistory";
import { ProgressEmptyState } from "@/components/ProgressEmptyState";
import { ProgressStatsSection } from "@/components/ProgressStatsSection";
import { ThemedBackground } from "@/components/ThemedBackground";
import { mockCheckIns } from "@/checkins/mockCheckIns";
import { mockClientStats } from "@/profile/mockStats";
import { ClientStats, hasRecordedProgress } from "@/profile/stats";
import { centimetersToInches, defaultProfile, EditableProfile, formatHeightImperial, normalizeProfile, validateProfile } from "@/profile/profile";
import { loadProfile, saveProfile } from "@/profile/profileStorage";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

function describeProfileDetails(stats: ClientStats): string | undefined {
  const parts = [
    stats.heightCm !== null ? formatHeightImperial(centimetersToInches(stats.heightCm)) : null,
    stats.age !== null ? `${stats.age} years old` : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export default function Profile() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);
  const [profile, setProfile] = useState<EditableProfile>(defaultProfile);
  const [draft, setDraft] = useState<EditableProfile>(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>();
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile()
      .then((stored) => {
        setProfile(stored);
        setDraft(stored);
      })
      .catch(() => {
        setFeedback("We could not load your saved profile. Showing the default information.");
        setFeedbackIsError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateDraft = <K extends keyof EditableProfile>(field: K, value: EditableProfile[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setFeedback(undefined);
  };

  const updatePreference = (field: keyof EditableProfile["preferences"], value: boolean) => {
    setDraft((current) => ({
      ...current,
      preferences: { ...current.preferences, [field]: value },
    }));
    setFeedback(undefined);
  };

  const beginEditing = () => {
    setDraft(profile);
    setErrors({});
    setFeedback(undefined);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setErrors({});
    setFeedback(undefined);
    setEditing(false);
  };

  const handleSave = async () => {
    if (saving) return;

    const updated = normalizeProfile(draft);
    const validationErrors = validateProfile(updated);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFeedback("Please fix the highlighted fields before saving.");
      setFeedbackIsError(true);
      return;
    }

    try {
      setSaving(true);
      await saveProfile(updated);
      setProfile(updated);
      setDraft(updated);
      setEditing(false);
      setErrors({});
      setFeedback("Profile and preferences saved.");
      setFeedbackIsError(false);
    } catch {
      setFeedback("Your changes could not be saved. Your existing information is unchanged.");
      setFeedbackIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const hasProgress = hasRecordedProgress(mockClientStats) || mockCheckIns.length > 0;
  const stats = {
    ...mockClientStats,
    heightCm: mockClientStats.heightCm === null ? null : Number(profile.heightInches) * 2.54,
    age: mockClientStats.age === null ? null : Number(profile.age),
  };
  return (
    <ThemedBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <View style={styles.content}>
          <Text style={styles.brand}>KEYS2FITNESS</Text>
          <View style={styles.titleRow}>
            <View accessible accessibilityLabel="Profile photo placeholder" style={styles.avatar}>
              <Image accessibilityLabel="Piplup profile photo" source={require("../../../assets/images/piplup-profile.jpg")} style={styles.avatarImage} />
            </View>
            <Text adjustsFontSizeToFit minimumFontScale={0.65} numberOfLines={1} style={styles.title}>
              {profile.fullName}
            </Text>
          </View>
          <Text style={styles.subtitle}>View your information here</Text>

          <View style={styles.profileCard}>
            <View style={[styles.cardHeader, compact && styles.compactColumn]}>
              <View style={styles.headerCopy}>
                <Text style={styles.cardTitle}>Profile information</Text>
                <Text style={styles.cardSummary}>Keep your account details accurate and personal.</Text>
              </View>
              {!editing && !loading && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile and preferences"
                  onPress={beginEditing}
                  style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>
              )}
            </View>

            {loading ? (
              <Text style={styles.cardSummary}>Loading saved profile...</Text>
            ) : editing ? (
              <>
                <Field label="Full name" value={draft.fullName} error={errors.fullName} disabled={saving} onChangeText={(value) => updateDraft("fullName", value)} />
                <Field label="Email address" value={draft.email} error={errors.email} disabled={saving} keyboardType="email-address" onChangeText={(value) => updateDraft("email", value)} />
                <View style={[styles.fieldRow, compact && styles.compactColumn]}>
                  <View style={styles.fieldColumn}>
                    <Field label="Height (inches)" value={draft.heightInches} error={errors.heightInches} disabled={saving} keyboardType="numeric" onChangeText={(value) => updateDraft("heightInches", value)} />
                  </View>
                  <View style={styles.fieldColumn}>
                    <Field label="Age" value={draft.age} error={errors.age} disabled={saving} keyboardType="numeric" onChangeText={(value) => updateDraft("age", value)} />
                  </View>
                </View>

                <Text style={styles.preferenceHeading}>Account preferences</Text>
                <PreferenceRow label="Coach updates" description="Receive important messages from your coach." value={draft.preferences.coachUpdates} disabled={saving} onValueChange={(value) => updatePreference("coachUpdates", value)} />
                <PreferenceRow label="Weekly progress summary" description="Get a weekly reminder of your progress." value={draft.preferences.weeklySummary} disabled={saving} onValueChange={(value) => updatePreference("weeklySummary", value)} />

                {feedback && <Feedback message={feedback} isError={feedbackIsError} />}
                <View style={[styles.actionRow, compact && styles.compactColumn]}>
                  <ActionButton label="Cancel" secondary disabled={saving} onPress={cancelEditing} />
                  <ActionButton label={saving ? "Saving..." : "Save changes"} disabled={saving} onPress={handleSave} />
                </View>
              </>
            ) : (
              <>
                <ProfileValue label="Name" value={profile.fullName} />
                <ProfileValue label="Email" value={profile.email} />
                <View style={[styles.valueRow, compact && styles.compactColumn]}>
                  <View style={styles.valueColumn}><ProfileValue label="Height" value={formatHeightImperial(Number(profile.heightInches))} /></View>
                  <View style={styles.valueColumn}><ProfileValue label="Age" value={`${profile.age} years`} /></View>
                </View>
                <Text style={styles.preferenceHeading}>Preferences</Text>
                <ProfileValue label="Coach updates" value={profile.preferences.coachUpdates ? "On" : "Off"} />
                <ProfileValue label="Weekly progress summary" value={profile.preferences.weeklySummary ? "On" : "Off"} />
                {feedback && <Feedback message={feedback} isError={feedbackIsError} />}
              </>
            )}
          </View>

          {hasProgress ? (
            <>
              <View style={styles.section}>
                <ProgressStatsSection stats={stats} />
              </View>
              <View style={styles.section}><CheckInHistory checkIns={mockCheckIns} /></View>
            </>
          ) : (
            <View style={styles.section}>
              <ProgressEmptyState profileDetails={describeProfileDetails(stats)} onMessageCoach={() => router.push("/client/messages")} />
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/client/progress")}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>View Progress</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedBackground>
  );
}

function Field({ label, value, error, disabled = false, keyboardType = "default", onChangeText }: { label: string; value: string; error?: string; disabled?: boolean; keyboardType?: "default" | "email-address" | "numeric"; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        editable={!disabled}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        style={[styles.input, error && styles.inputError]}
        value={value}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function PreferenceRow({ label, description, value, disabled = false, onValueChange }: { label: string; description: string; value: boolean; disabled?: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}><Text style={styles.preferenceLabel}>{label}</Text><Text style={styles.preferenceDescription}>{description}</Text></View>
      <Switch accessibilityLabel={label} disabled={disabled} value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
    </View>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return <View style={styles.value}><Text style={styles.valueLabel}>{label}</Text><Text style={styles.valueText}>{value}</Text></View>;
}

function Feedback({ message, isError }: { message: string; isError: boolean }) {
  return <View style={[styles.feedback, isError ? styles.feedbackError : styles.feedbackSuccess]}><Text style={styles.feedbackText}>{message}</Text></View>;
}

function ActionButton({ label, secondary = false, disabled = false, onPress }: { label: string; secondary?: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, secondary && styles.actionButtonSecondary, disabled && styles.actionButtonDisabled, pressed && styles.pressed]}><Text style={[styles.actionButtonText, secondary && styles.actionButtonTextSecondary]}>{label}</Text></Pressable>;
}

const avatarSize = layout.minTouchTarget + spacing.md;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" },
  brand: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "700", letterSpacing: 1 },
  titleRow: { alignItems: "center", justifyContent: "center", marginTop: spacing.xl, minHeight: avatarSize, position: "relative" },
  title: { color: colors.text, fontSize: typography.title, fontWeight: "300", paddingHorizontal: avatarSize + spacing.md, textAlign: "center" },
  avatar: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: avatarSize / 2, borderWidth: 1, height: avatarSize, justifyContent: "center", left: 0, position: "absolute", width: avatarSize },
  avatarImage: { borderRadius: avatarSize / 2, height: "100%", width: "100%" },
  subtitle: { color: colors.textMuted, fontSize: typography.body, fontWeight: "700", marginBottom: spacing.lg, marginTop: spacing.xs },
  profileCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, padding: spacing.lg },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  compactColumn: { alignItems: "stretch", flexDirection: "column" },
  headerCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: typography.heading, fontWeight: "300" },
  cardSummary: { color: colors.textMuted, fontSize: typography.label, marginTop: spacing.xs },
  editButton: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radii.button, justifyContent: "center", minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget * 1.5, paddingHorizontal: spacing.md },
  editButtonText: { color: colors.primaryDark, fontSize: typography.body, fontWeight: "700" },
  field: { marginTop: spacing.md },
  fieldLabel: { color: colors.text, fontSize: typography.label, fontWeight: "700", marginBottom: spacing.xs },
  input: { borderColor: colors.border, borderRadius: radii.control, borderWidth: 1, color: colors.text, fontSize: typography.body, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: typography.label, marginTop: spacing.xs },
  fieldRow: { flexDirection: "row", gap: spacing.md },
  fieldColumn: { flex: 1 },
  preferenceHeading: { color: colors.text, fontSize: typography.body, fontWeight: "700", marginTop: spacing.lg },
  preferenceRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.md, justifyContent: "space-between", marginTop: spacing.md, paddingTop: spacing.md },
  preferenceCopy: { flex: 1 },
  preferenceLabel: { color: colors.text, fontSize: typography.body, fontWeight: "700" },
  preferenceDescription: { color: colors.textMuted, fontSize: typography.label, marginTop: spacing.xs },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  actionButton: { alignItems: "center", backgroundColor: colors.primaryDark, borderRadius: radii.button, flex: 1, justifyContent: "center", minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md },
  actionButtonSecondary: { backgroundColor: colors.surfaceMuted },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: "700" },
  actionButtonTextSecondary: { color: colors.primaryDark },
  feedback: { borderRadius: radii.control, marginTop: spacing.md, padding: spacing.md },
  feedbackError: { backgroundColor: colors.dangerMuted, borderColor: colors.danger, borderWidth: 1 },
  feedbackSuccess: { backgroundColor: colors.achievedMuted, borderColor: colors.achieved, borderWidth: 1 },
  feedbackText: { color: colors.text, fontSize: typography.label, fontWeight: "700" },
  value: { marginTop: spacing.md },
  valueRow: { flexDirection: "row", gap: spacing.md },
  valueColumn: { flex: 1 },
  valueLabel: { color: colors.textMuted, fontSize: typography.label },
  valueText: { color: colors.text, fontSize: typography.body, fontWeight: "700", marginTop: spacing.xs },
  section: { marginTop: spacing.md },
  secondaryButton: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radii.button, justifyContent: "center", marginTop: spacing.md, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md },
  secondaryButtonText: { color: colors.primaryDark, fontSize: typography.body, fontWeight: "700" },
  pressed: { opacity: 0.75 },
});
