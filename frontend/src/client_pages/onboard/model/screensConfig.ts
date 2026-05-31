type CreatePasswordVariant = 'register' | 'reset';
type DoneScreenVariant = 'create' | 'reset';
type PersonalDataVariant = 'google' | 'email';
type VerifyEmailVariant = 'register' | 'reset';

const SCREEN_ID = {
  LOGIN_SCREEN: 0,
  ENTER_EMAIL: 1,
  VERIFY_REGISTER: 2,
  ENTER_PWD: 3,
  CREATE_PWD: 4,
  RESET_PWD: 5,
  PERSONAL_GOOGLE: 6,
  PERSONAL_MAIL: 7,
  DONE_ONBOARD: 8,
  DONE_RESET: 9,
  VERIFY_RESET: 10,
} as const;

type ScreenId = (typeof SCREEN_ID)[keyof typeof SCREEN_ID];

export { SCREEN_ID };
export type {
  ScreenId,
  CreatePasswordVariant,
  DoneScreenVariant,
  PersonalDataVariant,
  VerifyEmailVariant,
};
