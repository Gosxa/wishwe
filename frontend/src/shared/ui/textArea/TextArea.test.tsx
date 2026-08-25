// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useQuickFillStore } from '@/shared/store/useQuickFillStore';
import { TextArea } from './TextArea';
import s from './textArea.module.scss';

const TEMPLATE =
  'Weather looks good this weekend, why not sit outside somewhere?';

const renderArea = () =>
  render(
    <TextArea
      id="eventDescription"
      tourId="field-description"
      label="Description"
      placeholder="Share some details about your idea"
      value={TEMPLATE}
      onChange={vi.fn()}
    />,
  );

const field = () => screen.getByLabelText('Description');

describe('TextArea quick fill', () => {
  beforeEach(() => {
    useQuickFillStore.getState().stop();
  });

  afterEach(cleanup);

  it('cascades the words over the description and hides its own text', () => {
    renderArea();

    act(() => {
      useQuickFillStore.getState().start('field-description', TEMPLATE);
    });

    const overlay = document.querySelector(`.${s.quickFillOverlay}`);

    expect(overlay?.textContent).toBe(TEMPLATE);
    expect(field().classList.contains(s.textareaQuickFilling)).toBe(true);
  });
});
