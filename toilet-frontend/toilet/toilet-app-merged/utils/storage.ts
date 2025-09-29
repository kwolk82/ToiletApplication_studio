// utils/storage.ts

// 여기서 Toilet 타입을 직접 정의 (순환 의존성 방지)
export type Toilet = {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  openingHours?: string;
};

// 즐겨찾기 / 별점 / 후기 저장 키
export const favKey    = (id: string) => `fav:${id}`;
export const ratingKey = (id: string) => `rating:${id}`;
export const reviewKey = (id: string) => `review:${id}`;

// 화장실 객체에서 고유 id 만들기
export const idOf = (t: Toilet) =>
  t.id ?? `${t.name}_${t.lat.toFixed(5)}_${t.lng.toFixed(5)}`;
