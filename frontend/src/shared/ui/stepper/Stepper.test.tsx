// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Stepper } from './Stepper';

const MAX_VALUE = 999;

describe('Stepper', () => {
  afterEach(cleanup);

  const renderStepper = (value = 3, min = 1) => {
    const onChange = vi.fn();
    const view = render(
      <Stepper label="Max" value={value} min={min} onChange={onChange} />,
    );
    const input = screen.getByRole('textbox', {
      name: 'Max',
    }) as HTMLInputElement;

    return {
      ...view,
      onChange,
      input,
      decrease: screen.getByRole('button', { name: 'Decrease Max' }),
      increase: screen.getByRole('button', { name: 'Increase Max' }),
    };
  };

  it('steps the committed value up and down', () => {
    const { onChange, increase, decrease } = renderStepper(3);

    fireEvent.click(increase);
    expect(onChange).toHaveBeenLastCalledWith(4);

    fireEvent.click(decrease);
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('clamps at the minimum and disables the decrease control', () => {
    const { onChange, decrease, increase } = renderStepper(2, 2);

    expect((decrease as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(decrease);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(increase);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('clamps at 999 and disables the increase control', () => {
    const { onChange, increase, decrease } = renderStepper(MAX_VALUE);

    expect((increase as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(increase);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(decrease);
    expect(onChange).toHaveBeenCalledWith(998);
  });

  it('sanitizes typed input to at most three digits', () => {
    const { input, onChange } = renderStepper(3);

    fireEvent.change(input, { target: { value: '1a2b3c4' } });

    expect(input.value).toBe('123');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('commits a sanitized draft on blur, clamped to the allowed range', () => {
    const { input, onChange } = renderStepper(3, 2);

    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(2);

    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(MAX_VALUE);

    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(12);
  });

  it('commits the draft when Enter is pressed', () => {
    const { input, onChange } = renderStepper(3);

    input.focus();
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(25);
  });

  it('discards an empty draft and falls back to the committed value', () => {
    const { input, onChange } = renderStepper(7);

    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe('7');
  });

  it('steps relative to an active draft rather than the committed value', () => {
    const { input, onChange, increase } = renderStepper(3);

    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(increase);

    expect(onChange).toHaveBeenCalledWith(11);
    expect(input.value).toBe('3');
  });

  it('uses the draft to decide whether the controls are disabled', () => {
    const { input, decrease } = renderStepper(5, 2);

    expect((decrease as HTMLButtonElement).disabled).toBe(false);

    fireEvent.change(input, { target: { value: '1' } });

    expect((decrease as HTMLButtonElement).disabled).toBe(true);
  });
});
