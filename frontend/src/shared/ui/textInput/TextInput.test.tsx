// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useQuickFillStore } from '@/shared/store/useQuickFillStore';
import { TextInput } from './TextInput';
import s from './textInput.module.scss';

const TEMPLATE = 'Catch up over coffee or matcha?';

const renderInput = (tourId?: string) =>
  render(
    <TextInput
      id="eventTitle"
      tourId={tourId}
      label="What's your wish?"
      placeholder="e.g., Picnic in the park"
      value={TEMPLATE}
      onChange={vi.fn()}
    />,
  );

const overlay = () => document.querySelector(`.${s.quickFillOverlay}`);

const field = () => screen.getByLabelText(/What's your wish/);

const cascade = (tourId: string) =>
  act(() => {
    useQuickFillStore.getState().start(tourId, TEMPLATE);
  });

describe('TextInput quick fill', () => {
  beforeEach(() => {
    useQuickFillStore.getState().stop();
  });

  afterEach(cleanup);

  it('stays out of the way when no cascade is running', () => {
    renderInput('field-title');

    expect(overlay()).toBeNull();
    expect(field().classList.contains(s.inputQuickFilling)).toBe(false);
  });

  it('draws the words over the field the cascade is aimed at', () => {
    renderInput('field-title');
    cascade('field-title');

    expect(overlay()?.textContent).toBe(TEMPLATE);
    expect(overlay()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('hides its own text so only the overlay shows while filling', () => {
    renderInput('field-title');
    cascade('field-title');

    expect(field().classList.contains(s.inputQuickFilling)).toBe(true);
    expect((field() as HTMLInputElement).value).toBe(TEMPLATE);
  });

  it('ignores a cascade aimed at another field', () => {
    renderInput('field-title');
    cascade('field-location');

    expect(overlay()).toBeNull();
    expect(field().classList.contains(s.inputQuickFilling)).toBe(false);
  });

  it('drops the overlay once the cascade stops', () => {
    renderInput('field-title');
    cascade('field-title');

    act(() => {
      useQuickFillStore.getState().stop();
    });

    expect(overlay()).toBeNull();
    expect(field().classList.contains(s.inputQuickFilling)).toBe(false);
  });
});
