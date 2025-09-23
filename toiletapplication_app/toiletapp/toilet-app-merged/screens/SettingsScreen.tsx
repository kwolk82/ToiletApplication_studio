import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  user: { name: string; email: string } | null;
  onLoginRequest: () => void;
  onSignupRequest: () => void;
  onLogout: () => void;
};

export default function SettingsScreen({ user, onLoginRequest, onSignupRequest, onLogout }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>

      {user ? (
        <>
          <Text style={styles.info}>로그인됨</Text>
          <Text style={styles.info}>이름: {user.name}</Text>
          <Text style={styles.info}>이메일: {user.email}</Text>

          <TouchableOpacity style={[styles.btn, styles.danger]} onPress={onLogout}>
            <Text style={styles.btnText}>로그아웃</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.info}>현재 비로그인 상태입니다.</Text>

          <TouchableOpacity style={styles.btn} onPress={onLoginRequest}>
            <Text style={styles.btnText}>로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnOutline} onPress={onSignupRequest}>
            <Text style={styles.btnOutlineText}>회원가입</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  info: { fontSize: 16, color: '#333' },
  btn: {
    backgroundColor: '#4a6cff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '800' },
  btnOutline: {
    borderColor: '#4a6cff',
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnOutlineText: { color: '#4a6cff', fontWeight: '800' },
  danger: { backgroundColor: '#ff5a5a' },
});
