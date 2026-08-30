import type { BoardResult, Premise } from "../knowngate/contracts.ts";

export type EntryKind = "item" | "place";
export type BoardEntry = { id: string; kind: EntryKind; label: string; status: "pending" | "complete" | "error"; result?: BoardResult; error?: string };
export type ActivityEvent = { id: string; tone: "info" | "error"; message: string };
export type BoardState = {
  premise: { status: "empty" | "proposed" | "confirmed"; draft: Premise | null; confirmed: Premise | null };
  entries: BoardEntry[];
  activity: ActivityEvent[];
  view: "human" | "agent";
  mode: "human" | "agent";
};
export type BoardAction =
  | { type: "proposePremise"; premise: Premise }
  | { type: "confirmPremise"; eventId: string }
  | { type: "cancelPremise" }
  | { type: "startCheck"; id: string; kind: EntryKind; label: string; eventId: string }
  | { type: "completeCheck"; id: string; result: BoardResult; eventId: string }
  | { type: "failCheck"; id: string; message: string; eventId: string }
  | { type: "setView"; view: "human" | "agent" }
  | { type: "note"; message: string; eventId: string }
  | { type: "setMode"; mode: "human" | "agent" };

export const initialBoardState: BoardState = { premise: { status: "empty", draft: null, confirmed: null }, entries: [], activity: [], view: "human", mode: "human" };
const activity = (id: string, message: string, tone: ActivityEvent["tone"] = "info"): ActivityEvent => ({ id, message, tone });

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "proposePremise": return { ...state, premise: { status: "proposed", draft: action.premise, confirmed: state.premise.confirmed } };
    case "confirmPremise": {
      if (!state.premise.draft) return { ...state, activity: [...state.activity, activity(action.eventId, "No premise is waiting for confirmation.", "error")] };
      const changed = JSON.stringify(state.premise.confirmed) !== JSON.stringify(state.premise.draft);
      return { ...state, premise: { status: "confirmed", draft: state.premise.draft, confirmed: state.premise.draft }, entries: changed ? [] : state.entries, activity: [activity(action.eventId, changed && state.entries.length ? "Premise confirmed; earlier rulings were cleared." : "Premise confirmed by the human.")] };
    }
    case "cancelPremise": return { ...state, premise: state.premise.confirmed ? { status: "confirmed", draft: state.premise.confirmed, confirmed: state.premise.confirmed } : initialBoardState.premise };
    case "startCheck":
      if (state.premise.status !== "confirmed" || !state.premise.confirmed) return { ...state, activity: [...state.activity, activity(action.eventId, "Confirm the household premise before checking evidence.", "error")] };
      return { ...state, entries: [...state.entries, { id: action.id, kind: action.kind, label: action.label, status: "pending" }], activity: [...state.activity, activity(action.eventId, `Checking ${action.label}…`)] };
    case "completeCheck":
      if (!state.entries.some((entry) => entry.id === action.id)) return { ...state, activity: [...state.activity, activity(action.eventId, "Ignored an out-of-order result with no pending check.", "error")] };
      return { ...state, entries: state.entries.map((entry) => entry.id === action.id ? { ...entry, status: "complete", result: action.result, error: undefined } : entry), activity: [...state.activity, activity(action.eventId, "Evidence ruling added to the ledger.")] };
    case "failCheck": return { ...state, entries: state.entries.map((entry) => entry.id === action.id ? { ...entry, status: "error", error: action.message } : entry), activity: [...state.activity, activity(action.eventId, action.message, "error")] };
    case "setView": return { ...state, view: action.view };
    case "note": return { ...state, activity: [...state.activity, activity(action.eventId, action.message)] };
    case "setMode": return { ...state, mode: action.mode };
  }
}
