export const buildGoogleMapsUrl = (
  address: string,
  placeId?: string | null,
): string | null => {
  const normalizedPlaceId = placeId?.trim();

  if (!normalizedPlaceId) return null;

  const query = new URLSearchParams({
    api: '1',
    query: address,
    query_place_id: normalizedPlaceId,
  });

  return `https://www.google.com/maps/search/?${query.toString()}`;
};
