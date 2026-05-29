type Flow = 'register' | 'login';

type CheckMailRes = {
  flow: Flow;
};

type VerifyMailRes = {
  verification_token: string;
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type { CheckMailRes, VerifyMailRes };
export { ApiError };
