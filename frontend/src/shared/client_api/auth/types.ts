export type Profile = {
  id: number;
  user: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  city: string | null;
  gender: 'Male' | 'Female' | null;
  avatar: string | null;
  social_media_url: string | null;
  is_private: boolean;
};

export type CheckEmailRes = { flow: 'login' | 'register' };

export type VerifyCodeRes = { verification_token: string };

export type RegisterParams = {
  token: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
};
