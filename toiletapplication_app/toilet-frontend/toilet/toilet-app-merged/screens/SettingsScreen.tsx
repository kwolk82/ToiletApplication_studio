// screens/SettingsScreen.tsx
import React, { useEffect, useState } from "react";
import * as ReactNative from "react-native"; // 네임스페이스 방식(타입 안전)
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getToken,
  getCurrentUser,
  removeToken,
  setCurrentUser,
} from "../utils/authStorage";

// 네임스페이스에서 필요한 컴포넌트만 구조분해
const { View, Text, Switch, Pressable, StyleSheet, Platform } = ReactNative;
// Alert 별칭 (import가 모두 끝난 뒤에 선언!) 
const Alert = ReactNative.Alert;

type Theme = "system" | "light" | "dark";
type Lang = "ko" | "en";
type Prefs = {
  notifications: boolean;
  locationOn: boolean;
  theme: Theme;
  language: Lang;
  autoRadius: boolean; // 앱 전용 옵션 예시(자동 반경 조절)
};

const PREFS_KEY = "APP_PREFS_V2";

export default function SettingsScreen() {
  const navigation = useNavigation();

  // 기본 상태
  const [prefs, setPrefs] = useState<Prefs>({
    notifications: true,
    locationOn: true,
    theme: "system",
    language: "ko",
    autoRadius: true,
  });

  // ---- 알림 표시 핸들러 (SDK 54 타입 맞춤) ----
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        // iOS 표시 옵션
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  // ---- 저장/불러오기 ----
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) setPrefs(JSON.parse(raw));
      } catch {
        // ignore
      }
    })();
  }, []);

  const save = async (next: Prefs) => {
    setPrefs(next);
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // ---- 권한 요청 ----
  const askNotif = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("알림", "알림 권한이 거부되었습니다.");
      await save({ ...prefs, notifications: false });
    }
  };

  const askLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      Alert.alert("알림", "위치 권한이 거부되었습니다.");
      await save({ ...prefs, locationOn: false });
    }
  };

  // ---- 토글/전환 핸들러 ----
  const toggle =
    <K extends keyof Prefs>(k: K) =>
    async (v: Prefs[K]) => {
      const next = { ...prefs, [k]: v };
      await save(next);
    };

  const onToggleNotifications = async (v: boolean) => {
    await toggle("notifications")(v);
    if (v) await askNotif();
  };

  const onToggleLocation = async (v: boolean) => {
    await toggle("locationOn")(v);
    if (v) await askLocation();
  };

  const cycleLanguage = async () => {
    const next = prefs.language === "ko" ? "en" : "ko";
    await toggle("language")(next);
    // TODO: i18n 연동
  };

  const cycleTheme = async () => {
    const order: Theme[] = ["system", "light", "dark"];
    const idx = order.indexOf(prefs.theme);
    const next = order[(idx + 1) % order.length];
    await toggle("theme")(next);
    // TODO: ThemeProvider/Appearance 연동
  };

  // ---- 유틸 버튼 ----
  const clearCache = () => {
    Alert.alert("캐시 삭제", "앱의 저장 데이터를 초기화할까요?", [
      { text: "취소" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            await save({
              notifications: true,
              locationOn: true,
              theme: "system",
              language: "ko",
              autoRadius: true,
            });
            Alert.alert("완료", "캐시가 삭제되었습니다.");
          } catch {
            Alert.alert("오류", "캐시 삭제 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  // 실제 로그아웃(토큰/유저 제거 + 내정보 탭 이동)
  const doLogout = async () => {
    await removeToken();
    await setCurrentUser(null);
    Alert.alert("로그아웃", "정상적으로 로그아웃되었습니다.");
    // 내정보 탭으로 이동 → 로그인/회원가입 폼이 보이게
    navigation.navigate("내정보" as never);
  };

  const logout = () =>
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소" },
      { text: "로그아웃", style: "destructive", onPress: () => void doLogout() },
    ]);

  const withdraw = () =>
    Alert.alert("회원 탈퇴", "계정이 영구 삭제됩니다. 진행할까요?", [
      { text: "취소" },
      { text: "탈퇴", style: "destructive", onPress: () => Alert.alert("완료", "탈퇴(예시)") },
    ]);

  const showLicenses = () => {
    Alert.alert(
      "오픈소스 라이선스",
      "라이선스 목록은 추후 별도 화면으로 연결할 수 있어요.\n(expo-licenses 사용 권장)"
    );
  };

  const showVersion = () => {
    const v =
      Constants.expoConfig?.version ??
      (Constants as any).manifest2?.extra?.expoClient?.version ??
      "unknown";
    Alert.alert("버전 정보", `v${v} (${Platform.OS})`);
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>설정</Text>

      {/* 앱 */}
      <Text style={s.section}>앱</Text>
      <RowSwitch label="알림" value={prefs.notifications} onChange={onToggleNotifications} />
      <RowPress
        label="언어"
        value={prefs.language === "ko" ? "한국어" : "English"}
        onPress={cycleLanguage}
      />
      <RowPress
        label="테마"
        value={prefs.theme === "system" ? "시스템" : prefs.theme === "light" ? "라이트" : "다크"}
        onPress={cycleTheme}
      />
      <RowSwitch label="위치 권한 사용" value={prefs.locationOn} onChange={onToggleLocation} />
      <RowSwitch label="자동 반경 조절" value={prefs.autoRadius} onChange={toggle("autoRadius")} />

      {/* 정보/기타 */}
      <Text style={s.section}>정보</Text>
      <RowButton label="오픈소스 라이선스" onPress={showLicenses} />
      <RowButton label="버전 정보" onPress={showVersion} />

      {/* 유틸 */}
      <Text style={s.section}>유틸리티</Text>
      <RowButton label="캐시 삭제" onPress={clearCache} />

      {/* 위험 구역 */}
      <View style={{ height: 20 }} />
      <View style={s.card}>
        <Text style={[s.section, { color: "#b00020", marginBottom: 6 }]}>위험 구역</Text>
        <Pressable style={s.dangerBtn} onPress={logout}>
          <Text style={s.dangerText}>로그아웃</Text>
        </Pressable>
        <Pressable style={[s.dangerBtn, { backgroundColor: "#b00020" }]} onPress={withdraw}>
          <Text style={[s.dangerText, { color: "white" }]}>회원 탈퇴</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** 재사용 가능한 행 UI들 */
function RowSwitch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void | Promise<void>;
}) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function RowPress({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <Text style={s.rowLabel}>{label}</Text>
      {value ? <Text style={s.link}>{value}</Text> : <Text style={s.link}>변경</Text>}
    </Pressable>
  );
}

function RowButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.link}>열기</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f7f9" },
  header: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  section: { marginTop: 18, marginBottom: 6, fontWeight: "700", fontSize: 15, color: "#333" },
  row: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 15, color: "#222" },
  link: { color: "#0066cc", fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#eee" },
  dangerBtn: { padding: 14, alignItems: "center" },
  dangerText: { fontWeight: "700", color: "#b00020" },
});
