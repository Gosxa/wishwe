// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SurveyDropdown } from './SurveyDropdown';
import s from './surveyDropdown.module.scss';

const OPTIONS = ['Finding time for everyone', 'Deciding where to go'];

describe('SurveyDropdown', () => {
  afterEach(cleanup);

  const renderDropdown = (
    overrides: Partial<React.ComponentProps<typeof SurveyDropdown>> = {},
  ) => {
    const onChange = vi.fn();
    const props = {
      label: 'Share your biggest meetup struggle',
      placeholder: 'Select an option...',
      options: OPTIONS,
      value: null,
      onChange,
      ...overrides,
    };

    const view = render(<SurveyDropdown {...props} />);

    return { onChange, ...view };
  };

  const getTrigger = () =>
    screen.getByRole('button', {
      name: 'Share your biggest meetup struggle',
    });

  it('shows the placeholder until something is chosen', () => {
    renderDropdown();

    expect(getTrigger().textContent).toContain('Select an option...');
  });

  it('shows the chosen value instead of the placeholder', () => {
    renderDropdown({ value: OPTIONS[0] });

    expect(getTrigger().textContent).toContain(OPTIONS[0]);
    expect(getTrigger().textContent).not.toContain('Select an option...');
  });

  it('labels the trigger with the survey question', () => {
    renderDropdown();

    expect(getTrigger()).toBeTruthy();
  });

  it('starts collapsed', () => {
    renderDropdown();

    expect(getTrigger().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('announces itself as a popup control', () => {
    renderDropdown();

    expect(getTrigger().getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('opens the listbox on click', () => {
    renderDropdown();

    fireEvent.click(getTrigger());

    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(OPTIONS.length);
  });

  it('closes again on a second click', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    fireEvent.click(getTrigger());

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('reports the chosen option and closes', () => {
    const { onChange } = renderDropdown();

    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('option', { name: OPTIONS[1] }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(OPTIONS[1]);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('marks the selected option for assistive tech', () => {
    renderDropdown({ value: OPTIONS[0] });

    fireEvent.click(getTrigger());

    expect(
      screen
        .getByRole('option', { name: OPTIONS[0] })
        .getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      screen
        .getByRole('option', { name: OPTIONS[1] })
        .getAttribute('aria-selected'),
    ).toBe('false');
  });

  it('closes on Escape', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('ignores unrelated keys', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    fireEvent.keyDown(document, { key: 'Enter' });

    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('closes when the user clicks elsewhere on the page', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('stays open when the click lands inside the field', () => {
    renderDropdown();

    fireEvent.click(getTrigger());
    fireEvent.mouseDown(screen.getByRole('listbox'));

    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('ties the listbox to the same label as the trigger', () => {
    renderDropdown();

    fireEvent.click(getTrigger());

    expect(screen.getByRole('listbox').getAttribute('aria-labelledby')).toBe(
      getTrigger().getAttribute('aria-labelledby'),
    );
  });

  it('flags the filled state so it can be styled differently', () => {
    const { rerender } = renderDropdown();

    expect(getTrigger().classList.contains(s.triggerFilled)).toBe(false);

    rerender(
      <SurveyDropdown
        label="Share your biggest meetup struggle"
        placeholder="Select an option..."
        options={OPTIONS}
        value={OPTIONS[0]}
        onChange={vi.fn()}
      />,
    );

    expect(getTrigger().classList.contains(s.triggerFilled)).toBe(true);
  });

  it('renders an empty listbox for an empty option list', () => {
    renderDropdown({ options: [] });

    fireEvent.click(getTrigger());

    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('never submits the surrounding form', () => {
    renderDropdown();

    expect(getTrigger().getAttribute('type')).toBe('button');

    fireEvent.click(getTrigger());

    screen.getAllByRole('option').forEach(option => {
      expect(option.getAttribute('type')).toBe('button');
    });
  });
});
