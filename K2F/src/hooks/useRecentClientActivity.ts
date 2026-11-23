import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { CoachClient } from "@/clients/mockClients";
import { workoutSessionService } from "@/workouts/workoutSession";
import type { WorkoutActivity } from "@/workouts/workoutSessionService";

type ActivityState = { status: "loading" | "ready" | "error"; activities: WorkoutActivity[] };

export function useRecentClientActivity(clients: readonly CoachClient[]) {
  const [state, setState] = useState<ActivityState>({ status: "loading", activities: [] });

  useFocusEffect(useCallback(() => {
    let focused = true;
    setState({ status: "loading", activities: [] });
    workoutSessionService.listRecentClientActivity(clients).then(
      (activities) => { if (focused) setState({ status: "ready", activities }); },
      () => { if (focused) setState({ status: "error", activities: [] }); },
    );
    return () => { focused = false; };
  }, [clients]));

  return state;
}
