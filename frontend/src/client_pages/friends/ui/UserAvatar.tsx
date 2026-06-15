import { Avatar } from '@shared/ui/icons';
import s from './userAvatar.module.scss';

type Props = {
  src: string | null;
  alt: string;
};

export const UserAvatar = ({ src, alt }: Props) => (
  <span className={s.avatar}>
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} />
    ) : (
      <Avatar width={28} height={28} />
    )}
  </span>
);
