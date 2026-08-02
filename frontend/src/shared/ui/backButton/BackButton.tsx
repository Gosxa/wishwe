import { ChevronLeft } from '@shared/ui/icons';

import s from './backButton.module.scss';

type Props = {
  onClick: () => void;
  label: string;
};

export const BackButton = ({ onClick, label }: Props) => (
  <button
    type="button"
    className={s.button}
    onClick={onClick}
    aria-label={label}
  >
    <ChevronLeft />
  </button>
);
