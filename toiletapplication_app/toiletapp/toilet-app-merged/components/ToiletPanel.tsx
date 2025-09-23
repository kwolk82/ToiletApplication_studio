import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

type Toilet = { name: string; address?: string; openingHours?: string };
type RouteInfo = { distance: string; duration: string };

interface Props {
  toilet: Toilet;
  routeInfo: RouteInfo | null;
  isFav: boolean;
  rating: number;
  review: string;
  onChangeRating: (n: number) => void;
  onChangeReview: (s: string) => void;
  onToggleFav: () => void;
  onSave: () => void;
  onStartRoute: () => void;
  onClose: () => void;
}

const Star = ({ on, onPress }: { on: boolean; onPress: () => void }) => (
  <Text onPress={onPress} style={{ fontSize: 24, paddingHorizontal: 2 }}>{on ? '★' : '☆'}</Text>
);

export default function ToiletPanel({
  toilet, routeInfo, isFav, rating, review,
  onChangeRating, onChangeReview, onToggleFav, onSave, onStartRoute, onClose,
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <Text style={styles.title}>🚻 {toilet.name}</Text>
        <TouchableOpacity onPress={onClose}><Text>닫기</Text></TouchableOpacity>
      </View>

      <Text>📍 {toilet.address ?? '주소 정보 없음'}</Text>
      <Text>⏰ {toilet.openingHours ?? '운영 시간 정보 없음'}</Text>
      {routeInfo && <Text style={{ marginTop: 6 }}>📏 {routeInfo.distance} · ⏱️ {routeInfo.duration}</Text>}

      <View style={styles.starRow}>
        {[1,2,3,4,5].map(n => <Star key={n} on={n <= rating} onPress={() => onChangeRating(n)} />)}
        <TouchableOpacity style={[styles.button, { backgroundColor: isFav ? '#FF3B30' : '#FFC107' }]} onPress={onToggleFav}>
          <Text style={styles.buttonText}>{isFav ? '즐겨찾기 해제' : '즐겨찾기'}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        value={review}
        onChangeText={onChangeReview}
        placeholder="후기를 입력하세요"
        multiline
        style={styles.textarea}
      />

      <View style={styles.row}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#007AFF' }]} onPress={onStartRoute}>
          <Text style={styles.buttonText}>🚶 길찾기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#34C759' }]} onPress={onSave}>
          <Text style={styles.buttonText}>저장</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, justifyContent: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  starRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  textarea: {
    marginTop: 10, minHeight: 90, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, padding: 10, textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginLeft: 10 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
