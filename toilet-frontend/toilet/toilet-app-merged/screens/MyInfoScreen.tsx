// screens/MyInfoScreen.tsx
import React from "react";
import * as ReactNative from "react-native";
const { View, Text, StyleSheet, TouchableOpacity } = ReactNative;

type Props = {
  user: { name: string; email: string };
  onLogout: () => Promise<void> | void;
};

export default function MyInfoScreen({ user, onLogout }: Props) {
  return (
    <View style={s.container}>
      <Text style={s.hello}>
        {user?.name ?? "사용자"} <Text style={s.bold}>회원님</Text>
      </Text>
      <Text style={s.email}>{user?.email}</Text>

      <TouchableOpacity style={s.logoutBtn} onPress={() => onLogout()}>
        <Text style={s.logoutTxt}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", padding: 24 },
  hello: { fontSize: 22, color: "#222", marginBottom: 8 },
  bold: { fontWeight: "800" },
  email: { fontSize: 14, color: "#666", marginBottom: 24 },
  logoutBtn: { backgroundColor: "#ff5a5a", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 },
  logoutTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
