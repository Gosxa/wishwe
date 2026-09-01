const SCRIPT_ID = 'google-maps-js';
const CALLBACK_NAME = '__wishweGoogleMapsReady';

export const GOOGLE_MAPS_ENABLED = false;

export const MAPS_SLOW_MS = 3_000;
export const MAPS_TIMEOUT_MS = 8_000;

export type MapsLibraries = {
  maps: google.maps.MapsLibrary;
  places: google.maps.PlacesLibrary;
  geocoding: google.maps.GeocodingLibrary;
  core: google.maps.CoreLibrary;
};

export const getMapsApiKey = (): string =>
  GOOGLE_MAPS_ENABLED ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '') : '';

export const isMapsConfigured = (): boolean => getMapsApiKey().length > 0;

type Deferred = {
  promise: Promise<MapsLibraries>;
  settled: boolean;
};

let deferred: Deferred | null = null;

const buildScriptUrl = (key: string): string => {
  const params = new URLSearchParams({
    key,
    v: 'weekly',
    loading: 'async',
    libraries: 'places,geocoding',
    callback: CALLBACK_NAME,
  });

  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
};

const importLibraries = async (): Promise<MapsLibraries> => {
  const [core, maps, places, geocoding] = await Promise.all([
    google.maps.importLibrary('core') as Promise<google.maps.CoreLibrary>,
    google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,
    google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>,
    google.maps.importLibrary(
      'geocoding',
    ) as Promise<google.maps.GeocodingLibrary>,
  ]);

  return { core, maps, places, geocoding };
};

const authFailureListeners = new Set<() => void>();
let hasAuthFailed = false;

export const hasMapsAuthFailed = (): boolean => hasAuthFailed;

export const onMapsAuthFailure = (listener: () => void): (() => void) => {
  authFailureListeners.add(listener);

  return () => authFailureListeners.delete(listener);
};

const registerAuthFailureHook = () => {
  (window as unknown as Record<string, unknown>).gm_authFailure = () => {
    hasAuthFailed = true;
    authFailureListeners.forEach(listener => listener());
  };
};

const injectScript = (key: string): Promise<MapsLibraries> =>
  new Promise<MapsLibraries>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);

    if (existing) {
      existing.addEventListener('error', () =>
        reject(new Error('Google Maps script failed to load')),
      );
    } else {
      const script = document.createElement('script');

      script.id = SCRIPT_ID;
      script.src = buildScriptUrl(key);
      script.async = true;
      script.onerror = () =>
        reject(new Error('Google Maps script failed to load'));
      document.head.appendChild(script);
    }

    registerAuthFailureHook();

    const globalScope = window as unknown as Record<string, unknown>;

    globalScope[CALLBACK_NAME] = () => {
      delete globalScope[CALLBACK_NAME];
      importLibraries().then(resolve, reject);
    };

    window.setTimeout(
      () => reject(new Error('Google Maps script timed out')),
      MAPS_TIMEOUT_MS,
    );
  });

export const loadGoogleMaps = (): Promise<MapsLibraries> => {
  if (deferred) return deferred.promise;

  const key = getMapsApiKey();

  if (!key) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_KEY is not set'));
  }

  const loaded = (window as { google?: { maps?: unknown } }).google?.maps;
  const promise = loaded ? importLibraries() : injectScript(key);

  const tracked: Deferred = { promise, settled: false };

  deferred = tracked;

  promise.then(
    () => {
      tracked.settled = true;
    },
    () => {
      if (deferred === tracked) deferred = null;
    },
  );

  return promise;
};

export const resetGoogleMapsLoader = (): void => {
  deferred = null;
  hasAuthFailed = false;
  document.getElementById(SCRIPT_ID)?.remove();
};
