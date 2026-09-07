// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SharePreview } from './SharePreview';

afterEach(cleanup);

describe('SharePreview', () => {
  it('shows a usable link-only fallback when image preparation fails', () => {
    const onSelect = vi.fn();
    const onMove = vi.fn();

    render(
      <SharePreview
        eventTitle="Weekend trip"
        activeFormat="poster"
        imageError
        onSelect={onSelect}
        onMove={onMove}
      />,
    );

    expect(
      screen.getByRole('status', {
        name: 'Share image could not be prepared',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Couldn't prepare the image. Link sharing is still available.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: 'Previous share format' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next share format' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Story' }));

    expect(onMove).toHaveBeenNthCalledWith(1, -1);
    expect(onMove).toHaveBeenNthCalledWith(2, 1);
    expect(onSelect).toHaveBeenCalledWith('story');
  });
});
