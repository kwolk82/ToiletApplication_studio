import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../services/api';
import { saveToken, setRememberEmail, getRememberEmail } from '../utils/authStorage';

type Props = {
  onSuccess?: (user: { name: string; email: string }) => void; // App.tsx에서 받은 콜백
  onSwitch?: () => void; // 회원가입 화면으로 전환
};

export default function LoginScreen({ onSuccess, onSwitch }: Props) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    (async () => {
      const r = await getRememberEmail();
      if (r) setEmail(r);
    })();
  }, []);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.login(email.trim(), password);
      if (!res.success || !res.token || !res.user) {
        throw new Error(res.message || '로그인 실패');
      }
      await saveToken(res.token);
      await setRememberEmail(email.trim());
      onSuccess?.({ name: res.user.name, email: res.user.email });
    } catch (e: any) {
      Alert.alert('오류', e.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <Text style={styles.title}>로그인</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator /> : <Text style={styles.primaryText}>로그인</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={onSwitch} disabled={loading}>
        <Text style={styles.linkText}>아직 계정이 없나요? 회원가입</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    backgroundColor: '#4a6cff', borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#4a6cff', fontWeight: '700' },
});
