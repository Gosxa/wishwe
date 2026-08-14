// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { avatarFormData } from './avatarFormData';

describe('avatarFormData', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('decodes the crop data URL into one named multipart image', async () => {
    const dataUrl = 'data:image/png;base64,YXZhdGFy';
    const blob = new Blob(['avatar'], { type: 'image/png' });
    const readBlob = vi.fn().mockResolvedValue(blob);
    const fetchMock = vi.fn().mockResolvedValue({ blob: readBlob });

    vi.stubGlobal('fetch', fetchMock);

    const result = await avatarFormData(dataUrl);
    const avatar = result.get('avatar');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(dataUrl);
    expect(readBlob).toHaveBeenCalledOnce();
    expect([...result.keys()]).toEqual(['avatar']);
    expect(avatar).toBeInstanceOf(File);

    if (avatar instanceof File) {
      expect(avatar.name).toBe('avatar.png');
      expect(avatar.type).toBe('image/png');
      expect(avatar.size).toBe(blob.size);
    }
  });

  it('falls back to a JPEG filename when the decoded blob has no subtype', async () => {
    const blob = new Blob(['avatar']);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ blob: vi.fn().mockResolvedValue(blob) }),
    );

    const result = await avatarFormData('data:;base64,YXZhdGFy');
    const avatar = result.get('avatar');

    expect(avatar).toBeInstanceOf(File);

    if (avatar instanceof File) {
      expect(avatar.name).toBe('avatar.jpeg');
      expect(avatar.type).toBe('');
    }
  });

  it('rejects when the crop data cannot be decoded', async () => {
    const error = new Error('Invalid data URL');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(avatarFormData('invalid-data')).rejects.toBe(error);
  });
});
