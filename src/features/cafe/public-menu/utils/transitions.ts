/**
 * Progressive Web View Transitions API helper.
 * Provides instant app-like navigation and state transitions on supported mobile & desktop browsers,
 * while gracefully falling back to standard execution on older browsers or when prefers-reduced-motion is active.
 */

export function transitionNavigate(
  router: { push: (url: string) => void },
  url: string
): void {
  // Directly trigger Next.js client-side navigation.
  // Using startViewTransition with router.push synchronously captures an identical snapshot
  // of the old page before Next.js resolves the new route, causing a visible hitch/delay.
  router.push(url);
}

export function transitionState(updateFn: () => void): void {
  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof (document as any).startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    (document as any).startViewTransition(updateFn);
  } else {
    updateFn();
  }
}
