import { useSyncExternalStore } from "react";

import {
  demoClients,
  PREVIEW_CLIENTS_LOAD_STATUS,
  type ClientStatus,
  type CoachClient,
} from "./mockClients";

// K2F-53: In-memory client state for the coach screens, seeded from the mock data until
// Firebase is connected. Components that read it re-render whenever it changes, so counts
// derived from it stay current.

// "loading": not loaded yet; "error": couldn't be loaded; "ready": `clients` is the real list.
export type ClientsLoadStatus = "loading" | "ready" | "error";

export type CoachClientsState = {
  loadStatus: ClientsLoadStatus;
  clients: readonly CoachClient[];
};

let state: CoachClientsState = { loadStatus: PREVIEW_CLIENTS_LOAD_STATUS, clients: demoClients };
const listeners = new Set<() => void>();

// Replaces the state object (instead of editing it) so React sees the change.
function setState(next: CoachClientsState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function getCoachClientsState(): CoachClientsState {
  return state;
}

export function getCoachClients(): readonly CoachClient[] {
  return state.clients;
}

export function subscribeToCoachClients(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setClientStatus(clientId: string, status: ClientStatus): void {
  if (!state.clients.some((client) => client.id === clientId && (client.status ?? "active") !== status)) return;
  setState({
    ...state,
    clients: state.clients.map((client) => (client.id === clientId ? { ...client, status } : client)),
  });
}

// Mock reload: the demo data is always available, so a retry succeeds.
// Swap for the real Firebase fetch later.
export function reloadCoachClients(): void {
  setState({ loadStatus: "ready", clients: demoClients });
}

export function useCoachClientsState(): CoachClientsState {
  return useSyncExternalStore(subscribeToCoachClients, getCoachClientsState, getCoachClientsState);
}

export function useCoachClients(): readonly CoachClient[] {
  return useCoachClientsState().clients;
}
