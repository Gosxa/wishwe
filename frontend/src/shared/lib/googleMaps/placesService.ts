import type { AddressParts } from './formatLocation';
import type { MapsLibraries } from './loadGoogleMaps';
import type { ResolvedPlace, Suggestion } from './types';

const CITY_TYPES = ['locality', 'postal_town', 'administrative_area_level_2'];

const NAMED_FEATURE_TYPES = [
  'establishment',
  'point_of_interest',
  'park',
  'natural_feature',
  'airport',
  'neighborhood',
  'sublocality',
];

type Component = { text: string; types: string[] };

const findComponent = (
  components: Component[],
  wanted: string[],
): string | undefined => {
  for (const type of wanted) {
    const hit = components.find(component => component.types.includes(type));

    if (hit?.text) return hit.text;
  }

  return undefined;
};

const buildStreet = (
  components: Component[],
  formattedAddress: string,
): string | undefined => {
  const number = findComponent(components, ['street_number']);
  const route = findComponent(components, ['route']);

  if (!route) return number;
  if (!number) return route;

  const numberFirst =
    formattedAddress.indexOf(number) < formattedAddress.indexOf(route);

  return numberFirst ? `${number} ${route}` : `${route} ${number}`;
};

const toParts = (
  components: Component[],
  formattedAddress: string,
): AddressParts => ({
  street: buildStreet(components, formattedAddress),
  city: findComponent(components, CITY_TYPES),
  country: findComponent(components, ['country']),
});

export const createSessionToken = (
  places: MapsLibraries['places'],
): google.maps.places.AutocompleteSessionToken =>
  new places.AutocompleteSessionToken();

export type SourcedSuggestion = Suggestion & {
  prediction: google.maps.places.PlacePrediction;
};

export const fetchSuggestions = async ({
  places,
  input,
  sessionToken,
  bias,
}: {
  places: MapsLibraries['places'];
  input: string;
  sessionToken: google.maps.places.AutocompleteSessionToken;
  bias?: google.maps.LatLngBounds | null;
}): Promise<SourcedSuggestion[]> => {
  const { suggestions } =
    await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken,
      ...(bias ? { locationBias: bias } : {}),
    });

  return suggestions.flatMap(suggestion => {
    const prediction = suggestion.placePrediction;

    if (!prediction) return [];

    return [
      {
        placeId: prediction.placeId,
        primary: prediction.mainText?.text ?? prediction.text.text,
        secondary: prediction.secondaryText?.text ?? '',
        prediction,
      },
    ];
  });
};

export const fetchPlaceDetails = async (
  prediction: google.maps.places.PlacePrediction,
): Promise<{ place: ResolvedPlace; parts: AddressParts }> => {
  const place = prediction.toPlace();

  await place.fetchFields({
    fields: [
      'displayName',
      'formattedAddress',
      'location',
      'addressComponents',
    ],
  });

  const location = place.location;

  if (!location) {
    throw new Error('Place has no location');
  }

  const formattedAddress = place.formattedAddress ?? '';
  const components: Component[] = (place.addressComponents ?? []).map(
    component => ({
      text: component.longText ?? '',
      types: component.types,
    }),
  );

  return {
    place: {
      name: place.displayName ?? undefined,
      formattedAddress: formattedAddress || undefined,
      lat: location.lat(),
      lng: location.lng(),
      placeId: prediction.placeId,
    },
    parts: toParts(components, formattedAddress),
  };
};

export const reverseGeocode = async ({
  geocoding,
  lat,
  lng,
}: {
  geocoding: MapsLibraries['geocoding'];
  lat: number;
  lng: number;
}): Promise<{ place: ResolvedPlace; parts: AddressParts } | null> => {
  const geocoder = new geocoding.Geocoder();
  const { results } = await geocoder.geocode({ location: { lat, lng } });

  if (results.length === 0) return null;

  const streetLevel = results.find(result =>
    result.types.includes('street_address'),
  );
  const best = streetLevel ?? results[0];
  const hasAddress =
    best.types.includes('street_address') ||
    best.types.includes('premise') ||
    best.types.includes('route');

  const components: Component[] = best.address_components.map(component => ({
    text: component.long_name,
    types: component.types,
  }));

  const nearest = results.find(result =>
    result.types.some(type => NAMED_FEATURE_TYPES.includes(type)),
  );

  return {
    place: {
      formattedAddress: hasAddress ? best.formatted_address : undefined,
      lat,
      lng,
      placeId: best.place_id,
      nearestPlace: hasAddress ? undefined : nearest?.formatted_address,
    },
    parts: toParts(components, best.formatted_address),
  };
};
