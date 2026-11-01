import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { auth, db } from "@/lib/firebase";
import { colors, radii, spacing, typography } from "@/theme";
import { ThemedBackground } from "@/components/ThemedBackground";

const MAX_HISTORY = 5;
const TAB_BAR_CLEARANCE = 96;

type Goal = {
  title: string;
  startWeightLb: number;
  targetWeightLb: number;
  startDate: string;
};

type WeightEntry = { id: string; weightLb: number; date: string };

const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

const displayDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const displayWeight = (weight: number) => `${Number(weight.toFixed(1))} lb`;

const displayChange = (change: number) =>
  change === 0 ? "No change" : `${change > 0 ? "+" : "−"}${displayWeight(Math.abs(change))}`;

export default function Progress() {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [weight, setWeight] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [goalError, setGoalError] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      setAuthReady(true);

      if (user) {
        setError("");
      }
    });
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!userId) {
      setError("You must be logged in to view your progress.");
      setLoading(false);
      return;
    }

    const goalUnsubscribe = onSnapshot(
      doc(db, "users", userId, "goals", "current"),
      (snapshot) => {
        if (!snapshot.exists()) {
          setGoal(null);
        } else {
          const data = snapshot.data();
          setGoal({
            title: data.title ?? "Weight goal",
            startWeightLb: Number(data.startWeightLb),
            targetWeightLb: Number(data.targetWeightLb),
            startDate: data.startDate ?? localDate(),
          });
        }
        setLoading(false);
      },
      () => {
        setError("Unable to load your goal.");
        setLoading(false);
      },
    );

    const entriesUnsubscribe = onSnapshot(
      query(
        collection(db, "users", userId, "weightEntries"),
        orderBy("date", "desc"),
        limit(MAX_HISTORY),
      ),
      (snapshot) =>
        setEntries(
          snapshot.docs.map((item) => ({
            id: item.id,
            weightLb: Number(item.data().weightLb),
            date: item.data().date,
          })),
        ),
      () => setError("Unable to load your weight history."),
    );

    return () => {
      goalUnsubscribe();
      entriesUnsubscribe();
    };
  }, [authReady, userId]);

  const currentWeight = entries[0]?.weightLb ?? goal?.startWeightLb;
  const progress = useMemo(() => {
    if (!goal || currentWeight === undefined) return null;
    const lossGoal = goal.targetWeightLb < goal.startWeightLb;
    const total = Math.abs(goal.targetWeightLb - goal.startWeightLb);
    const completed = lossGoal
      ? goal.startWeightLb - currentWeight
      : currentWeight - goal.startWeightLb;
    const remaining = lossGoal
      ? currentWeight - goal.targetWeightLb
      : goal.targetWeightLb - currentWeight;
    const percent = total === 0 ? 100 : Math.round(Math.max(0, Math.min(1, completed / total)) * 100);
    const achieved = lossGoal ? currentWeight <= goal.targetWeightLb : currentWeight >= goal.targetWeightLb;
    return { percent, remaining: Math.max(0, remaining), achieved };
  }, [currentWeight, goal]);

const saveWeight = async () => {
  const signedInUser = auth.currentUser;
  const weightLb = Number(weight.trim());

  if (!signedInUser) {
    setFormError("You must be logged in to save a measurement.");
    return;
  }

  if (!Number.isFinite(weightLb) || weightLb <= 0 || weightLb > 1000) {
    setFormError("Enter a valid weight between 1 and 1,000 lb.");
    return;
  }

  try {
    setSaving(true);

    await addDoc(
      collection(db, "users", signedInUser.uid, "weightEntries"),
      {
        weightLb,
        unit: "lb",
        date: localDate(),
        recordedAt: serverTimestamp(),
      },
    );

    setWeight("");
    setFormError("");
    setAdding(false);
  } catch {
    setFormError("Unable to save your measurement. Please try again.");
  } finally {
    setSaving(false);
  }
};

  const openGoalForm = () => {
    setGoalTitle(goal?.title ?? "Reach my target weight");
    setStartingWeight(String(goal?.startWeightLb ?? currentWeight ?? ""));
    setTargetWeight(String(goal?.targetWeightLb ?? ""));
    setGoalError("");
    setEditingGoal(true);
  };

  const saveGoal = async () => {
    const startWeightLb = Number(startingWeight.trim());
    const targetWeightLb = Number(targetWeight.trim());

    if (!userId) {
      setGoalError("You must be logged in to save a goal.");
      return;
    }

    if (!goalTitle.trim()) {
      setGoalError("Enter a name for your goal.");
      return;
    }

    if (
      !Number.isFinite(startWeightLb) ||
      !Number.isFinite(targetWeightLb) ||
      startWeightLb <= 0 ||
      targetWeightLb <= 0
    ) {
      setGoalError("Enter valid starting and target weights.");
      return;
    }

    if (startWeightLb === targetWeightLb) {
      setGoalError("Your target weight must be different from your starting weight.");
      return;
    }

    try {
      setSavingGoal(true);
      const newGoal = {
        title: goalTitle.trim(),
        startWeightLb,
        targetWeightLb,
        startDate: goal?.startDate ?? localDate(),
        unit: "lb",
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userId, "goals", "current"), newGoal, {
        merge: true,
      });

      setGoal({
        title: newGoal.title,
        startWeightLb,
        targetWeightLb,
        startDate: newGoal.startDate,
      });
      setEditingGoal(false);
      setGoalError("");
    } catch {
      setGoalError("Unable to save your goal. Please try again.");
    } finally {
      setSavingGoal(false);
    }
  };

  if (loading) {
    return (
      <ThemedBackground>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryDark} />
          <Text style={styles.muted}>Loading your progress...</Text>
        </View>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingTop: Math.max(insets.top + spacing.sm, spacing.xl), paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
          ]}
        >
          <Text style={styles.brand}>KEYS2FITNESS</Text>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Small steps. Stronger every week.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.cardTitle}>Goal progress</Text>
              {!editingGoal && (
                <Pressable onPress={openGoalForm} accessibilityRole="button">
                  <Text style={styles.addLink}>{goal ? "Edit" : "Set goal"}</Text>
                </Pressable>
              )}
            </View>
            {editingGoal && (
              <View style={styles.form}>
                <Text style={styles.formLabel}>Goal name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Example: Reach my target weight"
                  placeholderTextColor={colors.textMuted}
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                />
                <Text style={styles.formLabel}>Starting weight in lb</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your starting weight"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={startingWeight}
                  onChangeText={setStartingWeight}
                />
                <Text style={styles.formLabel}>Target weight in lb</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your target weight"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                />
                {goalError ? <Text style={styles.error}>{goalError}</Text> : null}
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => {
                      setEditingGoal(false);
                      setGoalError("");
                    }}
                    style={styles.cancel}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={saveGoal} disabled={savingGoal} style={styles.save}>
                    <Text style={styles.saveText}>{savingGoal ? "Saving..." : "Save goal"}</Text>
                  </Pressable>
                </View>
              </View>
            )}
            {goal && progress ? (
              <>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <View style={styles.stats}>
                  <Stat label="Current" value={displayWeight(currentWeight ?? 0)} />
                  <Stat label="Target" value={displayWeight(goal.targetWeightLb)} highlighted />
                  <Stat label={progress.achieved ? "Status" : "Remaining"} value={progress.achieved ? "Complete" : displayWeight(progress.remaining)} />
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${progress.percent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {progress.achieved ? "Goal complete" : `${progress.percent}% of goal reached`}
                </Text>
                <Text style={styles.muted}>Started {displayDate(goal.startDate)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>No active goal yet</Text>
                
              </>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.cardTitle}>Weight history</Text>
              {!adding && <Pressable onPress={() => setAdding(true)}><Text style={styles.addLink}>Add</Text></Pressable>}
            </View>

            {adding && (
              <View style={styles.form}>
                <Text style={styles.formLabel}>New weight</Text>
                <TextInput
                  autoFocus
                  style={styles.input}
                  placeholder="Enter weight in lb"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={(value) => {
                    setWeight(value);
                    setFormError("");
                  }}
                />
                {formError ? <Text style={styles.error}>{formError}</Text> : null}
                <View style={styles.actions}>
                  <Pressable onPress={() => { setAdding(false); setWeight(""); setFormError(""); }} style={styles.cancel}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={saveWeight} disabled={saving} style={styles.save}>
                    <Text style={styles.saveText}>{saving ? "Saving..." : "Save"}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No weight history yet</Text>
                <Text style={styles.emptyBody}>Add your first measurement to start tracking progress.</Text>
                {!adding && <Pressable onPress={() => setAdding(true)} style={styles.save}><Text style={styles.saveText}>Add measurement</Text></Pressable>}
              </View>
            ) : (
              entries.map((entry, index) => (
                <View key={entry.id} style={styles.entry}>
                  <Text style={styles.entryDate}>{displayDate(entry.date)}</Text>
                  <Text style={styles.entryWeight}>{displayWeight(entry.weightLb)}</Text>
                  <Text style={styles.muted}>{index === 0 ? "Latest" : displayChange(entry.weightLb - entries[index - 1].weightLb)}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedBackground>
  );
}

function Stat({ label, value, highlighted = false }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlighted && styles.highlighted]}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1 
  },
  content: { 
    padding: spacing.lg 
  },
  centered: { 
    alignItems: "center", 
    flex: 1, 
    justifyContent: "center" 
  },
  brand: { 
    color: colors.primaryDark, 
    fontSize: typography.label, 
    fontWeight: "700", 
    letterSpacing: 1 
  },
  title: { 
    color: colors.text, 
    fontSize: typography.title, 
    fontWeight: "300", 
    marginTop: spacing.sm 
  },
  subtitle: { 
    color: colors.textMuted, 
    fontSize: typography.body, 
    fontWeight: "700", 
    marginTop: spacing.xs 
  },
  card: { 
    backgroundColor: colors.surface, 
    borderRadius: radii.card, 
    marginTop: spacing.lg, 
    padding: spacing.lg 
  },
  cardTitle: { 
    color: colors.text, 
    fontSize: typography.heading, 
    fontWeight: "300" 
  },
  goalTitle: { 
    color: colors.text, 
    fontSize: typography.body, 
    fontWeight: "700", 
    marginTop: spacing.sm 
  },
  stats: { 
    flexDirection: "row", 
    marginTop: spacing.lg 
  },
  stat: { 
    flex: 1 
  },
  statValue: { 
    color: colors.text, 
    fontSize: 22, 
    fontWeight: "300" 
  },
  highlighted: { 
    color: colors.primaryDark, 
    fontWeight: "600" 
  },
  track: { 
    backgroundColor: colors.surfaceMuted, 
    borderRadius: 8, 
    height: 10, 
    marginTop: spacing.lg, 
    overflow: "hidden" 
  },
  fill: { 
    backgroundColor: colors.primaryDark, 
    borderRadius: 8, 
    height: "100%" 
  },
  progressText: { 
    color: colors.primaryDark, 
    fontSize: typography.body, 
    fontWeight: "700", 
    marginTop: spacing.md 
  },
  muted: { 
    color: colors.textMuted, 
    fontSize: typography.label, 
    marginTop: spacing.xs 
  },
  error: { 
    color: colors.danger, 
    fontSize: typography.label, 
    marginTop: spacing.sm 
  },
  headerRow: { 
    alignItems: "center", 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  addLink: { 
    color: colors.primaryDark, 
    fontSize: typography.label,
    fontWeight: "700" 
  },
  form: { 
    backgroundColor: colors.surfaceMuted, 
    borderRadius: radii.button, 
    marginTop: spacing.md, 
    padding: spacing.md 
  },
  formLabel: { 
    color: colors.text, 
    fontWeight: "700", 
    marginBottom: spacing.xs 
  },
  input: { 
    backgroundColor: colors.surface, 
    borderColor: colors.border, 
    borderRadius: radii.button, 
    borderWidth: 1, 
    color: colors.text, 
    fontSize: typography.body, 
    padding: spacing.md 
  },
  actions: { 
    flexDirection: "row", 
    gap: spacing.sm, 
    marginTop: spacing.sm 
  },
  cancel: { 
    alignItems: "center", 
    borderColor: colors.border, 
    borderRadius: radii.button, 
    borderWidth: 1, flex: 1, 
    padding: spacing.sm 
  },
  cancelText: { 
    color: colors.textMuted, 
    fontWeight: "700" 
  },
  save: { 
    alignItems: "center", 
    backgroundColor: colors.primaryDark, 
    borderRadius: radii.button,
    marginTop: spacing.md, 
    padding: spacing.sm 
  },
  saveText: { 
    color: colors.surface, 
    fontWeight: "700" 
  },
  emptyState: { 
    marginTop: spacing.md 
  },
  emptyTitle: { 
    color: colors.text, 
    fontSize: typography.body, 
    fontWeight: "700" 
  },
  emptyBody: { 
    color: colors.textMuted, 
    fontSize: typography.label, 
    marginTop: spacing.xs 
  },
  entry: { 
    alignItems: "center", 
    borderTopColor: colors.border, 
    borderTopWidth: StyleSheet.hairlineWidth, 
    flexDirection: "row", 
    marginTop: spacing.sm, 
    paddingTop: spacing.sm 
  },
  entryDate: { 
    color: colors.textMuted, 
    fontSize: typography.label, 
    width: 72 
  },
  entryWeight: { 
    color: colors.text, 
    flex: 1, 
    fontSize: typography.body, 
    fontWeight: "600" 
  },
});
