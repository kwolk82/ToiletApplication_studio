// screens/FavoritesScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import * as ReactNative from "react-native";
import { fetchFavorites, batchFavorites, FavItem, toKey, ToiletLite } from "../services/api";

const {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} = ReactNative;
const Alert = ReactNative.Alert;

export default function FavoritesScreen() {
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFavorites();
      if (res?.success) setItems(res.items || []);
      else Alert.alert("오류", "즐겨찾기를 불러오지 못했습니다.");
    } catch (e: any) {
      Alert.alert("오류", e?.response?.data?.message || e?.message || "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeOne = async (item: FavItem) => {
    try {
      const t = item.toilet || ({} as ToiletLite);
      const payload: { adds: ToiletLite[]; removes: ToiletLite[] } = {
        adds: [],
        removes: [
          {
            id: t.id ?? undefined, // ✅ null 대신 undefined
            name: t.name,
            lat: Number(t.lat),
            lng: Number(t.lng),
            address: t.address,
          },
        ],
      };
      const res = await batchFavorites(payload);
      if (res?.success) setItems(res.items || []);
    } catch (e: any) {
      Alert.alert("삭제 실패", e?.response?.data?.message || e?.message || "다시 시도하세요.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.key || toKey(it.toilet)}
        contentContainerStyle={
          items.length
            ? { padding: 16, paddingBottom: 70 }
            : { flex: 1, padding: 16, paddingBottom: 70 }
        }
        renderItem={({ item }) => {
          const t = item.toilet || ({} as ToiletLite);
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t.name || item.key}</Text>
                {!!t.address && <Text style={styles.addr}>{t.address}</Text>}
                {Number.isFinite(Number(t.lat)) && Number.isFinite(Number(t.lng)) && (
                  <Text style={styles.coord}>
                    {Number(t.lat).toFixed(5)}, {Number(t.lng).toFixed(5)}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeOne(item)}>
                <Text style={styles.removeText}>삭제</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>즐겨찾기가 비어있습니다.</Text>
            <Text style={{ color: "#666", marginTop: 6 }}>
              지도에서 별 아이콘을 눌러 추가하세요.
            </Text>
          </View>
        }
      />

      {/* ✅ 화면 하단 고정 새로고침 버튼 */}
      <View style={styles.refreshBar}>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshTxt}>새로고침</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  title: { fontWeight: "800", fontSize: 16, color: "#222" },
  addr: { color: "#666", marginTop: 2 },
  coord: { color: "#888", marginTop: 2 },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ff5a5f",
    marginLeft: 12,
  },
  removeText: { color: "#fff", fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  refreshBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "#f7f7f9",
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  refreshBtn: {
    backgroundColor: "#4a6cff",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  refreshTxt: { color: "#fff", fontWeight: "700" },
});
