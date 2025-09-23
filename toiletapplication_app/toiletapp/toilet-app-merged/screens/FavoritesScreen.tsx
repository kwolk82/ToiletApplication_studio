import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import toiletsData from '../assets/toilets_all.json';
import { api } from '../services/api';
import { getToken } from '../utils/authStorage';
import { idOf, Toilet } from '../utils/storage';

type Row = {
  toilet: Toilet;
  fav: boolean;
  rating?: number;
  review?: string;
};

export default function FavoritesScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [noAuth, setNoAuth] = useState(false);
  const allToilets: Toilet[] = useMemo(() => (toiletsData as any), []);

  const load = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) { setNoAuth(true); setRows([]); return; }
      const res = await api.getFavorites(token);
      if (!res.success) throw new Error('목록을 불러오지 못했습니다.');

      const byId = new Map<string, Toilet>();
      for (const t of allToilets) byId.set(idOf(t), t);

      const mapped: Row[] = res.items
        .map((it) => {
          const t = byId.get(it.toiletId);
          if (!t) return null;
          return { toilet: t, fav: !!it.fav, rating: it.rating, review: it.review };
        })
        .filter(Boolean) as Row[];

      setRows(mapped.filter((r) => r.fav));
      setNoAuth(false);
    } catch (e: any) {
      Alert.alert('오류', e.message || '불러오기 실패');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleFav = async (r: Row) => {
    try {
      const token = await getToken();
      if (!token) return Alert.alert('알림', '로그인이 필요합니다.');
      const next = !r.fav;
      await api.upsertFavorite(token, { toiletId: idOf(r.toilet), fav: next });
      setRows((prev) =>
        next
          ? prev.map((x) => (idOf(x.toilet) === idOf(r.toilet) ? { ...x, fav: true } : x))
          : prev.filter((x) => idOf(x.toilet) !== idOf(r.toilet))
      );
    } catch (e: any) { Alert.alert('오류', e.message || '즐겨찾기 변경 실패'); }
  };

  const remove = async (r: Row) => {
    try {
      const token = await getToken();
      if (!token) return Alert.alert('알림', '로그인이 필요합니다.');
      await api.deleteFavorite(token, idOf(r.toilet));
      setRows((prev) => prev.filter((x) => idOf(x.toilet) !== idOf(r.toilet)));
    } catch (e: any) { Alert.alert('오류', e.message || '삭제 실패'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /><Text>불러오는 중...</Text></View>;
  if (noAuth) return <View style={styles.center}><Text>로그인이 필요합니다</Text></View>;
  if (rows.length === 0) return <View style={styles.center}><Text>즐겨찾기가 비어있어요</Text></View>;

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={rows}
      keyExtractor={(r) => idOf(r.toilet)}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.toilet.name}</Text>
            {!!item.toilet.address && <Text style={styles.addr}>{item.toilet.address}</Text>}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={() => toggleFav(item)}>
              <Text style={styles.btnText}>{item.fav ? '★ 해제' : '☆ 추가'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.danger]} onPress={() => remove(item)}>
              <Text style={styles.btnText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', elevation: 2 },
  name: { fontSize: 16, fontWeight: '700' },
  addr: { color: '#666', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { backgroundColor: '#4a6cff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  danger: { backgroundColor: '#ff5a5a' },
});
