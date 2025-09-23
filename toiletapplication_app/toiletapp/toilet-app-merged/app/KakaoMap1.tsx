import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Alert, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import toiletsData from '../assets/toilets_all.json';
import { getDistance } from '../utils/geo';
import useDirections from '../hooks/useDirections';
import { kakaoMapHtml } from '../webview/kakaoMapHtml';
import { favKey, ratingKey, reviewKey, idOf, Toilet } from '../utils/storage';
import RadiusStepper from '../components/RadiusStepper';

type LatLng = { latitude: number; longitude: number };

// 반경 단계
const RADIUS_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

export default function KakaoMap() {
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);

  const [panelAnim] = useState(new Animated.Value(-300));
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [isRouting, setIsRouting] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const [isFav, setIsFav] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const [radiusIndex, setRadiusIndex] = useState(0);

  const fetchRoute = useDirections();
  const previousLocationRef = useRef<LatLng | null>(null);

  // 위치 추적
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

  // 즐겨찾기/리뷰 메타 불러오기
  const loadMeta = async (t: Toilet) => {
    const id = idOf(t);
    const [fav, r, rv] = await Promise.all([
      AsyncStorage.getItem(favKey(id)),
      AsyncStorage.getItem(ratingKey(id)),
      AsyncStorage.getItem(reviewKey(id)),
    ]);
    setIsFav(!!fav);
    setRating(r ? Number(r) : 0);
    setReview(rv || '');
  };

  const toggleFav = async () => {
    if (!selectedToilet) return;
    const id = idOf(selectedToilet);
    if (isFav) {
      await AsyncStorage.removeItem(favKey(id));
      setIsFav(false);
    } else {
      await AsyncStorage.setItem(favKey(id), '1');
      setIsFav(true);
    }
  };

  const saveMeta = async () => {
    if (!selectedToilet) return;
    const id = idOf(selectedToilet);
    await AsyncStorage.setItem(ratingKey(id), String(rating));
    await AsyncStorage.setItem(reviewKey(id), review);
    Alert.alert('저장됨', '별점/후기가 저장되었어요.');
    closePanel();
  };

  // 위치 업데이트 + 반경 필터링
  const handleLocationUpdate = async (newLoc: LatLng) => {
    const nearbyToilets = (toiletsData as Toilet[]).filter(
      (t) => getDistance(newLoc.latitude, newLoc.longitude, t.lat, t.lng) <= RADIUS_OPTIONS[radiusIndex]
    );

    webViewRef.current?.postMessage(
      JSON.stringify({
        type: 'location_update',
        latitude: newLoc.latitude,
        longitude: newLoc.longitude,
        toilets: nearbyToilets,
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
        webViewRef.current?.postMessage(JSON.stringify({ type: 'draw_route', path: route.path }));
      }
    }
    previousLocationRef.current = newLoc;
  };

  const handleChangeRadius = (nextIndex: number) => {
    setRadiusIndex(nextIndex);
    if (location) {
      handleLocationUpdate(location);
    }
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

  const handleMessage = async (event: any) => {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'marker_click') {
      const t: Toilet = msg.payload;
      setSelectedToilet(t);
      setIsRouting(false);
      setRouteInfo(null);
      setIsPanelOpen(true);
      await loadMeta(t);
      Animated.timing(panelAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  };

  // 별점 렌더링
  const renderStars = () => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={{ fontSize: 20, marginRight: 4 }}>
              {rating >= star ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
        {/* 즐겨찾기 버튼 (별점 옆으로 이동) */}
        <TouchableOpacity onPress={toggleFav} style={styles.outlineBtn}>
          <Text style={styles.outlineBtnText}>
            {isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

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
            originWhitelist={['*']}
            source={{ html: kakaoMapHtml }}
            onMessage={handleMessage}
            onLoadEnd={() => location && handleLocationUpdate(location)}
            style={{ flex: 1 }}
          />

          {/* 🔹 반경 스텝퍼 (길찾기/화장실 패널 열릴 때 숨김) */}
          {!isRouting && !isPanelOpen && (
            <View style={styles.radiusBarContainer}>
              <RadiusStepper
                index={radiusIndex}
                optionsKm={RADIUS_OPTIONS}
                onChange={handleChangeRadius}
              />
            </View>
          )}

          {/* 🔹 화장실 패널 */}
          {selectedToilet && isPanelOpen && !isRouting && (
            <Animated.View style={[styles.infoPanelBottom, { bottom: panelAnim }]}>
              <View style={styles.panelHeader}>
                <Text style={styles.toiletName}>{selectedToilet.name}</Text>
                {/* 패널 오른쪽 위 내 위치 버튼 */}
                <TouchableOpacity onPress={goToMyLocation} style={styles.locBtnSmall}>
                  <Ionicons name="locate" size={18} color="#111" />
                </TouchableOpacity>
              </View>

              <Text style={styles.toiletAddr}>{selectedToilet.address}</Text>

              {/* 별점 + 즐겨찾기 */}
              <View style={styles.row}>{renderStars()}</View>

              {/* 리뷰 작성 */}
              <TextInput
                style={styles.reviewInput}
                value={review}
                onChangeText={setReview}
                placeholder="리뷰를 작성하세요"
                multiline
              />

              <View style={styles.rowBetween}>
                <TouchableOpacity onPress={saveMeta} style={styles.outlineBtn}>
                  <Text style={styles.outlineBtnText}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStartRoute} style={styles.outlineBtn}>
                  <Text style={styles.outlineBtnText}>길찾기</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closePanel} style={styles.outlineBtn}>
                  <Text style={styles.outlineBtnText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* 🔹 길찾기 패널 */}
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

          {/* 🔹 내 위치 버튼 (패널 없을 때만 표시) */}
          {!isPanelOpen && (
            <TouchableOpacity onPress={goToMyLocation} style={styles.locBtn}>
              <Ionicons name="locate" size={20} color="#111" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // 🔹 화장실 패널
  infoPanelBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ccc',
    bottom: -300,
    zIndex: 10,
    elevation: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toiletName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  toiletAddr: { fontSize: 13, color: '#666', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  label: { fontSize: 13, fontWeight: '600', marginRight: 6 },

  reviewInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 12,
  },

  outlineBtn: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginHorizontal: 2,
  },
  outlineBtnText: { color: '#333', fontWeight: '600' },

  // 🔹 길찾기 패널
  routePanel: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 4,
  },
  routeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  routeInfo: { fontSize: 14, color: '#111', marginBottom: 4 },
  routeCancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  routeCancelText: { color: '#333', fontWeight: '600' },

  // 🔹 내 위치 버튼
  locBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  locBtnSmall: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 🔹 반경 스텝퍼
  radiusBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    zIndex: 10,
  },
});
