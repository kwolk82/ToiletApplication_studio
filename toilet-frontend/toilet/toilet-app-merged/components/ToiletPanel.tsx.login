import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Toilet = { 
  name: string; 
  address?: string;        // ✅ 선택적
  openingHours?: string;   // ✅ 선택적
};
type RouteInfo = { distance: string; duration: string };

interface Props {
  toilet: Toilet;
  routeInfo: RouteInfo | null;
  onClose: () => void;
  onStartRoute: () => void;
}

export default function ToiletPanel({ toilet, routeInfo, onClose, onStartRoute }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>🚻 {toilet.name}</Text>
      <Text>📍 {toilet.address ?? '주소 정보 없음'}</Text>
      <Text>⏰ {toilet.openingHours ?? '운영 시간 정보 없음'}</Text>

      {routeInfo && (
        <Text>📏 {routeInfo.distance}, ⏱️ {routeInfo.duration}</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={onStartRoute}>
        <Text style={{ color: '#fff' }}>🚶 도보 길찾기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonClose} onPress={onClose}>
        <Text style={{ color: '#fff' }}>닫기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  button: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonClose: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
});
