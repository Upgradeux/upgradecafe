/**
 * Progressive Web View Transitions API helper.
 * Provides instant app-like navigation and state transitions on supported mobile & desktop browsers,
 * while gracefully falling back to standard execution on older browsers or when prefers-reduced-motion is active.
 */

export function transitionNavigate(
  router: { push: (url: string) => void },
  url: string
): void {
  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof (document as any).startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    (document as any).startViewTransition(() => {
      router.push(url);
    });
  } else {
    router.push(url);
  }
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
