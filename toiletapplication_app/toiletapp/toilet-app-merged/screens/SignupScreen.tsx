import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../services/api';
import { saveToken, setRememberEmail } from '../utils/authStorage';

type Props = {
  onSuccess?: (user: { name: string; email: string }) => void; // 가입 완료 후 App.tsx 콜백
  onSwitch?: () => void; // 로그인 화면으로 전환
};

export default function SignupScreen({ onSuccess, onSwitch }: Props) {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || !password) {
      Alert.alert('알림', '이름, 이메일, 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('알림', '비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.signup(name.trim(), email.trim(), password);
      if (!res.success || !res.token || !res.user) {
        throw new Error(res.message || '회원가입 실패');
      }
      await saveToken(res.token);
      await setRememberEmail(email.trim());
      onSuccess?.({ name: res.user.name, email: res.user.email });
    } catch (e: any) {
      Alert.alert('오류', e.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="이름"
        autoCapitalize="words"
        value={name}
        onChangeText={setName}
      />

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

      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator /> : <Text style={styles.primaryText}>회원가입</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={onSwitch} disabled={loading}>
        <Text style={styles.linkText}>이미 계정이 있나요? 로그인</Text>
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
