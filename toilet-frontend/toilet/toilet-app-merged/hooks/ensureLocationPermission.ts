import * as Location from "expo-location";
import {  } from "react-native";
import * as ReactNative from "react-native";
const Alert = ReactNative.Alert;

export async function ensureLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "위치 권한 필요",
      "주변 화장실 검색을 위해 위치 정보 권한이 필요합니다. 설정 > 앱 > 권한에서 허용해주세요."
    );
    return false;
  }
  return true;
}