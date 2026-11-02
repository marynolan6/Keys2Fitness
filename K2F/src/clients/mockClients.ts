// K2F-151 / K2F-236: Temporary client data for the coach screens
// Used by the client list, dashboard, and client profile
// IDs match the messages and check-ins mock data (1 = Spencer, 2 = Alex)
// Will be replaced with Firebase data later

export type CoachClient = {
  id: string;
  name: string;
  goal: string;
  plan: string;
};

// Set to true to test the empty client list
export const PREVIEW_NO_CLIENTS = false;

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
  },
];

export const demoClients: CoachClient[] = PREVIEW_NO_CLIENTS ? [] : sampleClients;

// Finds a client by ID (returns undefined if no match)
export function getClientById(clientId: string | undefined): CoachClient | undefined {
  if (!clientId) return undefined;
  return demoClients.find((client) => client.id === clientId);
}
