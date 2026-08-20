// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Area } from 'react-easy-crop';

type CropperProps = {
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  cropShape: string;
  showGrid: boolean;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (area: Area, pixels: Area) => void;
};

const cropperMocks = vi.hoisted(() => ({
  props: [] as CropperProps[],
}));

const cropImageMock = vi.hoisted(() => vi.fn());

vi.mock('react-easy-crop', () => ({
  default: (props: CropperProps) => {
    cropperMocks.props.push(props);

    return <div data-testid="cropper" data-image={props.image} />;
  },
}));

vi.mock('./cropImage', () => ({ cropImage: cropImageMock }));

import { AvatarCrop } from './AvatarCrop';

const PIXELS: Area = { x: 10, y: 20, width: 200, height: 200 };

const lastCropperProps = () =>
  cropperMocks.props[cropperMocks.props.length - 1];

const renderCrop = (props: Partial<ComponentProps<typeof AvatarCrop>> = {}) =>
  render(
    <AvatarCrop
      imageSrc="data:image/png;base64,original"
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...props}
    />,
  );

const completeCrop = (pixels: Area = PIXELS) =>
  act(() => {
    lastCropperProps().onCropComplete({ ...pixels }, pixels);
  });

const apply = () => screen.getByRole('button', { name: 'Apply' });

const cancel = () => screen.getByRole('button', { name: 'Cancel' });

describe('AvatarCrop', () => {
  beforeEach(() => {
    cropperMocks.props.length = 0;
    cropImageMock.mockReset();
    cropImageMock.mockResolvedValue('data:image/jpeg;base64,cropped');
    document.body.style.overflow = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a labelled dialog into the document body', () => {
    renderCrop();

    const dialog = screen.getByRole('dialog');

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Crop profile photo');
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('feeds the source image into a round 1:1 cropper', () => {
    renderCrop({ imageSrc: 'blob:local/avatar' });

    expect(screen.getByTestId('cropper').getAttribute('data-image')).toBe(
      'blob:local/avatar',
    );
    expect(lastCropperProps().aspect).toBe(1);
    expect(lastCropperProps().cropShape).toBe('round');
    expect(lastCropperProps().showGrid).toBe(false);
    expect(lastCropperProps().crop).toEqual({ x: 0, y: 0 });
    expect(lastCropperProps().zoom).toBe(1);
  });

  it('keeps the cropper controlled while the user pans and zooms', () => {
    renderCrop();

    act(() => lastCropperProps().onCropChange({ x: 12, y: -4 }));
    expect(lastCropperProps().crop).toEqual({ x: 12, y: -4 });

    act(() => lastCropperProps().onZoomChange(2.5));
    expect(lastCropperProps().zoom).toBe(2.5);
  });

  it('crops the image and hands the result to the caller on apply', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderCrop({
      imageSrc: 'data:image/png;base64,original',
      onConfirm,
      onCancel,
    });

    await completeCrop();

    await act(async () => {
      fireEvent.click(apply());
    });

    expect(cropImageMock).toHaveBeenCalledWith(
      'data:image/png;base64,original',
      PIXELS,
    );
    expect(onConfirm).toHaveBeenCalledWith('data:image/jpeg;base64,cropped');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('crops the latest selection when the user adjusts it twice', async () => {
    renderCrop();

    await completeCrop();
    await completeCrop({ x: 0, y: 0, width: 50, height: 50 });

    await act(async () => {
      fireEvent.click(apply());
    });

    expect(cropImageMock).toHaveBeenCalledTimes(1);
    expect(cropImageMock.mock.calls[0][1]).toEqual({
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    });
  });

  it('does nothing on apply before the cropper reports a selection', async () => {
    const onConfirm = vi.fn();

    renderCrop({ onConfirm });

    await act(async () => {
      fireEvent.click(apply());
    });

    expect(cropImageMock).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels without cropping', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderCrop({ onConfirm, onCancel });

    await completeCrop();
    fireEvent.click(cancel());

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(cropImageMock).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does not dismiss on an overlay click', async () => {
    const onCancel = vi.fn();

    renderCrop({ onCancel });

    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;

    fireEvent.click(overlay);
    fireEvent.click(screen.getByRole('dialog'));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('locks body scrolling while cropping and restores it afterwards', () => {
    const { unmount } = renderCrop();

    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
