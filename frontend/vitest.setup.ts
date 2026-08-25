import { vi } from 'vitest';

if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
}
