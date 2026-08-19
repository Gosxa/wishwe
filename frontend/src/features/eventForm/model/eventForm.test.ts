import { describe, expect, it } from 'vitest';
import { hasRequiredEventFields, validateEventForm } from './eventForm';
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
});
