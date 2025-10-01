import React from "react";
import * as ReactNative from "react-native";
const { View, TouchableOpacity, Text, StyleSheet } = ReactNative;
const Alert = ReactNative.Alert;
// ✅ 새 SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context';

import KakaoMap from './KakaoMap1';

type UserLite = { name: string; email: string };
type Props = {
  user: UserLite | null;
  onLogin: () => void;
  onLogout: () => void;
};

export default function MainScreen({ user, onLogin, onLogout }: Props) {
  const isLoggedIn = !!user;

  const press = () => {
    if (!isLoggedIn) {
      onLogin();
      return;
    }
    Alert.alert(
      '정말 로그아웃 하시겠습니까?',
      undefined,
      [
        { text: '아니오', style: 'cancel' },
        { text: '예', onPress: () => onLogout() },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* 지도 */}
      <View style={styles.mapWrap}>
        <KakaoMap />
      </View>

      {/* 오버레이 버튼 */}
      <View pointerEvents="box-none" style={styles.overlay}>
        <TouchableOpacity
          onPress={press}
          style={styles.loginBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.loginText}>{isLoggedIn ? '로그아웃' : '로그인'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  mapWrap: { flex: 1, zIndex: 0 },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 10,
    elevation: 10,
  },
  loginBtn: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginRight: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#fff',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }
      : { elevation: 2 }),
  },
  loginText: { color: '#333', fontSize: 14, fontWeight: '600' },
});
