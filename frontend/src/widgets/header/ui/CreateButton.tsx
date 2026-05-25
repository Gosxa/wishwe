import { Plus } from '@shared/ui/icons';
import s from '../header.module.scss';

type Props = {
  onClick?: () => void;
};

export const CreateButton = ({ onClick }: Props) => (
  <button className={s.createBtn} onClick={onClick}>
    <Plus />
    <span>Create</span>
  </button>
);
