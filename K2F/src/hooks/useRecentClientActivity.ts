import { useIsFocused } from "expo-router";
import { useEffect, useReducer } from "react";

import { workoutSessionService } from "@/workouts/workoutSession";

type Client = {
  id: string;
  name: string;
};

export type WorkoutActivity = {
  id: string;
  clientId: string;
  clientName: string;
  workoutName: string;
  completedAt: number;
  workoutStatus: "completed" | "ended-early";
};

type ActivityState = {
  activities: WorkoutActivity[];
  allActivities: WorkoutActivity[];
  status: "loading" | "ready" | "error";
};

type ActivityAction =
  | { type: "clear" }
  | { type: "loading" }
  | {
      type: "loaded";
      activities: WorkoutActivity[];
      allActivities: WorkoutActivity[];
    }
  | { type: "error" };

const initialState: ActivityState = {
  activities: [],
  allActivities: [],
  status: "loading",
};

function activityReducer(
  state: ActivityState,
  action: ActivityAction,
): ActivityState {
  switch (action.type) {
    case "clear":
      return {
        activities: [],
        allActivities: [],
        status: "ready",
      };

    case "loading":
      return {
        ...state,
        status: "loading",
      };

    case "loaded":
      return {
        activities: action.activities,
        allActivities: action.allActivities,
        status: "ready",
      };

    case "error":
      return {
        ...state,
        status: "error",
      };

    default:
      return state;
  }
}

export function useRecentClientActivity(clients: Client[]) {
  const isFocused = useIsFocused();
  const [state, dispatch] = useReducer(activityReducer, initialState);

  const clientSignature = clients
    .map((client) => `${client.id}:${client.name}`)
    .join(",");

  useEffect(() => {
    if (!isFocused) return;

    let cancelled = false;

    if (!clients.length) {
      dispatch({ type: "clear" });
      return;
    }

    dispatch({ type: "loading" });

    Promise.all(
      clients.map(async (client) => {
        const history = await workoutSessionService.listHistory(client.id);

        return history
          .filter(
            (entry) =>
              entry.session.outcome === "completed" ||
              entry.session.outcome === "ended-early",
          )
          .map((entry) => ({
            id: `workout-${entry.id}`,
            clientId: client.id,
            clientName: client.name,
            workoutName: entry.title.trim() || "Workout",
            completedAt: Number(entry.session.finishedAt),
            workoutStatus: entry.session.outcome,
          }));
      }),
    )
      .then((results) => {
        if (cancelled) return;

        const allActivities = results
          .flat()
          .sort((a, b) => b.completedAt - a.completedAt);

        dispatch({
          type: "loaded",
          allActivities,
          activities: allActivities.slice(0, 3),
        });
      })
      .catch(() => {
        if (!cancelled) {
          dispatch({ type: "error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientSignature, isFocused]);

  return state;
}