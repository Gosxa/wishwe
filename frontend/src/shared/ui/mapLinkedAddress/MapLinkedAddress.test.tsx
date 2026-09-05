// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapLinkedAddress } from './MapLinkedAddress';

describe('MapLinkedAddress', () => {
  afterEach(cleanup);

  it('leaves a hand-typed address as plain text', () => {
    render(<MapLinkedAddress address="Behind the old brewery" />);

    expect(screen.getByText('Behind the old brewery')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('opens a pinned address in a safe new tab', () => {
    render(
      <MapLinkedAddress
        address="Velyka Vasylkivska St, 100, Kyiv"
        placeId="ChIJ123"
      />,
    );

    const link = screen.getByRole('link', { name: /open .* in google maps/i });
    const url = new URL(link.getAttribute('href') as string);

    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(url.searchParams.get('query_place_id')).toBe('ChIJ123');
    fireEvent.mouseEnter(link);
    expect(screen.getByRole('tooltip').textContent).toBe('Open in Google Maps');
  });

  it('shows the tooltip only on hover and dismisses it on click', () => {
    render(<MapLinkedAddress address="Kyiv" placeId="ChIJ123" />);

    const link = screen.getByRole('link');

    expect(screen.queryByRole('tooltip')).toBeNull();
    link.focus();
    expect(screen.queryByRole('tooltip')).toBeNull();

    const bubble = screen.getByRole('tooltip', { hidden: true });

    expect(bubble.hidden).toBe(false);

    fireEvent.mouseEnter(link);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.click(link);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(bubble.hidden).toBe(false);
    expect(document.activeElement).toBe(link);

    fireEvent.mouseLeave(link);
    fireEvent.mouseEnter(link);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.mouseLeave(link);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('does not bubble the address click to an event card', () => {
    const onCardClick = vi.fn();

    render(
      <div onClick={onCardClick}>
        <MapLinkedAddress address="Kyiv" placeId="ChIJ123" />
      </div>,
    );

    fireEvent.click(screen.getByRole('link'));

    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('keeps the last word and arrow icon together in a nowrap container', () => {
    const address = "McDonald's, вулиця Івана Миколайчука 16, Київ, Україна";

    render(<MapLinkedAddress address={address} placeId="ChIJ123" />);

    const link = screen.getByRole('link', {
      name: new RegExp(`open ${address}`, 'i'),
    });
    const nowrapSpan = link.querySelector('span[class*="nowrap"]');

    expect(nowrapSpan).not.toBeNull();
    expect(nowrapSpan?.textContent).toBe('Україна');
    expect(nowrapSpan?.querySelector('svg')).not.toBeNull();
  });

  it('keeps single-word addresses together with the arrow icon', () => {
    render(<MapLinkedAddress address="Kyiv" placeId="ChIJ123" />);

    const link = screen.getByRole('link', {
      name: /open kyiv in google maps/i,
    });
    const nowrapSpan = link.querySelector('span[class*="nowrap"]');

    expect(nowrapSpan).not.toBeNull();
    expect(nowrapSpan?.textContent).toBe('Kyiv');
    expect(nowrapSpan?.querySelector('svg')).not.toBeNull();
  });
});
