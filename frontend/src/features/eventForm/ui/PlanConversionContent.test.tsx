// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EventTypePreview,
  PlanConversionFields,
} from './PlanConversionContent';
import s from './eventFormModal.module.scss';

const pill = (name: 'Plan' | 'Wish') => screen.getByText(name);

const timingProps = (): ComponentProps<typeof PlanConversionFields> => ({
  eventTitle: 'Weekend trip',
  date: { value: '2026-09-01', min: '2026-08-21', onChange: vi.fn() },
  time: { value: '18:30', onChange: vi.fn() },
  participants: {
    min: 2,
    max: 8,
    unlimited: false,
    onMinChange: vi.fn(),
    onMaxChange: vi.fn(),
    onUnlimitedChange: vi.fn(),
  },
  unlimitedToggleId: 'planUnlimited',
});

describe('EventTypePreview', () => {
  afterEach(() => {
    cleanup();
  });

  it('highlights the Plan pill and explains a scheduled event', () => {
    render(<EventTypePreview type="plan" coverUrl="/cover.webp" />);

    expect(pill('Plan').classList.contains(s.typePillActive)).toBe(true);
    expect(pill('Wish').classList.contains(s.typePillActive)).toBe(false);
    expect(screen.getByText('Scheduled event with a fixed date.')).toBeTruthy();
  });

  it('highlights the Wish pill and explains an undated idea', () => {
    render(<EventTypePreview type="wish" coverUrl="/cover.webp" />);

    expect(pill('Wish').classList.contains(s.typePillActive)).toBe(true);
    expect(pill('Plan').classList.contains(s.typePillActive)).toBe(false);
    expect(
      screen.getByText('An idea for the future without a specific time.'),
    ).toBeTruthy();
  });

  it('shows the cover image the conversion will reuse', () => {
    render(
      <EventTypePreview
        type="plan"
        coverUrl="https://cdn.example/cover.webp"
      />,
    );

    const cover = screen.getByAltText('Event cover') as HTMLImageElement;

    expect(cover.getAttribute('src')).toBe('https://cdn.example/cover.webp');
    expect(screen.getByText('Cover')).toBeTruthy();
  });

  it('renders the pills as static labels, not as controls', () => {
    render(<EventTypePreview type="plan" coverUrl="/cover.webp" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(pill('Plan').tagName).toBe('SPAN');
  });
});

describe('PlanConversionFields', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the source event title as a read-only value', () => {
    render(<PlanConversionFields {...timingProps()} />);

    const title = screen.getByText('Weekend trip');

    expect(title.classList.contains(s.readOnlyValue)).toBe(true);
    expect(screen.getByText('What?')).toBeTruthy();
    expect(screen.queryByDisplayValue('Weekend trip')).toBeNull();
  });

  it('forwards the timing props to the shared plan timing fields', () => {
    const props = timingProps();

    render(<PlanConversionFields {...props} />);

    const date = screen.getByLabelText('Event date') as HTMLInputElement;
    const time = screen.getByLabelText('Event time') as HTMLInputElement;

    expect(date.value).toBe('2026-09-01');
    expect(date.min).toBe('2026-08-21');
    expect(time.value).toBe('18:30');

    fireEvent.change(date, { target: { value: '2026-09-02' } });
    expect(props.date.onChange).toHaveBeenCalledWith('2026-09-02');

    fireEvent.change(time, { target: { value: '19:00' } });
    expect(props.time.onChange).toHaveBeenCalledWith('19:00');
  });

  it('hides the max stepper when the plan is unlimited', () => {
    const props = timingProps();

    const { rerender } = render(<PlanConversionFields {...props} />);

    expect(screen.getByText('Max')).toBeTruthy();

    rerender(
      <PlanConversionFields
        {...props}
        participants={{ ...props.participants, unlimited: true }}
      />,
    );
    expect(screen.queryByText('Max')).toBeNull();
    expect(screen.getByText('Min')).toBeTruthy();
  });

  it('renders no submit error by default', () => {
    render(<PlanConversionFields {...timingProps()} />);

    expect(screen.queryByText('This plan overlaps another one')).toBeNull();
  });

  it('renders the submit error below the timing fields', () => {
    render(
      <PlanConversionFields
        {...timingProps()}
        submitError="This plan overlaps another one"
      />,
    );

    expect(screen.getByText('This plan overlaps another one')).toBeTruthy();
  });

  it('renders a participant error next to the steppers', () => {
    render(
      <PlanConversionFields
        {...timingProps()}
        participantError="Max must be greater than min"
      />,
    );

    expect(screen.getByText('Max must be greater than min')).toBeTruthy();
  });
});
