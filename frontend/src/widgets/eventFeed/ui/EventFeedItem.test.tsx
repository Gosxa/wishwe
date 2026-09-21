// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EventFeedItem } from './EventFeedItem';
import s from './eventFeed.module.scss';

describe('EventFeedItem', () => {
  afterEach(cleanup);

  const item = () => screen.getByTestId('card').parentElement?.parentElement;

  const endAnimationOn = (node: Element) => {
    fireEvent(node, new Event('animationend', { bubbles: true }));
    fireEvent(node, new Event('webkitAnimationEnd', { bubbles: true }));
  };

  it('does not reveal a card that was already in the feed', () => {
    render(
      <EventFeedItem>
        <div data-testid="card" />
      </EventFeedItem>,
    );

    expect(item()?.className).not.toContain(s.itemRevealing);
  });

  it('reveals a freshly arrived card until its own animation ends', () => {
    render(
      <EventFeedItem reveal>
        <div data-testid="card" />
      </EventFeedItem>,
    );

    expect(item()?.className).toContain(s.itemRevealing);

    endAnimationOn(item() as HTMLElement);

    expect(item()?.className).not.toContain(s.itemRevealing);
  });

  it('ignores animations bubbling up from the card itself', () => {
    render(
      <EventFeedItem reveal>
        <div data-testid="card" />
      </EventFeedItem>,
    );

    endAnimationOn(screen.getByTestId('card'));

    expect(item()?.className).toContain(s.itemRevealing);
  });

  it('keeps revealing after the feed drops the flag', () => {
    const { rerender } = render(
      <EventFeedItem reveal>
        <div data-testid="card" />
      </EventFeedItem>,
    );

    rerender(
      <EventFeedItem>
        <div data-testid="card" />
      </EventFeedItem>,
    );

    expect(item()?.className).toContain(s.itemRevealing);
  });

  it('enters in the direction the active filter asks for', () => {
    render(
      <EventFeedItem enter="right">
        <div data-testid="card" />
      </EventFeedItem>,
    );

    expect(item()?.className).toContain(s.itemEnterRight);
  });

  it('staggers the entrance and caps the delay at the sixth item', () => {
    const { rerender } = render(
      <EventFeedItem enter="fade" enterIndex={2}>
        <div data-testid="card" />
      </EventFeedItem>,
    );

    const delay = (node: Element | null | undefined) =>
      (node as HTMLElement | null | undefined)?.style.getPropertyValue(
        '--item-enter-delay',
      );

    expect(delay(item())).toBe('90ms');

    rerender(
      <EventFeedItem enter="fade" enterIndex={9}>
        <div data-testid="card" />
      </EventFeedItem>,
    );

    expect(delay(item())).toBe('270ms');
  });

  it('drops the entrance class once its animation finishes', () => {
    render(
      <EventFeedItem enter="left">
        <div data-testid="card" />
      </EventFeedItem>,
    );

    const body = screen.getByTestId('card').parentElement as HTMLElement;

    endAnimationOn(body);

    expect(item()?.className).not.toContain(s.itemEnterLeft);
  });

  it('prefers the reveal animation over the filter entrance', () => {
    render(
      <EventFeedItem reveal enter="left">
        <div data-testid="card" />
      </EventFeedItem>,
    );

    expect(item()?.className).toContain(s.itemRevealing);
    expect(item()?.className).not.toContain(s.itemEnterLeft);
  });
});
