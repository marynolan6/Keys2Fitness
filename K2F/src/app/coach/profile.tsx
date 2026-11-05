import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { ThemedBackground } from "@/components/ThemedBackground";
import { colors, isCompactLayout, layout, radii, spacing, typography } from "@/theme";

export default function CoachProfile() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const compact = isCompactLayout(width, fontScale);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("First Last");
  const [email, setEmail] = useState("coach@example.com");
  const [specialty, setSpecialty] = useState("Strength and conditioning");
  const [bio, setBio] = useState("Helping clients build sustainable habits and confidence.");
  const [profileVisible, setProfileVisible] = useState(true);
  const [clientNotifications, setClientNotifications] = useState(true);

  const cancelEditing = () => {
    setEditing(false);
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await signOut(auth);
      router.replace("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  return (
    <ThemedBackground>
      <ScrollView style={styles.screen} contentContainerStyle={[styles.screenContent,
        { paddingTop: Math.max(useSafeAreaInsets().top + spacing.sm, spacing.xl), 
        paddingBottom: useSafeAreaInsets().bottom + 32 },]}>
        <View style={styles.content}>
          <Text style={styles.brand}>KEYS2FITNESS</Text>

          <View style={styles.titleRow}>
            <View accessibilityLabel="Coach profile photo placeholder" style={styles.avatar}>
              <Text style={styles.avatarText}>C</Text>
            </View>
            <Text adjustsFontSizeToFit minimumFontScale={0.65} numberOfLines={1} style={styles.title}>
              Coach profile
            </Text>
          </View>
          <Text style={styles.subtitle}>Manage how your profile appears to clients</Text>

          <View style={styles.profileCard}>
            <View style={[styles.cardHeader, compact && styles.compactColumn]}>
              <View style={styles.headerCopy}>
                <Text style={styles.cardTitle}>Profile information</Text>
                <Text style={styles.cardSummary}>Keep your coaching details current and personal.</Text>
              </View>
              {!editing && (
                <ActionButton label="Edit" onPress={() => setEditing(true)} />
              )}
            </View>

            {editing ? (
              <>
                <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
                <Field label="Email address" value={email} keyboardType="email-address" onChangeText={setEmail} />
                <Field label="Coaching specialty" value={specialty} onChangeText={setSpecialty} />
                <Field label="Bio" value={bio} multiline onChangeText={setBio} />

                <Text style={styles.preferenceHeading}>Profile customization</Text>
                <PreferenceRow
                  label="Visible to clients"
                  description="Allow assigned clients to view your coach profile."
                  value={profileVisible}
                  onValueChange={setProfileVisible}
                />
                <PreferenceRow
                  label="Client notifications"
                  description="Receive notifications about client activity and messages."
                  value={clientNotifications}
                  onValueChange={setClientNotifications}
                />

                <View style={[styles.actionRow, compact && styles.compactColumn]}>
                  <ActionButton label="Cancel" secondary onPress={cancelEditing} />
                  <ActionButton label="Save changes" onPress={() => setEditing(false)} />
                </View>
              </>
            ) : (
              <>
                <ProfileValue label="Display name" value={displayName} />
                <ProfileValue label="Email" value={email} />
                <ProfileValue label="Specialty" value={specialty} />
                <ProfileValue label="Bio" value={bio} />
                <Text style={styles.preferenceHeading}>Profile customization</Text>
                <ProfileValue label="Client visibility" value={profileVisible ? "Visible" : "Hidden"} />
                <ProfileValue label="Client notifications" value={clientNotifications ? "On" : "Off"} />
              </>
            )}
          </View>

          <View style={styles.linksCard}>
            <Text style={styles.cardTitle}>Account</Text>
            <Text style={styles.cardSummary}>Update app preferences and account details.</Text>
            { /* change later to pop up screen with preferences/settings*/ }
            <ProfileLink label="Preferences" description="Notifications, appearance, and app behavior" onPress={() => router.push("/coach/subscreens/preferences")} />
            <ProfileLink label="Account settings" description="Password, email, and account security" onPress={() => router.push("/coach/subscreens/settings")} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            disabled={loggingOut}
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
              loggingOut && styles.disabledButton,
            ]}
          >
            <Text style={styles.logoutButtonText}>
              {loggingOut ? "Logging out..." : "Log out"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedBackground>
  );
}

function Field({ label, value, multiline = false, keyboardType = "default", onChangeText }: { label: string; value: string; multiline?: boolean; keyboardType?: "default" | "email-address"; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

function PreferenceRow({ label, description, value, onValueChange }: { label: string; description: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} />
    </View>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return <View style={styles.value}><Text style={styles.valueLabel}>{label}</Text><Text style={styles.valueText}>{value}</Text></View>;
}

function ProfileLink({ label, description, onPress }: { label: string; description: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.profileLink, pressed && styles.pressed]}>
      <View style={styles.preferenceCopy}><Text style={styles.preferenceLabel}>{label}</Text><Text style={styles.preferenceDescription}>{description}</Text></View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function ActionButton({ label, secondary = false, onPress }: { label: string; secondary?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionButton, secondary && styles.actionButtonSecondary, pressed && styles.pressed]}><Text style={[styles.actionButtonText, secondary && styles.actionButtonTextSecondary]}>{label}</Text></Pressable>;
}

const avatarSize = layout.minTouchTarget + spacing.md;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  content: { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" },
  brand: { color: colors.primaryDark, fontSize: typography.label, fontWeight: "700", letterSpacing: 1 },
  titleRow: { alignItems: "center", justifyContent: "center", marginTop: spacing.xl, minHeight: avatarSize, position: "relative" },
  title: { color: colors.text, fontSize: typography.title, fontWeight: "300", paddingHorizontal: avatarSize + spacing.md, textAlign: "center" },
  avatar: { alignItems: "center", backgroundColor: colors.primaryDark, borderRadius: avatarSize / 2, height: avatarSize, justifyContent: "center", left: 0, position: "absolute", width: avatarSize },
  avatarText: { color: colors.surface, fontSize: typography.body, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: typography.body, fontWeight: "700", marginBottom: spacing.lg, marginTop: spacing.xs },
  profileCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, padding: spacing.lg },
  linksCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, marginTop: spacing.md, padding: spacing.lg },
  cardHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  compactColumn: { alignItems: "stretch", flexDirection: "column" },
  headerCopy: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: typography.heading, fontWeight: "300" },
  cardSummary: { color: colors.textMuted, fontSize: typography.label, marginTop: spacing.xs },
  field: { marginTop: spacing.md },
  fieldLabel: { color: colors.text, fontSize: typography.label, fontWeight: "700", marginBottom: spacing.xs },
  input: { borderColor: colors.border, borderRadius: radii.control, borderWidth: 1, color: colors.text, fontSize: typography.body, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md },
  multilineInput: { minHeight: 88, paddingTop: spacing.md, textAlignVertical: "top" },
  preferenceHeading: { color: colors.text, fontSize: typography.body, fontWeight: "700", marginTop: spacing.lg },
  preferenceRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.md, justifyContent: "space-between", marginTop: spacing.md, paddingTop: spacing.md },
  preferenceCopy: { flex: 1 },
  preferenceLabel: { color: colors.text, fontSize: typography.body, fontWeight: "700" },
  preferenceDescription: { color: colors.textMuted, fontSize: typography.label, marginTop: spacing.xs },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  actionButton: { alignItems: "center", backgroundColor: colors.primaryDark, borderRadius: radii.button, justifyContent: "center", minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md },
  actionButtonSecondary: { backgroundColor: colors.surfaceMuted },
  actionButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: "700" },
  actionButtonTextSecondary: { color: colors.primaryDark },
  value: { marginTop: spacing.md },
  valueLabel: { color: colors.textMuted, fontSize: typography.label },
  valueText: { color: colors.text, fontSize: typography.body, fontWeight: "700", marginTop: spacing.xs },
  profileLink: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.md },
  chevron: { color: colors.primaryDark, fontSize: 30, lineHeight: 30 },
  pressed: { opacity: 0.75 },
  logoutButton: {
    alignItems: "center",
    borderColor: colors.danger,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    backgroundColor: "#ffff"
  },

  logoutButtonText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },
});
