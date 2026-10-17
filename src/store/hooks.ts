import { useSyncExternalStore } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

const noopSubscribe = () => () => {};

/**
 * The signed-in user and whether the initial session check has finished.
 * Reports "not ready" while hydrating so the first client render matches the server HTML,
 * even if the session request already finished (e.g. inside a Suspense boundary that hydrates late).
 */
export function useSession() {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const user = useAppSelector((s) => s.session.user);
  const ready = useAppSelector((s) => s.session.status === "ready");
  return { user: hydrated ? user : null, ready: hydrated && ready };
}
