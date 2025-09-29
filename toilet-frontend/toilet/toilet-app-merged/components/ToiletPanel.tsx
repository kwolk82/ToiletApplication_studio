// components/ToiletPanel.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Toilet = {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  openingHours?: string;
};
type RouteInfo = { distance: string; duration: string };

interface Props {
  toilet: Toilet;
  routeInfo: RouteInfo | null;
  onClose: () => void;
  onStartRoute: () => void;

  // 즐겨찾기
  isFav: boolean;
  onToggleFavorite: () => void;
}

function ToiletPanel({ toilet, routeInfo, onClose, onStartRoute, isFav, onToggleFavorite }: Props) {
  const handleToggle = useCallback(onToggleFavorite, [onToggleFavorite]);

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🚻 {toilet.name}</Text>
        <TouchableOpacity onPress={handleToggle} style={[styles.favBtn, isFav && styles.favOn]}>
          <Text style={styles.favText}>{isFav ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <Text>📍 {toilet.address ?? '주소 정보 없음'}</Text>
      <Text>⏰ {toilet.openingHours ?? '운영 시간 정보 없음'}</Text>

      {routeInfo && <Text style={{ marginTop: 6 }}>📏 {routeInfo.distance} · ⏱️ {routeInfo.duration}</Text>}

      <TouchableOpacity style={styles.button} onPress={onStartRoute}>
        <Text style={styles.buttonText}>🚶 도보 길찾기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonClose} onPress={onClose}>
        <Text style={styles.buttonText}>닫기</Text>
      </TouchableOpacity>
    </View>
  );
}

export default memo(ToiletPanel);

const styles = StyleSheet.create({
  panel: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold' },
  favBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', minWidth: 40, alignItems: 'center' },
  favOn: { backgroundColor: '#FFEAA7', borderColor: '#F1C40F' },
  favText: { fontSize: 18 },
  button: { marginTop: 12, padding: 12, backgroundColor: '#007AFF', borderRadius: 8, alignItems: 'center' },
  buttonClose: { marginTop: 12, padding: 12, backgroundColor: '#FF3B30', borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff' },
});
