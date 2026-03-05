export function buildGoogleMapsEmbedUrl({
  address,
  latitude,
  longitude,
}: {
  address: string;
  latitude: number;
  longitude: number;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}
