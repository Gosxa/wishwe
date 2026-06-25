const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let activeScrollFrame: number | null = null;

export const smoothScrollTo = (targetY: number, duration = 700): void => {
  if (typeof window === 'undefined') return;

  if (activeScrollFrame !== null) {
    cancelAnimationFrame(activeScrollFrame);
    activeScrollFrame = null;
  }

  const startY = window.scrollY;

  if (prefersReducedMotion() || duration <= 0) {
    window.scrollTo({ top: targetY, behavior: 'instant' });

    return;
  }

  const distance = targetY - startY;

  if (distance === 0) return;

  const startTime = performance.now();

  const tick = (now: number): void => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutCubic(progress);

    window.scrollTo({
      top: startY + distance * eased,
      behavior: 'instant',
    });

    if (progress < 1) {
      activeScrollFrame = requestAnimationFrame(tick);
    } else {
      activeScrollFrame = null;
    }
  };

  activeScrollFrame = requestAnimationFrame(tick);
};

export const smoothScrollToSelector = (
  selector: string,
  duration = 700,
): void => {
  if (typeof document === 'undefined') return;

  const element = document.querySelector(selector);

  if (!element) return;

  const targetY = element.getBoundingClientRect().top + window.scrollY;

  smoothScrollTo(targetY, duration);
};
