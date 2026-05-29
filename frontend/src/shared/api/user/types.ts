type Profile = {
  id: number;
  user: string;
  userName: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  date_of_birth?: string;
  city?: string;
  gender?: 'Male' | 'Female';
  avatar?: string;
  social_media_url?: string;
};

export type { Profile };
