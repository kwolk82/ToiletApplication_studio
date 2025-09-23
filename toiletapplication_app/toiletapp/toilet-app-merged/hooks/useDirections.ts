import { useCallback } from 'react';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2JqNTQxOSIsImEiOiJjbWM4ZHl4bHgxazFuMmpwbm81ZXp5bDU3In0.CDY_MaXox8wAFfRK4sgwww';

interface LatLng {
  latitude: number;
  longitude: number;
}
interface Toilet {
  lat: number;
  lng: number;
}

export default function useDirections() {
  return useCallback(async (origin: LatLng, destination: Toilet | null) => {
    if (!destination) return null;

    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${origin.longitude},${origin.latitude};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) return null;

    return {
      distance: (data.routes[0].distance / 1000).toFixed(2) + ' km',
      duration: Math.round(data.routes[0].duration / 60) + '분',
      path: data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({
        lat,
        lng,
      })),
    };
  }, []);
}
