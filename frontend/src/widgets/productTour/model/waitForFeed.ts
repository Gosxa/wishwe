const FEED_READY_SELECTOR = '[data-tour="feed-card"], [data-tour="feed-empty"]';
const FEED_POLL_MS = 120;
const FEED_TIMEOUT_MS = 8000;

export const waitForFeed = (onReady: () => void) => {
  const startedAt = Date.now();

  const timer = window.setInterval(() => {
    const isFeedReady = document.querySelector(FEED_READY_SELECTOR) !== null;

    if (!isFeedReady && Date.now() - startedAt < FEED_TIMEOUT_MS) return;

    window.clearInterval(timer);
    onReady();
  }, FEED_POLL_MS);

  return () => window.clearInterval(timer);
};
