// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProfileStats } from './ProfileStats';

describe('ProfileStats', () => {
  afterEach(cleanup);

  it('pairs every label with its count', () => {
    render(<ProfileStats activeCount={3} archivedCount={8} />);

    const terms = screen.getAllByRole('term').map(node => node.textContent);
    const values = screen
      .getAllByRole('definition')
      .map(node => node.textContent);

    expect(terms).toEqual(['Active events', 'Archived events']);
    expect(values).toEqual(['3', '8']);
  });

  it('keeps both counters visible for an empty profile', () => {
    render(<ProfileStats activeCount={0} archivedCount={0} />);

    expect(screen.getAllByRole('definition').map(n => n.textContent)).toEqual([
      '0',
      '0',
    ]);
  });
});
