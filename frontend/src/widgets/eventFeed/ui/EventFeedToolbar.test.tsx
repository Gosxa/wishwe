// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EventFeedDropdown,
  EventFeedToolbar,
  type EventFeedOption,
} from './EventFeedToolbar';
import s from './eventFeedToolbar.module.scss';

type Filter = 'all' | 'plans' | 'wishes';
type Sort = 'soonest' | 'recent';

const filterOptions: EventFeedOption<Filter>[] = [
  { key: 'all', label: 'All' },
  { key: 'plans', label: 'Plans' },
  { key: 'wishes', label: 'Wishes' },
];

const sortOptions: EventFeedOption<Sort>[] = [
  { key: 'soonest', label: 'Soonest' },
  { key: 'recent', label: 'Recent' },
];

describe('EventFeedToolbar', () => {
  afterEach(cleanup);

  const renderToolbar = (
    overrides: Partial<
      React.ComponentProps<typeof EventFeedToolbar<Filter>>
    > = {},
  ) => {
    const onChange = vi.fn();
    const props = {
      options: filterOptions,
      value: 'all' as Filter,
      onChange,
      controls: <button type="button">Sort</button>,
      ...overrides,
    };

    render(<EventFeedToolbar {...props} />);

    return { onChange };
  };

  it('renders a button per filter option', () => {
    renderToolbar();

    filterOptions.forEach(option => {
      expect(screen.getByRole('button', { name: option.label })).toBeTruthy();
    });
  });

  it('marks only the selected filter as active', () => {
    renderToolbar({ value: 'plans' });

    const active = screen.getByRole('button', { name: 'Plans' });
    const inactive = screen.getByRole('button', { name: 'All' });

    expect(active.classList.contains(s.active)).toBe(true);
    expect(inactive.classList.contains(s.active)).toBe(false);
  });

  it('reports the key of the filter that was clicked', () => {
    const { onChange } = renderToolbar();

    fireEvent.click(screen.getByRole('button', { name: 'Wishes' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('wishes');
  });

  it('still reports a click on the filter that is already active', () => {
    const { onChange } = renderToolbar({ value: 'plans' });

    fireEvent.click(screen.getByRole('button', { name: 'Plans' }));

    expect(onChange).toHaveBeenCalledWith('plans');
  });

  it('renders the controls slot', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: 'Sort' })).toBeTruthy();
  });

  it('exposes the tour anchor when one is given', () => {
    const { container } = render(
      <EventFeedToolbar
        options={filterOptions}
        value="all"
        onChange={vi.fn()}
        controls={null}
        tourId="feed-filters"
      />,
    );

    expect(container.querySelector('[data-tour="feed-filters"]')).toBeTruthy();
  });

  it('leaves the tour anchor off when no id is given', () => {
    const { container } = render(
      <EventFeedToolbar
        options={filterOptions}
        value="all"
        onChange={vi.fn()}
        controls={null}
      />,
    );

    expect(container.querySelector('[data-tour]')).toBeNull();
  });

  it('renders nothing but the controls for an empty option list', () => {
    renderToolbar({ options: [] });

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('uses buttons that cannot submit a surrounding form', () => {
    renderToolbar();

    expect(
      screen.getByRole('button', { name: 'All' }).getAttribute('type'),
    ).toBe('button');
  });
});

describe('EventFeedDropdown', () => {
  afterEach(cleanup);

  const renderDropdown = (
    overrides: Partial<
      React.ComponentProps<typeof EventFeedDropdown<Sort>>
    > = {},
  ) => {
    const onChange = vi.fn();
    const props = {
      label: 'Sort by',
      value: 'recent' as Sort,
      options: sortOptions,
      onChange,
      ...overrides,
    };

    const view = render(<EventFeedDropdown {...props} />);

    return { onChange, ...view };
  };

  const trigger = () => screen.getByRole('button', { name: /Sort by/ });
  const openMenu = () => fireEvent.click(trigger());
  const menuItem = (label: string) =>
    screen
      .getAllByRole('button')
      .find(button => button !== trigger() && button.textContent === label);

  it('shows the label and the active option', () => {
    renderDropdown();

    expect(trigger().textContent).toContain('Sort by');
    expect(trigger().textContent).toContain('Recent');
  });

  it('keeps the menu closed until it is asked to open', () => {
    renderDropdown();

    expect(menuItem('Soonest')).toBeUndefined();
  });

  it('opens the menu on click', () => {
    renderDropdown();
    openMenu();

    sortOptions.forEach(option => {
      expect(menuItem(option.label)).toBeTruthy();
    });
  });

  it('closes the menu on a second click of the trigger', () => {
    renderDropdown();
    openMenu();
    openMenu();

    expect(menuItem('Soonest')).toBeUndefined();
  });

  it('reports the chosen option and closes', () => {
    const { onChange } = renderDropdown();

    openMenu();
    fireEvent.click(menuItem('Soonest')!);

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('soonest');
    expect(menuItem('Soonest')).toBeUndefined();
  });

  it('highlights the option that is already selected', () => {
    renderDropdown();
    openMenu();

    expect(menuItem('Recent')!.classList.contains(s.menuItemActive)).toBe(true);
    expect(menuItem('Soonest')!.classList.contains(s.menuItemActive)).toBe(
      false,
    );
  });

  it('closes when the user points somewhere else on the page', () => {
    renderDropdown();
    openMenu();

    fireEvent.pointerDown(document.body);

    expect(menuItem('Soonest')).toBeUndefined();
  });

  it('stays open when the pointer lands inside the dropdown', () => {
    renderDropdown();
    openMenu();

    fireEvent.pointerDown(menuItem('Soonest')!);

    expect(menuItem('Soonest')).toBeTruthy();
  });

  it('closes on Escape', () => {
    renderDropdown();
    openMenu();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(menuItem('Soonest')).toBeUndefined();
  });

  it('ignores other keys', () => {
    renderDropdown();
    openMenu();

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(menuItem('Soonest')).toBeTruthy();
  });

  it('does not listen for outside clicks while closed', () => {
    const addEventListener = vi.spyOn(document, 'addEventListener');

    renderDropdown();

    expect(addEventListener).not.toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
    );

    addEventListener.mockRestore();
  });

  it('stops listening once it closes again', () => {
    const removeEventListener = vi.spyOn(document, 'removeEventListener');

    renderDropdown();
    openMenu();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
    );
    expect(removeEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );

    removeEventListener.mockRestore();
  });

  it('leaves the value blank when it matches no option', () => {
    renderDropdown({ value: 'gone' as Sort });

    expect(trigger().textContent).toBe('Sort by');
  });
});
