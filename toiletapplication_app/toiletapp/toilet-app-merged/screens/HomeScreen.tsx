import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>화장실 지도/검색은 하단 탭에서 이용하세요</Text>
      <Text style={styles.desc}>
        즐겨찾기는 로그인 후 Favorites 탭에서 확인할 수 있어요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  desc: { color: '#666', textAlign: 'center' },
});
