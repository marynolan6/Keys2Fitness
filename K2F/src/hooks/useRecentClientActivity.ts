import { useEffect, useState } from "react";

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
};

export function useRecentClientActivity(clients: Client[]) {
  const [activities, setActivities] = useState<WorkoutActivity[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const clientIds = clients.map((client) => client.id).join(",");

  useEffect(() => {
    let cancelled = false;

    if (!clients.length) {
      setActivities([]);
      setStatus("ready");
      return;
    }

    setStatus("loading");

    Promise.all(
      clients.map(async (client) => {
        const history = await workoutSessionService.listHistory(client.id);

        return history
          .filter((entry) => entry.session.outcome === "completed")
          .map((entry) => ({
            id: `workout-${entry.id}`,
            clientId: client.id,
            clientName: client.name,
            workoutName: entry.title.trim() || "Workout",
            completedAt: Number(entry.session.finishedAt),
          }));
      }),
    )
      .then((results) => {
        if (cancelled) return;

        const sorted = results
          .flat()
          .sort((a, b) => b.completedAt - a.completedAt)
          .slice(0, 3);

        setActivities(sorted);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [clientIds]);

  return { activities, status };
}