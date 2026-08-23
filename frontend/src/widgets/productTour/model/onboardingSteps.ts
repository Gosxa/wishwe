import type { OnboardingStep } from '@/shared/store/useOnboardingStore';
import { categoryTourId } from '@/shared/lib/formatCategoryName';
import type { TourStep } from './types';

export type OnboardingTourStep = TourStep & { id: OnboardingStep };

type Options = {
  name?: string | null;
  categoryName?: string | null;
  categoryLabel?: string;
};

const CATEGORY_FALLBACK_ANCHORS = [
  'category-food-drinks',
  'category-food-dining',
  'category-coffee-chats',
  'category-picker',
];

export const buildOnboardingSteps = ({
  name,
  categoryName,
  categoryLabel = 'Food & Drinks',
}: Options): OnboardingTourStep[] => [
  {
    id: 'welcome',
    title: name ? `Welcome, ${name} 👋` : 'Welcome to WishWe 🚀',
    body: 'Stop overthinking your meetups. Ready to put your first wish out there? Or maybe a plan? 👀',
    primaryLabel: 'Show me how',
    secondaryLabel: 'Skip for now',
  },
  {
    id: 'create',
    anchor: 'create-event',
    title: 'Great! Tap the +',
    body: 'This is where every idea starts. Give it a tap and let’s get your friends together ✨',
    placement: 'bottom',
    padding: 6,
    awaitAction: true,
  },
  {
    id: 'type',
    anchor: 'event-type-wish',
    title: 'Plan or wish? 🤔',
    body: 'Got a time and a place locked in? That’s a Plan 🏛️ Just floating an idea? That’s a Wish 🧸',
    hint: 'Let’s start with a wish 👇',
    placement: 'bottom',
    padding: 6,
    radius: 12,
    awaitAction: true,
  },
  {
    id: 'category',
    anchor: categoryName
      ? [
          ...new Set([
            categoryTourId(categoryName),
            ...CATEGORY_FALLBACK_ANCHORS,
          ]),
        ]
      : CATEGORY_FALLBACK_ANCHORS,
    title: 'Let’s keep it simple for your first time',
    body: 'A category is how friends spot your idea in the feed.',
    hint: `Pick ${categoryLabel} — a quick coffee is the easiest first wish ☕`,
    placement: 'bottom',
    padding: 6,
    radius: 12,
    awaitAction: true,
  },
  {
    id: 'title',
    anchor: 'field-title',
    title: 'Name it 📝',
    body: 'Inviting beats clever. Fifty characters, tops — or borrow ours.',
    quickFill: { label: 'Use this', value: 'Catch up over coffee or matcha?' },
    placement: 'left',
    padding: 8,
    passthrough: true,
    primaryLabel: 'Next',
  },
  {
    id: 'location',
    anchor: 'field-location',
    title: 'Roughly where? 📍',
    body: 'A wish doesn’t need an exact address — a part of town is plenty.',
    quickFill: { label: 'Use this', value: 'Somewhere downtown' },
    placement: 'left',
    padding: 8,
    passthrough: true,
    primaryLabel: 'Next',
  },
  {
    id: 'description',
    anchor: 'field-description',
    title: 'Add a little colour 💬',
    body: 'Optional — but one line of context is what turns a maybe into a yes.',
    quickFill: {
      label: 'Use this',
      value: 'Weather looks good this weekend, why not sit outside somewhere?',
    },
    placement: 'left',
    padding: 8,
    passthrough: true,
    primaryLabel: 'Next',
  },
  {
    id: 'timeframe',
    anchor: 'field-timeframe',
    title: 'When, roughly? ⏰',
    body: 'No exact date needed. “This weekend” is a perfectly good answer.',
    quickFill: { label: 'Use this', value: 'How about this weekend' },
    placement: 'left',
    padding: 8,
    passthrough: true,
    primaryLabel: 'Next',
  },
  {
    id: 'submit',
    anchor: 'event-submit',
    title: 'That’s everything 🎉',
    body: 'Hit Share and your wish lands in your friends’ feeds right away.',
    placement: 'left',
    padding: 8,
    awaitAction: true,
  },
  {
    id: 'share',
    anchor: 'share-actions',
    title: 'Awesome. Now bring your people! 👯',
    body: 'Drop this link in your group chat. Once your friends join, all their future plans and wishes land right here in your feed 📥',
    placement: 'right',
    padding: 10,
    passthrough: true,
    primaryLabel: 'Got it',
  },
  {
    id: 'done',
    title: 'You’re all set! ✅',
    body: 'Post it wherever your people hang out. We’ll notify you as soon as someone RSVPs 🔔',
    primaryLabel: 'Finish',
  },
];
