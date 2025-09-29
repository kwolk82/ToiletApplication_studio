/**
 * 인증 공용 폼
 * - 로그인/회원가입 공용 입력 UI
 * - Enter(모바일 Done)로 제출
 * - 비밀번호 보기/숨김 토글
 * - 회원가입 화면에서만 비밀번호 강도 표시
 * - 로그인 화면의 옵션/링크는 footer 슬롯으로 주입
 * - 비밀번호 8자 미만일 때 제출 비활성화(엔터 포함)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  mode: 'login' | 'signup';
  onSubmit: (vals: {name?: string; email: string; password: string}) => void;
  switchMode: () => void;
  defaults?: { name?: string; email?: string };
  footer?: React.ReactNode;
};

export default function AuthForm({ mode, onSubmit, switchMode, defaults, footer }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (defaults?.name) setName(defaults.name);
    if (defaults?.email) setEmail(defaults.email);
  }, [defaults?.name, defaults?.email]);

  // 제출 가능 여부: 로그인은 비번 8+, 회원가입은 닉네임/아이디/비번 요건 모두
  const canSubmit = useMemo(() => {
    if (mode === 'signup') {
      return name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;
    }
    return password.length >= 8;
  }, [mode, name, email, password]);

  const handle = () => {
    if (!canSubmit) return;
    if (mode === 'signup') onSubmit({ name, email, password });
    else onSubmit({ email, password });
  };

  // 비밀번호 강도(회원가입 전용)
  const pwScore = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[a-z]/.test(password)) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 5);
  }, [password]);

  const strength = useMemo(() => {
    if (!password) return { label: '', ratio: 0, color: '#ddd' };
    if (pwScore <= 2) return { label: '약함', ratio: 0.4, color: '#ef4444' };
    if (pwScore === 3) return { label: '보통', ratio: 0.7, color: '#f59e0b' };
    return { label: '강함', ratio: 1.0, color: '#22c55e' };
  }, [pwScore, password]);

  return (
    <View style={styles.container}>
      {mode === 'signup' && (
        <View style={styles.inputWrap}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            placeholder='사용할 닉네임'
            value={name}
            onChangeText={setName}
          />
        </View>
      )}

      <View style={styles.inputWrap}>
        <Text style={styles.label}>아이디</Text>
        <TextInput
          style={styles.input}
          placeholder='아이디(이메일)'
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
        />
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.label}>비밀번호</Text>

        {/* 비밀번호 입력 + 눈아이콘 토글 */}
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[styles.input, { paddingRight: 44 }]}
            placeholder={mode === 'signup' ? '비밀번호(8자 이상)' : '비밀번호'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            onSubmitEditing={handle}       // Enter/Done 키로 제출(8자 미만이면 무시)
            returnKeyType='done'
          />
          <TouchableOpacity
            style={styles.eye}
            onPress={() => setShowPw(v => !v)}
            accessibilityRole='button'
            accessibilityLabel={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
          >
            <Text style={{ fontSize: 18 }}>{showPw ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        {/* 8자 미만 경고 */}
        {password.length > 0 && password.length < 8 ? (
          <Text style={styles.helperError}>비밀번호는 8자 이상이어야 합니다.</Text>
        ) : null}

        {/* 강도 표시는 회원가입에서만 */}
        {mode === 'signup' && password ? (
          <View style={{ marginTop: 6 }}>
            <View style={styles.strengthBg}>
              <View style={[styles.strengthFg, { width: `${strength.ratio * 100}%`, backgroundColor: strength.color }]} />
            </View>
            <Text style={styles.strengthLabel}>{strength.label}</Text>
          </View>
        ) : null}
      </View>

      {/* 주 버튼(8자 미만이면 비활성화) */}
      <TouchableOpacity
        style={[styles.button, !canSubmit && { opacity: 0.6 }]}
        onPress={handle}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonText}>{mode === 'signup' ? 'Sign up' : 'Login'}</Text>
      </TouchableOpacity>

      {/* 회원가입 화면에서만 하단 전환 링크 */}
      {mode === 'signup' ? (
        <TouchableOpacity onPress={switchMode}>
          <Text style={styles.link}>이미 계정이 있어요. 로그인</Text>
        </TouchableOpacity>
      ) : null}

      {/* 로그인 화면용 footer(자동로그인/아이디저장/회원가입) */}
      {mode === 'login' && footer ? <View style={{ marginTop: 8 }}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 14 },
  inputWrap: { gap: 6 },
  label: { fontSize: 14, opacity: 0.8 },
  input: { borderWidth: 1, borderColor: '#AAA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  eye: { position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', width: 28 },
  helperError: { color: '#ef4444', marginTop: 6, fontSize: 12 },
  strengthBg: { height: 6, borderRadius: 4, backgroundColor: '#eee', overflow: 'hidden' },
  strengthFg: { height: 6 },
  strengthLabel: { fontSize: 12, marginTop: 4, opacity: 0.8 },
  button: { backgroundColor: '#222', paddingVertical: 14, alignItems: 'center', borderRadius: 10, marginTop: 6 },
  buttonText: { color: 'white', fontSize: 18 },
  link: { textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },
});
