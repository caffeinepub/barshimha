import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { type backendInterface, createActor } from "../backend";

/**
 * Typed useActor — wraps the core-infrastructure hook and provides the
 * correctly-typed backendInterface actor for this project's canister.
 */
export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  return _useActor(createActor) as {
    actor: backendInterface | null;
    isFetching: boolean;
  };
}
