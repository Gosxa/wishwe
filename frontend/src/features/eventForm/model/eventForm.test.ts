import { describe, expect, it } from 'vitest';
import {
  buildEventFields,
  hasRequiredEventFields,
  validateEventForm,
} from './eventForm';
import type { EventFormValues } from './types';

const validPlan = (
  overrides: Partial<EventFormValues> = {},
): EventFormValues => ({
  type: 'plan',
  categoryId: 7,
  title: 'Weekend trip',
  location: 'Kyiv',
  description: '',
  eventDate: '2099-01-02',
  eventTime: '14:30',
  minParticipants: 2,
  maxParticipants: 5,
  unlimited: false,
  timeframeText: '',
  chatLink: '',
  visibility: 'f-o-f',
  ...overrides,
});

describe('eventForm', () => {
  it.each(['http://example.com/chat', 'https://example.com/chat'])(
    'accepts %s as a chat link',
    chatLink => {
      expect(validateEventForm(validPlan({ chatLink }), true).chatLink).toBe(
        undefined,
      );
    },
  );

  it.each(['ftp://example.com/chat', 'mailto:host@example.com', 'not a url'])(
    'rejects the non-HTTP chat link %s with the existing message',
    chatLink => {
      expect(validateEventForm(validPlan({ chatLink }), true).chatLink).toBe(
        'Enter a valid link (https://…)',
      );
    },
  );

  it('requires a category in the shared required-field helper for every type', () => {
    expect(hasRequiredEventFields(validPlan({ categoryId: null }))).toBe(false);
    expect(
      hasRequiredEventFields(
        validPlan({
          type: 'wish',
          categoryId: null,
          eventDate: '',
          eventTime: '',
          timeframeText: 'Someday',
        }),
      ),
    ).toBe(false);
  });

  it('includes a Google Place ID only for a map-pinned location', () => {
    expect(
      buildEventFields(validPlan(), 'create', 'ChIJ123').location_place_id,
    ).toBe('ChIJ123');
    expect(buildEventFields(validPlan(), 'create')).not.toHaveProperty(
      'location_place_id',
    );
  });

  it('clears a stored Place ID when an edited address is typed by hand', () => {
    expect(buildEventFields(validPlan(), 'edit').location_place_id).toBe('');
  });
});
