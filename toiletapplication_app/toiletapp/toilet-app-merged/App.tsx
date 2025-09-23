import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import FavoritesScreen from './screens/FavoritesScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';

// ✅ HomeScreen 대신 MainScreen을 사용
import MainScreen from './app/MainScreen';

import { getToken, getCurrentUser, setCurrentUser } from './utils/authStorage';

const Tab = createBottomTabNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const u = await getCurrentUser();
        if (token && u) setUser(u);
      } catch (e) {
        console.log('[auth] restore failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (u: { name: string; email: string }) => {
    setUser(u);
    await setCurrentUser(u);
  };

  const signOut = async () => {
    setUser(null);
    await setCurrentUser(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (showAuth) {
    return authMode === 'login' ? (
      <LoginScreen
        onSuccess={async (u) => {
          await signIn(u);
          setShowAuth(false);
        }}
        onSwitch={() => setAuthMode('signup')}
      />
    ) : (
      <SignupScreen
        onSuccess={async (u) => {
          await signIn(u);
          setShowAuth(false);
        }}
        onSwitch={() => setAuthMode('login')}
      />
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Favorites') iconName = 'star';
            else if (route.name === 'Settings') iconName = 'settings';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          headerShown: true, // 필요시 false로 변경 가능
        })}
      >
        {/* ✅ Home 탭: MainScreen으로 교체 */}
        <Tab.Screen name="Home" options={{ title: '지도' }}>
          {() => (
            <MainScreen
              user={currentUser}
              onLogin={() => {
                setAuthMode('login');
                setShowAuth(true);
              }}
              onLogout={signOut}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Favorites" component={FavoritesScreen} />

        <Tab.Screen name="Settings">
          {() => (
            <SettingsScreen
              user={currentUser}
              onLoginRequest={() => {
                setAuthMode('login');
                setShowAuth(true);
              }}
              onSignupRequest={() => {
                setAuthMode('signup');
                setShowAuth(true);
              }}
              onLogout={signOut}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
