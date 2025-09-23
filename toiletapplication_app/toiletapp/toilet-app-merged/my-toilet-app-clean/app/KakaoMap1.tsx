// KakaoMap1.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

import toiletsData from '../assets/toilets_all.json';
import { getDistance } from '../utils/geo';
import useDirections from '../hooks/useDirections';
import ToiletPanel from '../components/ToiletPanel';
import { kakaoMapHtml } from '../webview/kakaoMapHtml';

type LatLng = { latitude: number; longitude: number };
type Toilet = { 
  name: string; 
  lat: number;      // ✅ 이제 필수
  lng: number;      // ✅ 이제 필수
  address?: string; 
  openingHours?: string; 
};

const RADIUS_OPTIONS = [0.5, 1, 2];

export default function KakaoMap() {
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [panelAnim] = useState(new Animated.Value(-300));
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; path: LatLng[] } | null>(null);
  const previousLocationRef = useRef<LatLng | null>(null);
  const [radiusIndex, setRadiusIndex] = useState(0); // 기본 반경 0.5km
  const [showRadiusModal, setShowRadiusModal] = useState(false);

  const fetchRoute = useDirections();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '설정에서 위치 접근 권한을 허용해주세요.');
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
    const nearbyToilets = (toiletsData as Toilet[]).filter(
      (t) => getDistance(newLoc.latitude, newLoc.longitude, t.lat, t.lng) <= RADIUS_OPTIONS[radiusIndex]
    );

    webViewRef.current?.postMessage(JSON.stringify({
      type: 'location_update',
      latitude: newLoc.latitude,
      longitude: newLoc.longitude,
      toilets: nearbyToilets,
    }));

    if (
      isRouting &&
      previousLocationRef.current &&
      getDistance(previousLocationRef.current.latitude, previousLocationRef.current.longitude, newLoc.latitude, newLoc.longitude) > 0.1
    ) {
      const route = await fetchRoute(newLoc, selectedToilet);
      if (route) {
        setRouteInfo(route);
        webViewRef.current?.postMessage(JSON.stringify({ type: 'draw_route', path: route.path }));
      }
    }
    previousLocationRef.current = newLoc;
  };

  const closePanel = () =>
    Animated.timing(panelAnim, { toValue: -300, duration: 300, useNativeDriver: false }).start(() =>
      requestAnimationFrame(() => {
        setSelectedToilet(null);
        setIsPanelOpen(false);
      })
    );

  const handleStartRoute = async () => {
    if (!location || !selectedToilet) return;
    const route = await fetchRoute(location, selectedToilet);
    if (!route) {
      Alert.alert('경로 없음', '길찾기를 할 수 없습니다.');
      return;
    }
    setRouteInfo(route);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'draw_route', path: route.path }));
    setIsRouting(true);
    closePanel();
  };

  const cancelRoute = () => {
    setIsRouting(false);
    setRouteInfo(null);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'clear_route' }));
  };

  const goToMyLocation = () => {
    if (location) {
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'center_location', latitude: location.latitude, longitude: location.longitude })
      );
    }
  };

  const handleMessage = (event: any) => {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'marker_click') {
      setSelectedToilet(msg.payload);
      setIsRouting(false);
      setRouteInfo(null);
      setIsPanelOpen(true);
      Animated.timing(panelAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  };

  return (
    <View style={styles.container}>
      {!location ? (
        <View style={styles.loading}><Text>위치 정보를 불러오는 중...</Text></View>
      ) : (
        <>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: kakaoMapHtml }}
            onMessage={handleMessage}
            onLoadEnd={() => location && handleLocationUpdate(location)}
            style={{ flex: 1 }}
          />

          {selectedToilet && isPanelOpen && !isRouting && (
            <Animated.View style={[styles.infoPanelBottom, { bottom: panelAnim }]}>
              <ToiletPanel
                toilet={selectedToilet}
                routeInfo={routeInfo}
                onStartRoute={handleStartRoute}
                onClose={closePanel}
              />
            </Animated.View>
          )}

          {isRouting && routeInfo && (
            <View style={styles.routeInfoBox}>
              <Text style={styles.routeInfoText}>📏 {routeInfo.distance}</Text>
              <Text style={styles.routeInfoText}>⏱️ {routeInfo.duration}</Text>
              <TouchableOpacity onPress={cancelRoute} style={styles.cancelBtn}>
                <Text style={{ color: 'white' }}>❌ 길찾기 취소</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={goToMyLocation} style={styles.locationBtn}>
            <Text style={{ color: 'white' }}>📍 내 위치로</Text>
          </TouchableOpacity>

          {!isRouting && (
            <TouchableOpacity onPress={() => setShowRadiusModal(true)} style={styles.radiusBtn}>
              <Text style={{ color: 'white' }}>반경: {RADIUS_OPTIONS[radiusIndex]} km</Text>
            </TouchableOpacity>
          )}

          {showRadiusModal && !isRouting && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                {RADIUS_OPTIONS.map((r, idx) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => {
                      setRadiusIndex(idx);
                      setShowRadiusModal(false);
                      if (location) handleLocationUpdate(location);
                    }}
                    style={styles.modalOption}
                  >
                    <Text style={styles.modalOptionText}>{r} km</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setShowRadiusModal(false)}>
                  <Text style={{ color: 'red', marginTop: 10 }}>닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoPanelBottom: {
    position: 'absolute', left: 0, right: 0, height: 220,
    backgroundColor: '#fff', padding: 16, borderTopWidth: 1,
    borderColor: '#ccc', bottom: -300, zIndex: 10, elevation: 10,
  },
  routeInfoBox: {
    position: 'absolute', bottom: 50, left: 20, right: 20,
    backgroundColor: '#ffffffee', padding: 16, borderRadius: 12,
    elevation: 5, alignItems: 'center',
  },
  routeInfoText: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  cancelBtn: { marginTop: 12, backgroundColor: '#FF3B30', padding: 12, borderRadius: 8, elevation: 5 },
  locationBtn: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#34C759', padding: 12, borderRadius: 8, elevation: 5 },
  radiusBtn: { position: 'absolute', bottom: 90, right: 20, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, elevation: 5 },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff', padding: 20, borderRadius: 10,
    width: 200, alignItems: 'center', elevation: 10,
  },
  modalOption: { paddingVertical: 10, width: '100%', alignItems: 'center' },
  modalOptionText: { fontSize: 16 },
});
