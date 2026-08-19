// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Toggle } from './Toggle';

describe('Toggle', () => {
  afterEach(cleanup);

  const renderToggle = (props: Partial<Parameters<typeof Toggle>[0]> = {}) => {
    const onChange = vi.fn();
    const view = render(
      <Toggle
        id="unlimitedToggle"
        label="Unlimited"
        checked={false}
        onChange={onChange}
        {...props}
      />,
    );

    return { ...view, onChange };
  };

  it('exposes a labelled switch that reflects the checked state', () => {
    const { rerender, onChange } = renderToggle();
    const toggle = screen.getByRole('switch', { name: 'Unlimited' });

    expect((toggle as HTMLInputElement).checked).toBe(false);
    expect(toggle.getAttribute('id')).toBe('unlimitedToggle');

    rerender(
      <Toggle
        id="unlimitedToggle"
        label="Unlimited"
        checked
        onChange={onChange}
      />,
    );

    expect(
      (screen.getByRole('switch', { name: 'Unlimited' }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it('reports the next checked value in both directions', () => {
    const { rerender, onChange } = renderToggle();

    fireEvent.click(screen.getByRole('switch', { name: 'Unlimited' }));
    expect(onChange).toHaveBeenCalledWith(true);

    onChange.mockClear();
    rerender(
      <Toggle
        id="unlimitedToggle"
        label="Unlimited"
        checked
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('switch', { name: 'Unlimited' }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('marks the switch disabled so the browser blocks interaction', () => {
    renderToggle({ disabled: true });

    const toggle = screen.getByRole('switch', { name: 'Unlimited' });

    expect((toggle as HTMLInputElement).disabled).toBe(true);
    expect(toggle.hasAttribute('disabled')).toBe(true);
  });

  it('renders helper text only when it is provided', () => {
    const { rerender, onChange } = renderToggle();

    expect(screen.queryByText('Anyone can join')).toBeNull();

    rerender(
      <Toggle
        id="unlimitedToggle"
        label="Unlimited"
        checked={false}
        onChange={onChange}
        helperText="Anyone can join"
      />,
    );

    expect(screen.getByText('Anyone can join')).toBeTruthy();
  });

  it('stays operable without a visible label', () => {
    const { onChange } = renderToggle({ label: undefined });

    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
