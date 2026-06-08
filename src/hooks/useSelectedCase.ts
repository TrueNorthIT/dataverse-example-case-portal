import { useState, useEffect, useCallback, useRef } from "react";
import type { Tab } from "../types/ui";
import type { Case } from "../tables/case";

/**
 * Which case is open in the detail view, plus browser-history wiring so
 * the back button closes the detail without losing list state.
 */
export function useSelectedCase() {
  const [selected, setSelected] = useState<Case | null>(null);
  const [scope, setScope] = useState<Tab>("me");
  const pushedHistory = useRef(false);

  const open = useCallback((c: Case, fromScope: Tab) => {
    setSelected(c);
    setScope(fromScope);
    window.history.pushState({ view: "case" }, "");
    pushedHistory.current = true;
  }, []);

  const close = useCallback(() => {
    setSelected(null);
    if (pushedHistory.current) {
      pushedHistory.current = false;
      window.history.back();
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      pushedHistory.current = false;
      setSelected(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return { selected, scope, open, close };
}
