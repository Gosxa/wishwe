import { describe, expect, it } from 'vitest';

import { normalizeSort, toEventListParams } from '@/lib/events/feed-query';

describe('toEventListParams', () => {
  it('sends no type filter on the All tab', () => {
    expect(toEventListParams('all', 'all', 'recent', '')).toEqual({ sort: 'recent' });
  });

  it('maps the feed tabs onto backend event types', () => {
    expect(toEventListParams('plans', 'all', 'recent', '').type).toBe('plan');
    expect(toEventListParams('wishes', 'all', 'recent', '').type).toBe('wish');
  });

  it('narrows visibility to direct friends only when asked', () => {
    expect(toEventListParams('all', 'direct', 'recent', '').visible).toBe('friends');
    expect(toEventListParams('all', 'all', 'recent', '').visible).toBeUndefined();
  });

  it('passes the search term as a title filter', () => {
    expect(toEventListParams('all', 'all', 'recent', 'picnic').title).toBe('picnic');
    expect(toEventListParams('all', 'all', 'recent', '').title).toBeUndefined();
  });

  it('drops social heat sorting while no single event type is selected', () => {
    expect(toEventListParams('all', 'all', 'heat', '').sort).toBe('recent');
    expect(toEventListParams('plans', 'all', 'heat', '').sort).toBe('heat');
  });
});

describe('normalizeSort', () => {
  it('keeps every other sort untouched', () => {
    expect(normalizeSort('all', 'soonest')).toBe('soonest');
    expect(normalizeSort('wishes', 'heat')).toBe('heat');
  });
});
