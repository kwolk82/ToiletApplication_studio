import * as ReactNative from "react-native";
const Alert = ReactNative.Alert;
// screens/SignupScreen.tsx
import React, { useState } from "react";
import { View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  
  KeyboardAvoidingView,
  Platform } from "react-native";
import { signup } from "../services/api";
import { saveToken, setCurrentUser, setRememberEmail } from "../utils/authStorage";

type Props = {
  onSuccess?: (user: { name: string; email: string }) => void;
  onSwitch?: () => void; // 로그인 화면으로 전환
};

export default function SignupScreen({ onSuccess, onSwitch }: Props) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || !password) {
      Alert.alert("입력 필요", "이름/이메일/비밀번호를 모두 입력하세요.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("비밀번호 확인", "비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await signup(name, email, password);
      if (!res?.success || !res?.token) throw new Error("회원가입 실패");
      await saveToken(res.token);
      await setCurrentUser(res.user);
      await setRememberEmail(email);
      onSuccess?.(res.user);
    } catch (e: any) {
      Alert.alert("회원가입 실패", e?.response?.data?.message || e?.message || "다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <View style={styles.container}>
        <Text style={styles.title}>회원가입</Text>

        <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          placeholder="이메일"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="비밀번호 확인" secureTextEntry value={confirm} onChangeText={setConfirm} />

        <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.primaryText}>가입하기</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={onSwitch}>
          <Text style={styles.linkText}>이미 계정이 있나요? 로그인</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  primaryBtn: {
    backgroundColor: "#4a6cff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#4a6cff", fontWeight: "700" },
});