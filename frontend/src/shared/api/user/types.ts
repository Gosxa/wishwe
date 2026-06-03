type Profile = {
  id: number;
  user: string;
  userName: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  city: string | null;
  gender: 'Male' | 'Female' | null;
  avatar: string | null;
  social_media_url: string | null;
};

export type { Profile };
