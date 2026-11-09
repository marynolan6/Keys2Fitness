// K2F-151 / K2F-236: Temporary client data for the coach screens
// Used by the client list, dashboard, and client profile
// IDs match the messages and check-ins mock data (1 = Spencer, 2 = Alex)
// Will be replaced with Firebase data later

// K2F-53: Whether the client is currently being coached. Inactive clients (paused or finished)
// stay in the client list but are not counted as active.
export type ClientStatus = "active" | "inactive";

export type CoachClient = {
  id: string;
  name: string;
  goal: string;
  plan: string;
  // Missing means active.
  status?: ClientStatus;
};

// Set to true to test the empty client list
export const PREVIEW_NO_CLIENTS = false;

// K2F-53: Preview how the coach dashboard handles client data that is still loading
// ("loading") or couldn't be loaded ("error"). Keep "ready" for normal use.
export const PREVIEW_CLIENTS_LOAD_STATUS: "ready" | "loading" | "error" = "ready";

const sampleClients: CoachClient[] = [
  {
    id: "1",
    name: "Spencer",
    goal: "Strength training",
    plan: "Strength Training · 4 days per week",
  },
  {
    id: "2",
    name: "Alex Morgan",
    goal: "Weight management",
    plan: "Cardio + Strength · 3 days per week",
  },
  {
    id: "3",
    name: "Jordan Lee",
    goal: "General fitness",
    plan: "Full Body · 3 days per week",
    // Placeholder: one paused client so the active count can be checked against the list.
    status: "inactive",
  },
];

export const demoClients: CoachClient[] = PREVIEW_NO_CLIENTS ? [] : sampleClients;

// K2F-53: The single rule for "active". Used everywhere the dashboard counts or lists active clients.
export function isActiveClient(client: CoachClient): boolean {
  return (client.status ?? "active") === "active";
}

export function getActiveClients(clients: readonly CoachClient[]): CoachClient[] {
  return clients.filter(isActiveClient);
}

export function countActiveClients(clients: readonly CoachClient[]): number {
  return getActiveClients(clients).length;
}

// Finds a client by ID (returns undefined if no match)
export function getClientById(clientId: string | undefined): CoachClient | undefined {
  if (!clientId) return undefined;
  return demoClients.find((client) => client.id === clientId);
}
