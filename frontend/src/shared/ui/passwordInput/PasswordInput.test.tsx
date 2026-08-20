// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ChangeEvent, ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import hs from '../helperText/helperText.module.scss';
import ts from '../textInput/textInput.module.scss';
import { PasswordInput } from './PasswordInput';

const renderInput = (
  props: Partial<ComponentProps<typeof PasswordInput>> = {},
) =>
  render(
    <PasswordInput
      id="password"
      value="hunter2"
      onChange={vi.fn()}
      {...props}
    />,
  );

const input = () => screen.getByPlaceholderText('Password') as HTMLInputElement;

const toggle = () => screen.getByRole('button');

describe('PasswordInput', () => {
  afterEach(() => {
    cleanup();
  });

  it('masks the value until the eye button is pressed and masks it again', () => {
    renderInput();

    expect(input().type).toBe('password');

    fireEvent.click(toggle());
    expect(input().type).toBe('text');
    expect(input().value).toBe('hunter2');

    fireEvent.click(toggle());
    expect(input().type).toBe('password');
  });

  it('keeps the eye button out of the tab order and out of form submission', () => {
    renderInput();

    expect(toggle().getAttribute('type')).toBe('button');
    expect(toggle().tabIndex).toBe(-1);
  });

  it('links the label to the input and omits it when not provided', () => {
    const { rerender } = renderInput({ label: 'New password' });

    expect(screen.getByLabelText('New password')).toBe(input());

    rerender(
      <PasswordInput id="password" value="hunter2" onChange={vi.fn()} />,
    );
    expect(screen.queryByText('New password')).toBeNull();
  });

  it('forwards typing and blur to the caller', () => {
    const typed: string[] = [];
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) =>
      typed.push(event.target.value),
    );
    const onBlur = vi.fn();

    renderInput({ onChange, onBlur, value: '' });

    fireEvent.change(input(), { target: { value: 'secret' } });
    fireEvent.blur(input());

    expect(typed).toEqual(['secret']);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('supports a custom placeholder', () => {
    renderInput({ placeholder: 'Repeat password' });

    expect(screen.getByPlaceholderText('Repeat password')).toBeTruthy();
  });

  it('shows the helper text as info when there is no error or success', () => {
    renderInput({ helperText: 'At least 8 characters' });

    expect(screen.getByText('At least 8 characters')).toBeTruthy();
    expect(input().classList.contains(ts.inputError)).toBe(false);
    expect(input().classList.contains(ts.inputSuccess)).toBe(false);
  });

  it('prefers the error over the helper text and marks the input invalid', () => {
    renderInput({
      helperText: 'At least 8 characters',
      error: 'Password is too short',
      isSuccess: true,
    });

    expect(screen.getByText('Password is too short')).toBeTruthy();
    expect(screen.queryByText('At least 8 characters')).toBeNull();
    expect(input().classList.contains(ts.inputError)).toBe(true);
  });

  it('marks the input as successful when there is no error', () => {
    renderInput({ helperText: 'Looks good', isSuccess: true });

    expect(input().classList.contains(ts.inputSuccess)).toBe(true);
    expect(input().classList.contains(ts.inputError)).toBe(false);
  });

  it('renders no helper row when there is nothing to say', () => {
    const { container } = renderInput();

    expect(container.querySelector(`.${hs.container}`)).toBeNull();
  });
});
