// App.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer, RouteProp } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, Text } from "react-native";

import FavoritesScreen from "./screens/FavoritesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import MyInfoScreen from "./screens/MyInfoScreen";

import { getToken, getCurrentUser, removeToken, setCurrentUser } from "./utils/authStorage";

// ── MainScreen 동적 로드 (없으면 KakaoMap1로 대체) ──────────────────────────
let MainScreen: React.ComponentType<any>;
try {
  MainScreen = require("./app/MainScreen").default;
} catch {
  try {
    MainScreen = require("./app/KakaoMap1").default;
  } catch {
    MainScreen = () => (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>지도 화면(MainScreen)을 연결하세요.</Text>
      </View>
    );
  }
}

// 탭 파라미터 타입
type RootTabParamList = {
  지도: undefined;
  즐겨찾기: undefined;
  내정보: undefined;
  설정: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

type User = { name: string; email: string };

function AuthGate({
  mode,
  onDone,
  switchMode,
}: {
  mode: "login" | "signup";
  onDone: (u: User) => void;
  switchMode: () => void;
}) {
  if (mode === "login") return <LoginScreen onSuccess={onDone} onSwitch={switchMode} />;
  return <SignupScreen onSuccess={onDone} onSwitch={switchMode} />;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // 부팅 시 토큰/유저 로드
  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([getToken(), getCurrentUser()]);
        if (t && u) setUser(u as any);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onAuthDone = (u: User) => {
    setUser(u);
  };

  const onLogout = async () => {
    await removeToken();
    await setCurrentUser(null);
    setUser(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({
          route,
        }: {
          route: RouteProp<RootTabParamList, keyof RootTabParamList>;
        }) => ({
          tabBarIcon: ({ color, size }) => {
            const name =
              route.name === "지도"
                ? "map"
                : route.name === "즐겨찾기"
                ? "star"
                : route.name === "설정"
                ? "settings"
                : "person";
            return <Ionicons name={name as any} size={size} color={color} />;
          },
          headerShown: false,
          tabBarActiveTintColor: "#4a6cff",
          tabBarInactiveTintColor: "#999",
        })}
      >
        <Tab.Screen name="지도" component={MainScreen} />
        <Tab.Screen name="즐겨찾기" component={FavoritesScreen} />

        <Tab.Screen name="내정보">
          {() =>
            user ? (
              <MyInfoScreen user={user} onLogout={onLogout} />
            ) : (
              <AuthGate
                mode={authMode}
                onDone={onAuthDone}
                switchMode={() =>
                  setAuthMode((prev) => (prev === "login" ? "signup" : "login"))
                }
              />
            )
          }
        </Tab.Screen>

        <Tab.Screen name="설정" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
