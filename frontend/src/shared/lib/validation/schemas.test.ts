import { describe, expect, it } from 'vitest';
import { NICKNAME_HELPER_TEXT, nicknameSchema } from './nickname';
import { PASSWORD_HELPER_TEXT, passwordSchema } from './password';
import {
  SOCIAL_MEDIA_URL_HELPER_TEXT,
  socialMediaUrlSchema,
} from './socialMediaUrl';

const expectFirstError = (
  result: ReturnType<typeof passwordSchema.safeParse>,
  message: string,
) => {
  expect(result.success).toBe(false);

  if (!result.success) {
    expect(result.error.issues[0]?.message).toBe(message);
  }
};

describe('passwordSchema', () => {
  it.each(['abcdefg1', 'ABCDEFG1', 'Abcdef1!', 'a1'.repeat(32)])(
    'accepts a password meeting the length and character rules: %s',
    value => {
      expect(passwordSchema.safeParse(value).success).toBe(true);
    },
  );

  it.each([
    ['abcdef1', PASSWORD_HELPER_TEXT],
    ['abcdefgh', PASSWORD_HELPER_TEXT],
    ['12345678', PASSWORD_HELPER_TEXT],
  ])('rejects an invalid password: %s', (value, message) => {
    expectFirstError(passwordSchema.safeParse(value), message);
  });
});

describe('nicknameSchema', () => {
  it.each(['amy', `a${'b'.repeat(29)}`, 'amy.travels_2', '123'])(
    'accepts a nickname at the supported boundaries: %s',
    value => {
      expect(nicknameSchema.safeParse(value).success).toBe(true);
    },
  );

  it.each([
    ['am', '3 characters min'],
    [`a${'b'.repeat(30)}`, '30 characters max'],
    ['.amy', 'Cannot start with underscore or dot'],
    ['_amy', 'Cannot start with underscore or dot'],
    ['amy-travels', NICKNAME_HELPER_TEXT],
    ['Amy', 'Nickname must be lowercase'],
  ])('rejects nickname %s with the relevant message', (value, message) => {
    const result = nicknameSchema.safeParse(value);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.map(issue => issue.message)).toContain(
        message,
      );
    }
  });
});

describe('socialMediaUrlSchema', () => {
  const urlPrefix = 'https://example.com/';
  const maxLengthUrl = `${urlPrefix}${'a'.repeat(200 - urlPrefix.length)}`;

  it.each([
    ['', ''],
    ['   ', ''],
    [' https://instagram.com/amy ', 'https://instagram.com/amy'],
    [maxLengthUrl, maxLengthUrl],
  ])('accepts and trims a supported value', (value, expected) => {
    expect(socialMediaUrlSchema.parse(value)).toBe(expected);
  });

  it.each([
    ['instagram.com/amy', SOCIAL_MEDIA_URL_HELPER_TEXT],
    ['not a URL', SOCIAL_MEDIA_URL_HELPER_TEXT],
    [`${maxLengthUrl}a`, '200 characters max'],
  ])('rejects invalid social link %s', (value, message) => {
    const result = socialMediaUrlSchema.safeParse(value);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.map(issue => issue.message)).toContain(
        message,
      );
    }
  });
});
