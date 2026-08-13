// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('sends the current value when Enter is pressed', () => {
    const onSearch = vi.fn();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search events');

    fireEvent.change(input, { target: { value: 'birthday party' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(onSearch).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('birthday party');
  });
});
