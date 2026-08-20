// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Tooltip } from './Tooltip';
import s from './tooltip.module.scss';

describe('Tooltip', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the bubble next to the trigger when text is provided', () => {
    render(
      <Tooltip text="Search by nickname" id="searchTip">
        <button type="button">Search</button>
      </Tooltip>,
    );

    const bubble = screen.getByRole('tooltip');

    expect(bubble.textContent).toBe('Search by nickname');
    expect(bubble.id).toBe('searchTip');
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
  });

  it('keeps the trigger and the bubble inside one wrapper so CSS hover can reach it', () => {
    const { container } = render(
      <Tooltip text="Hint" className="extra">
        <span data-testid="trigger">Trigger</span>
      </Tooltip>,
    );

    const wrapper = container.firstElementChild as HTMLElement;

    expect(wrapper.classList.contains(s.wrapper)).toBe(true);
    expect(wrapper.classList.contains('extra')).toBe(true);
    expect(wrapper.contains(screen.getByTestId('trigger'))).toBe(true);
    expect(wrapper.contains(screen.getByRole('tooltip'))).toBe(true);
  });

  it('renders children untouched when there is no text', () => {
    const { container } = render(
      <Tooltip className="extra" id="unused">
        <button type="button">Search</button>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(container.querySelector(`.${s.wrapper}`)).toBeNull();
    expect(container.firstElementChild?.tagName).toBe('BUTTON');
  });

  it('treats an empty string as no tooltip', () => {
    render(
      <Tooltip text="">
        <span>Trigger</span>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
