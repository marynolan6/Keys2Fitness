import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  reloadCoachClients,
  useCoachClientsState,
} from "@/clients/clientStore";
import { getActiveClients } from "@/clients/mockClients";
import { ActiveClientsCard } from "@/components/ActiveClientsCard";
import {
  NewCoachMessagesWidget,
  RecentMessagesModal,
} from "@/components/RecentMessageWidgetCoach";
import { ClientActivityCard } from "@/components/ClientActivityCard";
import { PendingVideosWidget } from "@/components/PendingVideoWidget";
import { ThemedBackground } from "@/components/ThemedBackground";
import { useRecentClientActivity } from "@/hooks/useRecentClientActivity";
import { mockMessages } from "@/messages/mockMessageCoachClient";
import { colors, layout, spacing, typography } from "@/theme";

export default function CoachHome() {
  const router = useRouter();

  const [showRecentMessages, setShowRecentMessages] =
    useState(false);

  const { loadStatus, clients } = useCoachClientsState();
  const activeClients = getActiveClients(clients);

  const openClientProfile = (clientId: string) =>
    router.push({
      pathname: "/coach-client/[clientId]",
      params: { clientId },
    });

  const {
    activities: workoutActivities,
    allActivities,
    status: workoutActivityStatus,
  } = useRecentClientActivity(clients);

  return (
    <ThemedBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Coach Dashboard</Text>

       <View style={styles.widgetGrid}>
  <View style={styles.widgetCell}>
    <PendingVideosWidget
      onPress={() => router.push("/coach/client_list")}
    />
  </View>

  <View style={styles.widgetCell}>
    <NewCoachMessagesWidget
      messages={mockMessages}
      onPress={() => setShowRecentMessages(true)}
    />
  </View>

  <View style={styles.widgetCell}>
    <ActiveClientsCard
      loadStatus={loadStatus}
      count={activeClients.length}
      clients={activeClients}
      onRetry={reloadCoachClients}
      onOpenClient={openClientProfile}
    />
  </View>

  <View style={styles.widgetCell}>
    <ClientActivityCard
      activities={workoutActivities}
      allActivities={allActivities}
      status={workoutActivityStatus}
      onOpenClient={openClientProfile}
    />
  </View>
</View>

        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => router.push("/coach-checkins")}
        >
          <Text style={styles.checkInButtonText}>
            View Recent Check-ins →
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <RecentMessagesModal
        visible={showRecentMessages}
        messages={mockMessages}
        onClose={() => setShowRecentMessages(false)}
      />
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },

  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
    marginTop: Platform.OS === "web" ? 48 : 0,
  },


  checkInButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
  },

  checkInButtonText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: "700",
  },
  widgetGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  rowGap: spacing.md,
},

widgetCell: {
  width: "48%",
},
});