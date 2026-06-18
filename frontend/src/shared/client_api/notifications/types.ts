export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type:
    | 'friend_request'
    | 'friend_request_accepted'
    | 'joined_event'
    | 'interested_event'
    | 'event_planned'
    | 'event_start_reminder'
    | 'event_updated'
    | 'event_cancelled';
  recipient: string;
  creator: string;
  related_object_type: 'event' | 'friendship';
  related_object_id: number;
  is_read: boolean;
  created_at: string;
};

export type NotificationsPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: NotificationItem[];
};
