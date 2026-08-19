import {
  EventFeedDropdown,
  EventFeedToolbar,
  type EventFeedOption,
} from '@widgets/eventFeed';
import type {
  ProfileSort,
  ProfileTab,
} from '@client_pages/profile/model/types';

type Props = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  activeSort: ProfileSort;
  onSortChange: (sort: ProfileSort) => void;
  showArchive?: boolean;
};

const tabs: EventFeedOption<ProfileTab>[] = [
  { key: 'plans', label: 'Plans' },
  { key: 'wishes', label: 'Wishes' },
  { key: 'archive', label: 'Archive' },
];

const sortOptions: EventFeedOption<ProfileSort>[] = [
  { key: 'recent', label: 'recently added' },
  { key: 'soonest', label: 'soonest first' },
];

export const ProfileFeedToolbar = ({
  activeTab,
  onTabChange,
  activeSort,
  onSortChange,
  showArchive = true,
}: Props) => (
  <EventFeedToolbar
    options={tabs.filter(({ key }) => showArchive || key !== 'archive')}
    value={activeTab}
    onChange={onTabChange}
    controls={
      <EventFeedDropdown
        label="Sort:"
        value={activeSort}
        options={sortOptions}
        onChange={onSortChange}
      />
    }
  />
);
