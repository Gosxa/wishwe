import type { ReactNode } from 'react';
import { Archive, CalendarClock } from '@shared/ui/icons';
import s from './profileHeader.module.scss';

type Props = {
  activeCount: number;
  archivedCount: number;
};

type Stat = {
  key: string;
  label: string;
  value: number;
  icon: ReactNode;
  iconClass: string;
};

export const ProfileStats = ({ activeCount, archivedCount }: Props) => {
  const stats: Stat[] = [
    {
      key: 'active',
      label: 'Active events',
      value: activeCount,
      icon: <CalendarClock />,
      iconClass: s.statIconActive,
    },
    {
      key: 'archived',
      label: 'Archived events',
      value: archivedCount,
      icon: <Archive />,
      iconClass: s.statIconArchived,
    },
  ];

  return (
    <dl className={s.stats}>
      {stats.map(({ key, label, value, icon, iconClass }) => (
        <div key={key} className={s.stat}>
          <span className={`${s.statIcon} ${iconClass}`} aria-hidden="true">
            {icon}
          </span>

          <dd className={s.statValue}>{value}</dd>
          <dt className={s.statLabel}>{label}</dt>
        </div>
      ))}
    </dl>
  );
};
