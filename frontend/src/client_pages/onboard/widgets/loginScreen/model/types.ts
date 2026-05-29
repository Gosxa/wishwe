type GoogleIdTokenPayload = {
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
};

type GoogleCredentialResponse = {
  credential: string;
};

export type { GoogleIdTokenPayload, GoogleCredentialResponse };
