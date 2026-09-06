import {
  EventFeedDropdown,
  EventFeedToolbar,
  type EventFeedOption,
} from '@widgets/eventFeed';
import type {
  FeedFilter,
  FeedReach,
  SortOption,
} from '@client_pages/home/model/types';
import s from './feedToolbar.module.scss';

type Props = {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  activeReach: FeedReach;
  onReachChange: (reach: FeedReach) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
};

const filters: EventFeedOption<FeedFilter>[] = [
  { key: 'all', label: 'All' },
  { key: 'plans', label: 'Plans' },
  { key: 'wishes', label: 'Wishes' },
];

const reachOptions: EventFeedOption<FeedReach>[] = [
  { key: 'all', label: 'All updates' },
  { key: 'direct', label: 'Only direct friends' },
];

const sortOptions: EventFeedOption<SortOption>[] = [
  { key: 'soonest', label: 'soonest first' },
  { key: 'recent', label: 'recently added' },
  { key: 'heat', label: 'social heat' },
];

export const FeedToolbar = ({
  activeFilter,
  onFilterChange,
  activeReach,
  onReachChange,
  activeSort,
  onSortChange,
}: Props) => {
  const visibleSortOptions =
    activeFilter === 'all'
      ? sortOptions.filter(option => option.key !== 'heat')
      : sortOptions;

  return (
    <EventFeedToolbar
      options={filters}
      value={activeFilter}
      onChange={onFilterChange}
      tourId="feed-toolbar"
      controls={
        <>
          <EventFeedDropdown
            label="Show:"
            value={activeReach}
            options={reachOptions}
            onChange={onReachChange}
          />
          <EventFeedDropdown
            label="Sort:"
            value={activeSort}
            options={visibleSortOptions}
            onChange={onSortChange}
            mobileContent={
              <>
                <fieldset className={s.group}>
                  <legend>Sort</legend>
                  {[
                    { key: 'recent' as const, label: 'Recently added' },
                    { key: 'soonest' as const, label: 'Soonest first' },
                  ].map(option => (
                    <label key={option.key} className={s.option}>
                      <input
                        type="radio"
                        name="feed-sort"
                        value={option.key}
                        checked={activeSort === option.key}
                        onChange={() => onSortChange(option.key)}
                      />
                      {option.label}
                    </label>
                  ))}
                </fieldset>
                <fieldset className={s.group}>
                  <legend>Show</legend>
                  {reachOptions.map(option => (
                    <label key={option.key} className={s.option}>
                      <input
                        type="radio"
                        name="feed-reach"
                        value={option.key}
                        checked={activeReach === option.key}
                        onChange={() => onReachChange(option.key)}
                      />
                      {option.label}
                    </label>
                  ))}
                </fieldset>
              </>
            }
          />
        </>
      }
    />
  );
};
