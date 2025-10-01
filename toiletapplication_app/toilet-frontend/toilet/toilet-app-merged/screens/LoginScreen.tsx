import * as ReactNative from "react-native";
const Alert = ReactNative.Alert;
// screens/LoginScreen.tsx
import React, { useEffect, useState } from "react";
import { View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  
  KeyboardAvoidingView,
  Platform } from "react-native";
import { login } from "../services/api";
import {
  saveToken,
  setCurrentUser,
  setRememberEmail,
  getRememberEmail,
} from "../utils/authStorage";

type Props = {
  onSuccess?: (user: { name: string; email: string }) => void;
  onSwitch?: () => void; // 회원가입 화면으로 전환
};

export default function LoginScreen({ onSuccess, onSwitch }: Props) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const remembered = await getRememberEmail();
      if (remembered) setEmail(remembered);
    })();
  }, []);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert("입력 필요", "이메일과 비밀번호를 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res?.success || !res?.token) throw new Error("로그인 실패");
      await saveToken(res.token);
      await setCurrentUser(res.user);
      await setRememberEmail(email);
      onSuccess?.(res.user);
    } catch (e: any) {
      Alert.alert("로그인 실패", e?.response?.data?.message || e?.message || "다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <View style={styles.container}>
        <Text style={styles.title}>로그인</Text>

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="이메일"
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

        <TouchableOpacity style={styles.linkBtn} onPress={onSwitch}>
          <Text style={styles.linkText}>아직 계정이 없나요? 회원가입</Text>
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