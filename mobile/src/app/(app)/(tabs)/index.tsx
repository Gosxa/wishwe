import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { FeedEmptyState } from '@/components/feed/feed-empty-state';
import { FeedErrorState } from '@/components/feed/feed-error-state';
import { FeedEventCard } from '@/components/feed/feed-event-card';
import { FeedHeader } from '@/components/feed/feed-header';
import { FeedToolbar } from '@/components/feed/feed-toolbar';
import { Colors, Spacing } from '@/constants/theme';
import { useFeedEvents } from '@/lib/events/use-feed-events';
import type { FeedEvent } from '@/lib/events/types';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    events,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    error,
    loadMore,
    refresh,
    retry,
    applyEvent,
    filter,
    setFilter,
    reach,
    setReach,
    sort,
    setSort,
    search,
    setSearch,
    hasSearch,
  } = useFeedEvents();

  const openEvent = useCallback(
    (event: FeedEvent) => router.push({ pathname: '/event/[id]', params: { id: event.id } }),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedEvent }) => (
      <FeedEventCard event={item} onOpen={openEvent} onChange={applyEvent} />
    ),
    [applyEvent, openEvent],
  );

  const listEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      );
    }

    if (error) {
      return <FeedErrorState message={error} onRetry={retry} />;
    }

    return <FeedEmptyState filter={filter} hasSearch={hasSearch} />;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <FeedHeader search={search} onSearchChange={setSearch} />
        <FeedToolbar
          filter={filter}
          onFilterChange={setFilter}
          reach={reach}
          onReachChange={setReach}
          sort={sort}
          onSortChange={setSort}
        />
      </View>

      <FlatList
        data={events}
        keyExtractor={(event) => event.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, events.length === 0 && styles.listEmpty]}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : null
        }
        onEndReached={hasMore && !isLoading ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />
    </View>
  );
}

const ListSeparator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: Spacing.five,
  },
  centered: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  footer: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
});
