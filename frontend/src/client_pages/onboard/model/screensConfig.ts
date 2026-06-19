type CreatePasswordVariant = 'register' | 'reset';
type DoneScreenVariant = 'create' | 'reset';
type PersonalDataVariant = 'google' | 'email';
type VerifyEmailVariant = 'register' | 'reset';

type InviteContext = {
  token: string;
  username?: string;
  avatar?: string | null;
};

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
  INVITE_REQUEST_SENT: 11,
} as const;

type ScreenId = (typeof SCREEN_ID)[keyof typeof SCREEN_ID];

const getInviteHandle = (username?: string) =>
  username ? `@${username.replace(/^@/, '')}` : '[@username]';

export { SCREEN_ID, getInviteHandle };
export type {
  ScreenId,
  CreatePasswordVariant,
  DoneScreenVariant,
  PersonalDataVariant,
  VerifyEmailVariant,
  InviteContext,
};
