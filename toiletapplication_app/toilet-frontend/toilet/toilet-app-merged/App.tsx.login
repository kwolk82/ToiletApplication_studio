import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Modal, SafeAreaView, Pressable, Text, StyleSheet } from 'react-native';
import MainScreen from './app/MainScreen';
import LoginScreen from './app/auth/LoginScreen';
import SignupScreen from './app/auth/SignupScreen';

import { USE_SERVER } from './config';
import {
  getCurrentUser, getRefreshToken,
  clearCurrentUser, clearAuthTokens,
} from './utils/storage';
import { api } from './lib/api';

type UserLite = { name: string; email: string };

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<UserLite | null>(null);

  // 인증 모달
  const [authVisible, setAuthVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // 부팅 시 세션 복구(지도는 항상 렌더)
  useEffect(() => {
    (async () => {
      try {
        if (!USE_SERVER) {
          const u = await getCurrentUser();
          setUser(u);
        } else {
          const rt = await getRefreshToken();
          if (rt) {
            const r = await api.refresh(rt);
            setUser(r.user);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // 로그아웃: 처리 후 로그인 모달 자동 오픈
  const logout = async () => {
    try {
      if (USE_SERVER) {
        const rt = await getRefreshToken();
        await api.logout(rt || '');
        await clearAuthTokens();
      } else {
        await clearCurrentUser();
      }
    } finally {
      setUser(null);
      setAuthMode('login');
      setAuthVisible(true); // ← 로그아웃 직후 로그인 모달 표시
    }
  };

  if (booting) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      {/* 지도는 항상 표시, 버튼은 상태에 따라 로그인/로그아웃 */}
      <MainScreen
        user={user}
        onLogin={() => { setAuthMode('login'); setAuthVisible(true); }}
        onLogout={logout}
      />

      {/* 로그인/회원가입 모달 */}
      <Modal
        visible={authVisible}
        animationType="slide"
        onRequestClose={() => setAuthVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setAuthVisible(false)} hitSlop={8}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>

          {authMode === 'login' ? (
            <LoginScreen
              onLoggedIn={(u) => {
                setUser(u);
                setAuthVisible(false);
              }}
              switchToSignup={() => setAuthMode('signup')}
            />
          ) : (
            <SignupScreen
              onSignedUp={(u) => {
                setUser(u);
                setAuthVisible(false);
              }}
              switchToLogin={() => setAuthMode('login')}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalHeader: { paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-end' },
  closeText: { fontSize: 16, color: '#111' },
});
