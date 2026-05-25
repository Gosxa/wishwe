import { navConfig } from '../model/navConfig';
import { NavItem } from './NavItem';
import s from '../sidebar.module.scss';

type Props = {
  activeKey?: string;
};

export const Sidebar = ({ activeKey }: Props) => (
  <nav className={s.sidebar}>
    {navConfig.map(item => (
      <NavItem
        key={item.key}
        Icon={item.Icon}
        label={item.label}
        isActive={item.key === activeKey}
      />
    ))}
  </nav>
);
