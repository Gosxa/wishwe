export const EVENT_FORM_COPY = {
  create: {
    title: { plan: 'Create a plan', wish: 'Create a wish' },
    titlePlaceholder: {
      plan: 'e.g., Friday pizza party',
      wish: 'e.g., Picnic in the park',
    },
    locationPlaceholder: {
      plan: 'Name of the spot or address',
      wish: 'Any specific place or area?',
    },
    descriptionPlaceholder: {
      plan: 'Share some details: the vibe, what to bring, etc.',
      wish: 'Share some details about your idea',
    },
    submit: 'Share',
  },
  edit: {
    title: { plan: 'Edit a plan', wish: 'Edit a wish' },
    titlePlaceholder: {
      plan: 'Rooftop sunset cocktails',
      wish: 'Board games night',
    },
    locationPlaceholder: { plan: 'Add a location', wish: 'Add a location' },
    descriptionPlaceholder: { plan: 'Add details', wish: 'Add details' },
    submit: 'Save changes',
  },
} as const;
