import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ActivityHeader } from '@/components/activity/activity-header';
import { ActivityItemRow, ActivitySeparator } from '@/components/activity/activity-item';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import {
  listNotifications,
  markNotificationAsRead,
  readAllNotifications,
} from '@/lib/api/notifications';
import { mapNotification, type ActivityItem } from '@/lib/activity/types';

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  const mounted = useRef(true);
  const loadingMore = useRef(false);
  const loadVersion = useRef(0);

  const [search, setSearch] = useState('');
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAllReadInBackground = useCallback((currentItems: ActivityItem[]) => {
    const hasUnread = currentItems.some((item) => !item.isRead);
    if (!hasUnread) return;

    readAllNotifications()
      .then(() => {
        if (!mounted.current) return;
        setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      })
      .catch(() => {
        // Silently ignore
      });
  }, []);

  const load = useCallback(
    async (refreshing = false) => {
      const version = ++loadVersion.current;

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const page = await listNotifications(1);

        if (!mounted.current || version !== loadVersion.current) return;

        const mapped = page.results.map((notification) => mapNotification(notification));
        setItems(mapped);
        setNextPage(page.next ? 2 : null);
        setError(null);

        markAllReadInBackground(mapped);
      } catch {
        if (mounted.current && version === loadVersion.current) {
          setError('We could not load your activity. Please try again.');
        }
      } finally {
        if (mounted.current && version === loadVersion.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [markAllReadInBackground],
  );

  useEffect(() => {
    let cancelled = false;
    const version = ++loadVersion.current;

    mounted.current = true;

    listNotifications(1)
      .then((page) => {
        if (cancelled || version !== loadVersion.current) return;

        const mapped = page.results.map((notification) => mapNotification(notification));
        setItems(mapped);
        setNextPage(page.next ? 2 : null);
        setError(null);

        markAllReadInBackground(mapped);
      })
      .catch(() => {
        if (!cancelled && version === loadVersion.current) {
          setError('We could not load your activity. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled && version === loadVersion.current) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      mounted.current = false;
      loadVersion.current += 1;
    };
  }, [markAllReadInBackground]);

  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore.current) return;

    loadingMore.current = true;
    setIsLoadingMore(true);

    try {
      const page = await listNotifications(nextPage);
      if (!mounted.current) return;

      const mapped = page.results.map((notification) => mapNotification(notification));
      setItems((prev) => [...prev, ...mapped]);
      setNextPage(page.next ? nextPage + 1 : null);
    } catch {
      // Keep existing list on pagination failure
    } finally {
      loadingMore.current = false;
      if (mounted.current) {
        setIsLoadingMore(false);
      }
    }
  }, [nextPage]);

  const handleItemPress = useCallback(
    (item: ActivityItem) => {
      if (!item.isRead) {
        void markNotificationAsRead(item.id);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)),
        );
      }

      if (item.relatedObjectType === 'event' && item.relatedObjectId) {
        router.push({
          pathname: '/event/[id]',
          params: { id: String(item.relatedObjectId) },
        });
      } else if (item.relatedObjectType === 'friendship') {
        router.push('/friends');
      }
    },
    [router],
  );

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = useMemo(() => {
    if (!normalizedSearch) return items;
    return items.filter(
      (item) =>
        item.message.toLowerCase().includes(normalizedSearch) ||
        item.title.toLowerCase().includes(normalizedSearch),
    );
  }, [items, normalizedSearch]);

  const handleSearchSubmit = useCallback(() => {
    if (normalizedSearch && visibleItems.length === 0) {
      router.push({ pathname: '/', params: { search: search.trim() } });
    }
  }, [normalizedSearch, visibleItems.length, search, router]);

  const topInset = Math.max(insets.top, 16) + 16;

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: topInset }}>
        <ActivityHeader
          search={search}
          onSearchChange={setSearch}
          onSubmitSearch={handleSearchSubmit}
        />
      </View>

      <FlatList
        data={visibleItems}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeIn.duration(240).delay(Math.min(index, 6) * 40)
            }
          >
            <ActivityItemRow item={item} onPress={handleItemPress} />
          </Animated.View>
        )}
        ListHeaderComponent={
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Activity</Text>
          </View>
        }
        ItemSeparatorComponent={ActivitySeparator}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable
                onPress={() => void load()}
                accessibilityRole="button"
                accessibilityLabel="Try loading activity again"
                style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.duration(240)}
              style={styles.centered}
            >
              <Text style={styles.stateText}>
                {normalizedSearch
                  ? 'No matching activities found.'
                  : 'No activity yet.'}
              </Text>
              {normalizedSearch ? (
                <Pressable
                  onPress={handleSearchSubmit}
                  accessibilityRole="button"
                  accessibilityLabel="Search events in feed"
                  style={({ pressed }) => [
                    styles.searchInFeed,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.searchInFeedText}>Search events in Feed</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.content,
          visibleItems.length === 0 && styles.emptyContent,
        ]}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void load(true)}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  titleContainer: {
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.ink,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  emptyContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  footer: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  stateText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: Colors.muted,
  },
  retry: {
    height: 40,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    color: Colors.cream,
  },
  searchInFeed: {
    height: 36,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  searchInFeedText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
