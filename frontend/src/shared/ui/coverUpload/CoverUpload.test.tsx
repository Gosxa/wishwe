// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCoverImageAcceptAttribute } from '@shared/lib/validation/imageUpload';

import { CoverUpload } from './CoverUpload';
import s from './coverUpload.module.scss';

const imageFile = (name = 'cover.png') =>
  new File(['cover'], name, { type: 'image/png' });

type Props = Parameters<typeof CoverUpload>[0];

describe('CoverUpload', () => {
  afterEach(cleanup);

  const renderUpload = (props: Partial<Props> = {}) => {
    const onSelect = vi.fn();
    const view = render(
      <CoverUpload
        previewUrl={null}
        isUploading={false}
        isProcessing={false}
        onSelect={onSelect}
        {...props}
      />,
    );
    const fileInput = view.container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const dropArea = fileInput.parentElement as HTMLElement;

    return { ...view, onSelect, fileInput, dropArea };
  };

  it('accepts the supported cover image formats', () => {
    const { fileInput } = renderUpload();

    expect(fileInput.getAttribute('accept')).toBe(
      getCoverImageAcceptAttribute(),
    );
    expect(fileInput.hasAttribute('hidden')).toBe(true);
  });

  it('opens the hidden picker from the browse button', () => {
    const { fileInput } = renderUpload();
    const click = vi.spyOn(fileInput, 'click');

    fireEvent.click(screen.getByRole('button', { name: 'Browse' }));

    expect(click).toHaveBeenCalled();
  });

  it('reports a picked file and resets the input so it can be picked again', () => {
    const { fileInput, onSelect } = renderUpload();
    const file = imageFile();
    const assignedValues: string[] = [];

    Object.defineProperty(fileInput, 'value', {
      configurable: true,
      get: () => '',
      set: (next: string) => assignedValues.push(next),
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onSelect).toHaveBeenCalledWith(file);
    expect(assignedValues).toEqual(['']);

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(assignedValues).toEqual(['', '']);
  });

  it('ignores a picker change that carries no file', () => {
    const { fileInput, onSelect } = renderUpload();

    fireEvent.change(fileInput, { target: { files: [] } });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('tracks the drag state and selects the dropped file', () => {
    const { dropArea, onSelect } = renderUpload();
    const file = imageFile();

    fireEvent.dragOver(dropArea);
    expect(dropArea.classList.contains(s.dragging)).toBe(true);

    fireEvent.dragLeave(dropArea);
    expect(dropArea.classList.contains(s.dragging)).toBe(false);

    fireEvent.dragOver(dropArea);
    fireEvent.drop(dropArea, { dataTransfer: { files: [file] } });

    expect(dropArea.classList.contains(s.dragging)).toBe(false);
    expect(onSelect).toHaveBeenCalledWith(file);
  });

  it('ignores an empty drop', () => {
    const { dropArea, onSelect } = renderUpload();

    fireEvent.drop(dropArea, { dataTransfer: { files: [] } });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('refuses drag and drop while busy', () => {
    const { dropArea, onSelect } = renderUpload({ isProcessing: true });

    fireEvent.dragOver(dropArea);
    expect(dropArea.classList.contains(s.dragging)).toBe(false);

    fireEvent.drop(dropArea, { dataTransfer: { files: [imageFile()] } });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('locks the empty state while an image is being processed', () => {
    renderUpload({ isProcessing: true });

    const button = screen.getByRole('button', { name: 'Processing...' });

    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows the preview with a change action and swaps it when it changes', () => {
    const { rerender, onSelect, fileInput } = renderUpload({
      previewUrl: 'blob:first',
    });

    const preview = screen.getByRole('img', { name: 'Event cover' });

    expect(preview.getAttribute('src')).toBe('blob:first');
    expect(screen.queryByRole('button', { name: 'Browse' })).toBeNull();

    const click = vi.spyOn(fileInput, 'click');

    fireEvent.click(screen.getByRole('button', { name: 'Change photo' }));
    expect(click).toHaveBeenCalled();

    rerender(
      <CoverUpload
        previewUrl="blob:second"
        isUploading={false}
        isProcessing={false}
        onSelect={onSelect}
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Event cover' }).getAttribute('src'),
    ).toBe('blob:second');
  });

  it('reports processing and uploading states on the preview action', () => {
    const { rerender, onSelect } = renderUpload({
      previewUrl: 'blob:first',
      isProcessing: true,
    });

    expect(
      (
        screen.getByRole('button', {
          name: 'Processing...',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    rerender(
      <CoverUpload
        previewUrl="blob:first"
        isUploading
        isProcessing={false}
        onSelect={onSelect}
      />,
    );

    expect(
      (
        screen.getByRole('button', {
          name: 'Uploading...',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('renders the error message', () => {
    renderUpload({ error: 'Unsupported image format' });

    expect(screen.getByText('Unsupported image format')).toBeTruthy();
  });
});
