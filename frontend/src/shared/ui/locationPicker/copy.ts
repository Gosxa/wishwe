/** Every string the picker can show, in one place. */
export const LOCATION_PICKER_COPY = {
  title: {
    create: 'Pick a location',
    change: 'Change the location',
  },
  searchPlaceholder: 'Search for a place or an address',
  emptyCard: 'Click a spot or move the map to place the pin',
  emptyCardHint:
    'Or search above. We use the address Google returns for the pin — you can still edit it afterwards.',
  lookingUp: 'Finding the address…',
  slowLoad:
    'Still loading the map — you can close this and type the address instead.',
  hints: {
    fineTune: 'Move the map to fine-tune the pin',
    zoomIn: 'Zoom in to place the pin on a street',
    noAddress: 'No address here — coordinates will be used',
  },
  keyboard: {
    listOpen: '↑ ↓ to move · Enter to pick · Esc to close the list',
  },
  actions: {
    cancel: 'Cancel',
    confirm: 'Use this location',
    confirmCoordinates: 'Use these coordinates',
    confirmAnyway: 'Use coordinates anyway',
    confirmUpdate: 'Update the location',
    tryAgain: 'Try again',
    typeInstead: 'Type the address instead',
  },
  errors: {
    mapFailed: {
      title: 'We couldn’t load the map',
      body: 'Check your connection and try again — or just type the address, which always works.',
    },
    mapFailedCard: {
      title: 'No map, no pin',
      body: 'You can still type the address in the form — it is saved exactly the same way.',
    },
    noResults: {
      title: (query: string) => `Nothing matched “${query}”`,
      body: 'Check the spelling, try the street name without the number, or close the list and drop the pin by hand.',
    },
    searchFailed: {
      title: 'Search is unavailable right now',
      body: 'The Places service didn’t answer. Moving the map still works — the pin does not depend on search.',
    },
    noAddress: {
      title: 'No street address here',
      nearest: (place: string) => `Nearest named place: ${place}`,
      body: (coordinates: string) =>
        `Will be saved as “${coordinates}” — add a landmark in the field so guests can find it.`,
    },
    geocodeFailed: {
      title: 'Couldn’t look up this address',
      body: 'The pin is fine — only the address lookup failed.',
    },
    tooBroad: {
      title: 'Zoom in to place the pin on a street',
      body: 'The map is too broad to be useful — guests would not know where to go.',
    },
    trimmed: {
      title: 'This address was shortened',
      body: (limit: number) =>
        `Addresses are stored up to ${limit} characters. Check it still makes sense before you confirm.`,
    },
    geolocationBlocked: 'Location access is blocked in your browser',
  },
  dialogs: {
    replace: {
      title: 'Replace what you typed?',
      body: 'The Where? field already has an address in it. Confirming this pin overwrites it.',
      keep: 'Keep mine',
      confirm: 'Replace it',
    },
    discard: {
      title: 'Discard this pin?',
      body: 'You picked a place but haven’t confirmed it. Closing now leaves the Where? field as it was.',
      keep: 'Keep picking',
      confirm: 'Discard',
    },
  },
  searchMeta: {
    poweredBy: 'powered by Google',
    resultCount: (count: number) =>
      `${count} of ${count} results · biased to the map viewport`,
  },
} as const;

export const LOCATION_FIELD_COPY = {
  pick: 'Pick on map',
  loading: 'Loading map…',
  pinned: 'Pinned on the map',
  change: 'Change',
  clear: 'Clear',
  editedByHand: 'Edited by hand — pin cleared',
  pickAgain: 'Pick again',
  unavailable:
    'Map picking is unavailable right now — type the address instead.',
  announce: (value: string) => `Location set to ${value}`,
} as const;
