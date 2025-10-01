import * as ReactNative from "react-native";
const Alert = ReactNative.Alert;
// screens/KakaoMap1.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Animated, TextInput, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

import toiletsData from "../assets/toilets_all.json";
import { getDistance } from "../utils/geo";
import useDirections from "../hooks/useDirections";
import { kakaoMapHtml } from "../webview/kakaoMapHtml";
import RadiusStepper from "../components/RadiusStepper";

import { toggleFavorite } from "../lib/favoritesSync";
import { api, postReview, fetchReviews, fetchRating, ToiletLite } from "../services/api";
import StarRating from "../components/StarRating";

type LatLng = { latitude: number; longitude: number };
type Route = { distance: string; duration: string; path: LatLng[] };
type Toilet = {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  openingHours?: string;
};

const RADIUS_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];
const toiletKey = (t: Pick<Toilet, "name" | "lat" | "lng">) =>
  `${t.name}|${t.lat.toFixed(6)},${t.lng.toFixed(6)}`;

export default function KakaoMap1() {
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [panelAnim] = useState(new Animated.Value(-300));
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<Route | null>(null);
  const [radiusIndex, setRadiusIndex] = useState(0);
  const previousLocationRef = useRef<LatLng | null>(null);

  // 즐겨찾기를 키 Set으로만 보관 (UI 토글 용)
  const [favKeys, setFavKeys] = useState<Set<string>>(new Set());

  const fetchRoute = useDirections();

  // 위치 권한 + 위치 변경 감지
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 권한 필요", "설정에서 위치 접근 권한을 허용해주세요.");
        return;
      }
      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        async (loc) => {
          const newLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setLocation(newLoc);
          handleLocationUpdate(newLoc);
        }
      );
    })();
  }, [isRouting, selectedToilet, radiusIndex]);

  const handleLocationUpdate = async (newLoc: LatLng) => {
    const nearby = (toiletsData as Toilet[]).filter(
      (t) =>
        getDistance(newLoc.latitude, newLoc.longitude, t.lat, t.lng) <=
        RADIUS_OPTIONS[radiusIndex]
    );

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: "location_update",
        latitude: newLoc.latitude,
        longitude: newLoc.longitude,
        toilets: nearby,
      })
    );

    if (
      isRouting &&
      previousLocationRef.current &&
      getDistance(
        previousLocationRef.current.latitude,
        previousLocationRef.current.longitude,
        newLoc.latitude,
        newLoc.longitude
      ) > 0.1
    ) {
      const route = await fetchRoute(newLoc, selectedToilet);
      if (route) {
        setRouteInfo(route);
        webViewRef.current?.postMessage(
          JSON.stringify({ type: "draw_route", path: route.path })
        );
      }
    }
    previousLocationRef.current = newLoc;
  };

  const handleChangeRadius = (idx: number) => {
    setRadiusIndex(idx);
    if (location) handleLocationUpdate(location);
  };

  const closePanel = () =>
    Animated.timing(panelAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: false,
    }).start(() =>
      requestAnimationFrame(() => {
        setSelectedToilet(null);
        setIsPanelOpen(false);
      })
    );

  const handleStartRoute = async () => {
    if (!location || !selectedToilet) return;
    const route = await fetchRoute(location, selectedToilet);
    if (!route) {
      Alert.alert("경로 없음", "길찾기를 할 수 없습니다.");
      return;
    }
    setRouteInfo(route);
    webViewRef.current?.postMessage(JSON.stringify({ type: "draw_route", path: route.path }));
    setIsRouting(true);
    closePanel();
  };

  const cancelRoute = () => {
    setIsRouting(false);
    setRouteInfo(null);
    webViewRef.current?.postMessage(JSON.stringify({ type: "clear_route" }));
  };

  const goToMyLocation = () => {
    if (location) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: "center_location",
          latitude: location.latitude,
          longitude: location.longitude,
        })
      );
    }
  };

  const handleMessage = (event: any) => {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === "marker_click") {
      const t: Toilet = msg.payload;
      setSelectedToilet(t);
      setIsRouting(false);
      setRouteInfo(null);
      setIsPanelOpen(true);
      Animated.timing(panelAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  };

  // ★ 즐겨찾기 토글
  const onToggleFavorite = useCallback(
    (t: Toilet) => {
      const key = toiletKey(t);
      const next = !favKeys.has(key);

      // Optimistic UI
      setFavKeys((prev) => {
        const nextSet = new Set(prev);
        next ? nextSet.add(key) : nextSet.delete(key);
        return nextSet;
      });
      webViewRef.current?.postMessage(
        JSON.stringify({ type: "favorite_toggled", key, isFav: next })
      );

      // 서버 동기화
      toggleFavorite({
        target: { id: null, name: t.name, lat: t.lat, lng: t.lng },
        currentList: Array.from(favKeys).map((k) => ({
          key: k,
          toilet: { id: null, name: "", lat: 0, lng: 0 },
        })),
        onLocalUpdate: (nextList) => {
          const keys = nextList.map((i) => i.key);
          setFavKeys(new Set(keys));
        },
        afterSync: async () => {
          try {
            const { data } = await api.get("/favorites");
            const keys = (data.items ?? []).map((d: any) => d.key);
            setFavKeys(new Set(keys));
          } catch {}
        },
      }).catch(() => {});
    },
    [favKeys]
  );

  const isSelectedFav = selectedToilet ? favKeys.has(toiletKey(selectedToilet)) : false;

  return (
    <View style={styles.container}>
      {!location ? (
        <View style={styles.loading}>
          <Text>위치 정보를 불러오는 중...</Text>
        </View>
      ) : (
        <>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: kakaoMapHtml }}
            onMessage={handleMessage}
            onLoadEnd={() => location && handleLocationUpdate(location)}
            style={{ flex: 1 }}
          />

          {!isRouting && !isPanelOpen && (
            <View style={styles.radiusBarContainer}>
              <RadiusStepper
                index={radiusIndex}
                optionsKm={RADIUS_OPTIONS}
                onChange={handleChangeRadius}
              />
            </View>
          )}

          {selectedToilet && isPanelOpen && !isRouting && (
            <Animated.View style={[styles.infoPanelBottom, { bottom: panelAnim }]}>
              <View style={styles.panelHeader}>
                <Text style={styles.toiletName}>🚻 {selectedToilet.name}</Text>
                <TouchableOpacity
                  onPress={() => onToggleFavorite(selectedToilet)}
                  style={[styles.favBtn, isSelectedFav && styles.favOn]}
                >
                  <Text style={styles.favText}>{isSelectedFav ? "★" : "☆"}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.toiletAddr}>
                📍 {selectedToilet.address ?? "주소 정보 없음"}
              </Text>
              <Text>⏰ {selectedToilet.openingHours ?? "운영 시간 정보 없음"}</Text>

              {routeInfo && (
                <Text style={{ marginTop: 6 }}>
                  📏 {routeInfo.distance} · ⏱️ {routeInfo.duration}
                </Text>
              )}

              <View style={styles.rowBetween}>
                <TouchableOpacity onPress={handleStartRoute} style={styles.outlineBtn}>
                  <Text style={styles.outlineBtnText}>🚶 길찾기</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closePanel} style={styles.outlineBtn}>
                  <Text style={styles.outlineBtnText}>닫기</Text>
                </TouchableOpacity>
              </View>

              {/* 🚻 댓글/별점 패널 */}
              <DetailPanel toilet={selectedToilet} />
            </Animated.View>
          )}

          {isRouting && routeInfo && (
            <View style={styles.routePanel}>
              <Text style={styles.routeTitle}>도보 길찾기</Text>
              <Text style={styles.routeInfo}>거리: {routeInfo.distance}</Text>
              <Text style={styles.routeInfo}>예상 시간: {routeInfo.duration}</Text>
              <TouchableOpacity onPress={cancelRoute} style={styles.routeCancelBtn}>
                <Text style={styles.routeCancelText}>길찾기 취소</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isPanelOpen && (
            <TouchableOpacity onPress={goToMyLocation} style={styles.locBtn}>
              <Text style={{ color: "#111" }}>📍</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

function DetailPanel({ toilet }: { toilet: Toilet }) {
  const [avg, setAvg] = React.useState(0.0);
  const [count, setCount] = React.useState(0);
  const [myRating, setMyRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [reviews, setReviews] = React.useState<
    { id: string; userName: string; comment: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  const placeKey =
    (toilet as any).id ??
    `${toilet.name}|${toilet.lat.toFixed(6)},${toilet.lng.toFixed(6)}`;

  const loadMeta = React.useCallback(async () => {
    try {
      setLoading(true);
      const [r1, r2] = await Promise.all([fetchRating(placeKey), fetchReviews(placeKey)]);
      setAvg(r1?.avg ?? 0.0);
      setCount(r1?.count ?? 0);
      setReviews(r2?.items ?? []);
    } catch {} finally {
      setLoading(false);
    }
  }, [placeKey]);

  React.useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const submit = async () => {
    if (myRating < 1 && comment.trim().length === 0) {
      Alert.alert("안내", "별점 또는 댓글을 입력하세요.");
      return;
    }
    await postReview({
      toilet: {
        id: (toilet as any).id ?? undefined,
        name: toilet.name,
        lat: toilet.lat,
        lng: toilet.lng,
        address: toilet.address,
      },
      rating: myRating || undefined,
      comment: comment.trim() || undefined,
    });
    setComment("");
    await loadMeta();
  };

  return (
    <View style={reviewStyles.wrap}>
      <Text style={reviewStyles.avg}>⭐ 평균 {avg.toFixed(1)} / 5 ({count}명)</Text>

      <StarRating value={myRating} onChange={setMyRating} />
      {myRating > 0 && <Text style={{ marginTop: 4 }}>{myRating}점</Text>}

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="댓글 입력"
        style={reviewStyles.input}
        multiline
      />
      <TouchableOpacity style={reviewStyles.submitBtn} onPress={submit}>
        <Text style={reviewStyles.submitTxt}>등록</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 8 }} />
      ) : reviews.length === 0 ? (
        <Text style={{ color: "#666" }}>아직 댓글이 없습니다.</Text>
      ) : (
        reviews.map((r) => (
          <View key={r.id} style={reviewStyles.item}>
            <Text style={reviewStyles.user}>{r.userName}</Text>
            <Text>{r.comment}</Text>
            <Text style={reviewStyles.time}>{new Date(r.createdAt).toLocaleString()}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoPanelBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#ccc",
    bottom: -300,
    zIndex: 10,
    elevation: 10,
  },
  panelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  toiletName: { fontSize: 16, fontWeight: "700" },
  toiletAddr: { fontSize: 13, color: "#666", marginBottom: 8 },
  favBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", minWidth: 40, alignItems: "center" },
  favOn: { backgroundColor: "#FFEAA7", borderColor: "#F1C40F" },
  favText: { fontSize: 18 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  outlineBtn: { borderWidth: 1, borderColor: "#333", borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#fff" },
  outlineBtnText: { color: "#333", fontWeight: "600" },
  routePanel: { position: "absolute", bottom: 30, left: 20, right: 20, backgroundColor: "#fff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#333", elevation: 4 },
  routeTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  routeInfo: { fontSize: 14, color: "#111", marginBottom: 4 },
  routeCancelBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#333", alignItems: "center", backgroundColor: "#fff" },
  routeCancelText: { color: "#333", fontWeight: "600" },
  locBtn: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  radiusBarContainer: { position: "absolute", bottom: 30, left: 20, zIndex: 10 },
});

const reviewStyles = StyleSheet.create({
  wrap: { marginTop: 12, borderTopWidth: 1, borderColor: "#eee", paddingTop: 8 },
  avg: { fontWeight: "700", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    minHeight: 40,
    marginTop: 6,
  },
  submitBtn: {
    backgroundColor: "#4a6cff",
    marginTop: 6,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  submitTxt: { color: "#fff", fontWeight: "700" },
  item: { borderTopWidth: 1, borderColor: "#eee", paddingVertical: 6 },
  user: { fontWeight: "700" },
  time: { fontSize: 11, color: "#999" },
});
