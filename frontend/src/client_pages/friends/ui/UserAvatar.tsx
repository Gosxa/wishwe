import { AvatarImage } from '@shared/ui/avatarImage/AvatarImage';
import s from './userAvatar.module.scss';

type Props = {
  src: string | null;
  alt: string;
};

export const UserAvatar = ({ src, alt }: Props) => (
  <span className={s.avatar}>
    <AvatarImage src={src} alt={alt} fallbackWidth={28} fallbackHeight={28} />
  </span>
);
