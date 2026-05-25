import { BellDot, Gear, Logo } from '@shared/ui/icons';
import { SearchBar } from './SearchBar';
import { CreateButton } from './CreateButton';
import s from '../header.module.scss';

export const Header = () => (
  <header className={s.header}>
    <div className={s.logoSlot}>
      <Logo height={36} />
    </div>
    <SearchBar />
    <CreateButton />
    <div className={s.actions}>
      <button className={s.iconBtn}>
        <BellDot />
      </button>
      <button className={s.iconBtn}>
        <Gear />
      </button>
    </div>
  </header>
);
