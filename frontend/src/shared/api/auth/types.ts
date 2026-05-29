type Flow = 'register' | 'login';

type CheckMailRes = {
  flow: Flow;
};

type VerifyMailRes = {
  verification_token: string;
};

export type { CheckMailRes, VerifyMailRes };
