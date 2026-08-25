// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category } from '@/shared/client_api/event';

import { CategoryPicker } from './CategoryPicker';
import s from './categoryPicker.module.scss';

const categories: Category[] = [
  { id: 7, name: 'Outdoors' },
  { id: 9, name: 'Culture' },
  { id: 11, name: 'FoodAndDrinks' },
];

const geometry = { scrollLeft: 0, clientWidth: 300, scrollWidth: 300 };

const defineGeometry = (property: keyof typeof geometry) =>
  Object.defineProperty(HTMLDivElement.prototype, property, {
    configurable: true,
    get: () => geometry[property],
  });

describe('CategoryPicker', () => {
  let scrollBy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    geometry.scrollLeft = 0;
    geometry.clientWidth = 300;
    geometry.scrollWidth = 300;
    defineGeometry('scrollLeft');
    defineGeometry('clientWidth');
    defineGeometry('scrollWidth');

    scrollBy = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollBy', {
      configurable: true,
      value: scrollBy,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderPicker = (selected: number | null = null, error?: string) => {
    const onChange = vi.fn();
    const view = render(
      <CategoryPicker
        categories={categories}
        selected={selected}
        onChange={onChange}
        error={error}
      />,
    );
    const chips = view.container.querySelector(`.${s.chips}`) as HTMLElement;

    return { ...view, onChange, chips };
  };

  it('renders every category with a display-formatted name', () => {
    renderPicker();

    expect(screen.getByRole('button', { name: 'outdoors' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'culture' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'foodAndDrinks' })).toBeTruthy();
  });

  it('shows loading text while categories load', () => {
    const onChange = vi.fn();

    render(
      <CategoryPicker
        categories={[]}
        isLoading
        selected={null}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('loading...')).toBeTruthy();
  });

  it('selects an unselected category', () => {
    const { onChange } = renderPicker();

    fireEvent.click(screen.getByRole('button', { name: 'culture' }));

    expect(onChange).toHaveBeenCalledWith(9);
  });

  it('deselects the category that is already selected', () => {
    const { onChange } = renderPicker(9);

    fireEvent.click(screen.getByRole('button', { name: 'culture' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('marks only the selected chip', () => {
    renderPicker(9);

    expect(
      screen
        .getByRole('button', { name: 'culture' })
        .classList.contains(s.selected),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', { name: 'outdoors' })
        .classList.contains(s.selected),
    ).toBe(false);
  });

  it('hides both arrows when the chips fit', () => {
    renderPicker();

    expect(
      screen.queryByRole('button', { name: 'Scroll categories left' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Scroll categories right' }),
    ).toBeNull();
  });

  it('reveals each arrow as the chip row overflows and scrolls', () => {
    geometry.scrollWidth = 900;

    const { chips } = renderPicker();

    expect(
      screen.getByRole('button', { name: 'Scroll categories right' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Scroll categories left' }),
    ).toBeNull();

    geometry.scrollLeft = 400;
    fireEvent.scroll(chips);

    expect(
      screen.getByRole('button', { name: 'Scroll categories left' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Scroll categories right' }),
    ).toBeTruthy();

    geometry.scrollLeft = 600;
    fireEvent.scroll(chips);

    expect(
      screen.queryByRole('button', { name: 'Scroll categories right' }),
    ).toBeNull();
  });

  it('scrolls by 80% of the visible width in the requested direction', () => {
    geometry.scrollWidth = 900;
    renderPicker();

    fireEvent.click(
      screen.getByRole('button', { name: 'Scroll categories right' }),
    );

    expect(scrollBy).toHaveBeenCalledWith({
      left: 240,
      behavior: 'smooth',
    });

    geometry.scrollLeft = 400;
    fireEvent.scroll(document.querySelector(`.${s.chips}`) as HTMLElement);
    fireEvent.click(
      screen.getByRole('button', { name: 'Scroll categories left' }),
    );

    expect(scrollBy).toHaveBeenLastCalledWith({
      left: -240,
      behavior: 'smooth',
    });
  });

  it('never scrolls by less than 120px on a narrow row', () => {
    geometry.clientWidth = 80;
    geometry.scrollWidth = 900;
    renderPicker();

    fireEvent.click(
      screen.getByRole('button', { name: 'Scroll categories right' }),
    );

    expect(scrollBy).toHaveBeenCalledWith({ left: 120, behavior: 'smooth' });
  });

  it('recomputes the arrows when the window is resized', () => {
    const { chips } = renderPicker();

    expect(
      screen.queryByRole('button', { name: 'Scroll categories right' }),
    ).toBeNull();

    geometry.scrollWidth = 900;
    fireEvent(window, new Event('resize'));

    expect(
      screen.getByRole('button', { name: 'Scroll categories right' }),
    ).toBeTruthy();
    expect(chips).toBeTruthy();
  });

  it('removes its scroll and resize listeners on unmount', () => {
    const removeWindowListener = vi.spyOn(window, 'removeEventListener');
    const { chips, unmount } = renderPicker();
    const removeChipsListener = vi.spyOn(chips, 'removeEventListener');

    unmount();

    expect(removeChipsListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
    );
    expect(removeWindowListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );
  });

  it('renders the validation error', () => {
    renderPicker(null, 'Category is required');

    expect(screen.getByText('Category is required')).toBeTruthy();
  });
});
