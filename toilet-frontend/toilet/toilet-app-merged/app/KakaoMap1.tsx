import * as ReactNative from "react-native";
const Alert = ReactNative.Alert;
// screens/KakaoMap1.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Animated } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

import toiletsData from "../assets/toilets_all.json";
import { getDistance } from "../utils/geo";
import useDirections from "../hooks/useDirections";
import { kakaoMapHtml } from "../webview/kakaoMapHtml";
import RadiusStepper from "../components/RadiusStepper";

import { toggleFavorite } from "../lib/favoritesSync";
import { api } from "../services/api"; // axios 인스턴스 (선택: afterSync에서 /favorites GET 용)

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

  // ★ 즐겨찾기 토글 (enqueueToggle → toggleFavorite 로 교체)
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
        // 현재 목록을 FavoriteItem[] 모양으로 흉내 내서 전달 (키만 중요)
        currentList: Array.from(favKeys).map((k) => ({
          key: k,
          toilet: { id: null, name: "", lat: 0, lng: 0 },
        })),
        onLocalUpdate: (nextList) => {
          // 서버 응답 기준으로 키 세트 재구성
          const keys = nextList.map((i) => i.key);
          setFavKeys(new Set(keys));
        },
        afterSync: async () => {
          // 필요 시 서버 최신 상태로 동기화
          try {
            const { data } = await api.get("/favorites");
            const keys = (data.items ?? []).map((d: any) => d.key);
            setFavKeys(new Set(keys));
          } catch {
            // ignore
          }
        },
      }).catch(() => {
        // 실패 시 낙관적 업데이트 롤백할 수 있음(선택)
      });
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoPanelBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 240,
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