import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FriendRequestCard } from '@/components/friends/friend-request-card';
import { FriendRow } from '@/components/friends/friend-row';
import { FriendsHeader } from '@/components/friends/friends-header';
import {
  FriendsSegmentedControl,
  type FriendsView,
} from '@/components/friends/friends-segmented-control';
import { Colors, Fonts } from '@/constants/theme';
import {
  acceptFriendRequest,
  declineFriendRequest,
  listFriends,
  listIncomingFriendRequests,
  removeFriend,
} from '@/lib/api/friends';
import {
  mapFriend,
  mapFriendRequest,
  type Friend,
  type FriendRequest,
} from '@/lib/friends/types';

type PendingRequest = { id: number; action: 'accept' | 'decline' } | null;

export function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Friend | FriendRequest>>(null);
  const mounted = useRef(true);
  const loadingMore = useRef(false);
  const loadVersion = useRef(0);
  const [view, setView] = useState<FriendsView>('friends');
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [nextFriendsPage, setNextFriendsPage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFriendId, setPendingFriendId] = useState<number | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>(null);

  const load = useCallback(async (refreshing = false) => {
    const version = ++loadVersion.current;

    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [friendsPage, incoming] = await Promise.all([
        listFriends(),
        listIncomingFriendRequests(),
      ]);

      if (!mounted.current || version !== loadVersion.current) return;

      setFriends(friendsPage.results.map(mapFriend));
      setRequests(incoming.map(mapFriendRequest));
      setNextFriendsPage(friendsPage.next ? 2 : null);
      setError(null);
    } catch {
      if (mounted.current && version === loadVersion.current)
        setError('We could not load your friends. Please try again.');
    } finally {
      if (mounted.current && version === loadVersion.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const version = ++loadVersion.current;

    mounted.current = true;

    Promise.all([listFriends(), listIncomingFriendRequests()])
      .then(([friendsPage, incoming]) => {
        if (cancelled || version !== loadVersion.current) return;

        setFriends(friendsPage.results.map(mapFriend));
        setRequests(incoming.map(mapFriendRequest));
        setNextFriendsPage(friendsPage.next ? 2 : null);
        setError(null);
      })
      .catch(() => {
        if (!cancelled && version === loadVersion.current) {
          setError('We could not load your friends. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled && version === loadVersion.current) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      mounted.current = false;
      loadVersion.current += 1;
    };
  }, []);

  const normalizedSearch = search.trim().replace(/^@/, '').toLocaleLowerCase();
  const visibleFriends = useMemo(
    () =>
      normalizedSearch
        ? friends.filter((friend) =>
            friend.username.toLocaleLowerCase().includes(normalizedSearch),
          )
        : friends,
    [friends, normalizedSearch],
  );
  const visibleRequests = useMemo(
    () =>
      normalizedSearch
        ? requests.filter((request) =>
            request.username.toLocaleLowerCase().includes(normalizedSearch),
          )
        : requests,
    [normalizedSearch, requests],
  );

  const loadMoreFriends = useCallback(async () => {
    if (
      view !== 'friends' ||
      !nextFriendsPage ||
      loadingMore.current
    )
      return;

    loadingMore.current = true;
    setIsLoadingMore(true);
    try {
      const page = await listFriends(nextFriendsPage);
      if (!mounted.current) return;

      setFriends((current) => [...current, ...page.results.map(mapFriend)]);
      setNextFriendsPage(page.next ? nextFriendsPage + 1 : null);
    } finally {
      loadingMore.current = false;
      if (mounted.current) setIsLoadingMore(false);
    }
  }, [nextFriendsPage, view]);

  const confirmRemove = useCallback((friend: Friend) => {
    Alert.alert(
      'Remove friend?',
      `@${friend.username} will be removed from your friends.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setPendingFriendId(friend.friendshipId);
            try {
              await removeFriend(friend.friendshipId);
              if (mounted.current) {
                setFriends((current) =>
                  current.filter(
                    (item) => item.friendshipId !== friend.friendshipId,
                  ),
                );
              }
            } catch {
              if (mounted.current)
                Alert.alert('Could not remove friend', 'Please try again.');
            } finally {
              if (mounted.current) setPendingFriendId(null);
            }
          },
        },
      ],
    );
  }, []);

  const respond = useCallback(
    async (request: FriendRequest, action: 'accept' | 'decline') => {
      setPendingRequest({ id: request.id, action });

      try {
        if (action === 'accept') await acceptFriendRequest(request.id);
        else await declineFriendRequest(request.id);
      } catch {
        if (mounted.current)
          Alert.alert('Could not update request', 'Please try again.');
        return;
      } finally {
        if (mounted.current) setPendingRequest(null);
      }

      if (!mounted.current) return;
      setRequests((current) =>
        current.filter((item) => item.id !== request.id),
      );

      if (action === 'accept') {
        try {
          const page = await listFriends();
          if (!mounted.current) return;
          setFriends(page.results.map(mapFriend));
          setNextFriendsPage(page.next ? 2 : null);
        } catch {
          if (mounted.current) {
            Alert.alert(
              'Request accepted',
              'Refresh the screen to update your friends list.',
            );
          }
        }
      }
    },
    [],
  );

  const changeView = useCallback(
    (next: FriendsView) => {
      if (next === view) return;

      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      setView(next);
    },
    [view],
  );

  const gapStyle = useAnimatedStyle(() => ({
    height: withTiming(view === 'friends' ? 40 : 47, { duration: 220 }),
  }));
  const itemEntering = view === 'friends' ? FadeInLeft : FadeInRight;

  const data = view === 'friends' ? visibleFriends : visibleRequests;
  const emptyMessage = normalizedSearch
    ? 'No matching people found.'
    : view === 'friends'
      ? 'Your friends will appear here.'
      : 'You have no new friend requests.';

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => `${view}-${item.id}`}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={itemEntering
              .duration(260)
              .delay(Math.min(index, 6) * 45)}
          >
            {view === 'friends' ? (
              <FriendRow
                friend={item as Friend}
                isPending={pendingFriendId === (item as Friend).friendshipId}
                onRemove={confirmRemove}
              />
            ) : (
              <FriendRequestCard
                request={item as FriendRequest}
                pendingAction={
                  pendingRequest?.id === item.id ? pendingRequest.action : null
                }
                onAccept={(request) => void respond(request, 'accept')}
                onDecline={(request) => void respond(request, 'decline')}
              />
            )}
          </Animated.View>
        )}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 23 }}>
            <FriendsHeader search={search} onSearchChange={setSearch} />
            <FriendsSegmentedControl value={view} onChange={changeView} />
            <Animated.View style={gapStyle} />
          </View>
        }
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
                accessibilityLabel="Try loading friends again"
                style={({ pressed }) => [
                  styles.retry,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <Animated.View
              key={view}
              entering={FadeIn.duration(240)}
              style={styles.centered}
            >
              <Text style={styles.stateText}>{emptyMessage}</Text>
            </Animated.View>
          )
        }
        ItemSeparatorComponent={
          view === 'friends' ? FriendSeparator : RequestSeparator
        }
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator color={Colors.primary} /> : null
        }
        contentContainerStyle={[
          styles.content,
          data.length === 0 && styles.emptyContent,
        ]}
        onEndReached={() => void loadMoreFriends()}
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

function FriendSeparator() {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.friendSeparator}
    >
      <View style={styles.separatorLine} />
    </Animated.View>
  );
}

function RequestSeparator() {
  return <View style={styles.requestSeparator} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyContent: {
    flexGrow: 1,
  },
  friendSeparator: {
    height: 17,
    justifyContent: 'center',
  },
  separatorLine: {
    height: 1,
    backgroundColor: Colors.hairline,
  },
  requestSeparator: {
    height: 16,
  },
  centered: {
    flex: 1,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
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
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    color: Colors.cream,
  },
  pressed: {
    opacity: 0.7,
  },
});
