import type { ComponentType } from 'react';
import { HomeIcon, FriendsIcon, ProfileIcon } from '@shared/ui/icons';

export type NavConfigItem = {
  key: string;
  label: string;
  href: string;
  Icon: ComponentType;
};

export const navConfig: NavConfigItem[] = [
  { key: 'home', label: 'Home', href: '/feed', Icon: HomeIcon },
  { key: 'friends', label: 'Friends', href: '/friends', Icon: FriendsIcon },
  { key: 'profile', label: 'Profile', href: '/profile', Icon: ProfileIcon },
];
