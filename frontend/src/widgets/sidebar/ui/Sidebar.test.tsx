// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

const originalOffsets = {
  offsetHeight: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight',
  ),
  offsetLeft: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetLeft',
  ),
  offsetTop: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetTop',
  ),
  offsetWidth: Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetWidth',
  ),
};

const itemIndex = (element: HTMLElement) => {
  if (element.textContent === 'Friends') return 1;
  if (element.textContent === 'Profile') return 2;

  return 0;
};

describe('Sidebar', () => {
  beforeAll(() => {
    Object.defineProperties(HTMLElement.prototype, {
      offsetHeight: { configurable: true, get: () => 64 },
      offsetLeft: { configurable: true, get: () => 0 },
      offsetTop: {
        configurable: true,
        get(this: HTMLElement) {
          return 12 + itemIndex(this) * 88;
        },
      },
      offsetWidth: { configurable: true, get: () => 88 },
    });
  });

  afterEach(cleanup);

  afterAll(() => {
    Object.entries(originalOffsets).forEach(([property, descriptor]) => {
      if (descriptor) {
        Object.defineProperty(HTMLElement.prototype, property, descriptor);
      }
    });
  });

  it('moves the same active indicator when the selected route changes', () => {
    const { rerender } = render(<Sidebar activeKey="home" />);
    const indicator = screen.getByTestId('sidebar-active-indicator');

    expect(indicator.style.transform).toBe('translate3d(0px, 12px, 0)');
    expect(
      screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current'),
    ).toBe('page');

    rerender(<Sidebar activeKey="friends" />);

    expect(screen.getByTestId('sidebar-active-indicator')).toBe(indicator);
    expect(indicator.style.transform).toBe('translate3d(0px, 100px, 0)');
    expect(
      screen
        .getByRole('link', { name: 'Friends' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current'),
    ).toBeNull();
  });
});
