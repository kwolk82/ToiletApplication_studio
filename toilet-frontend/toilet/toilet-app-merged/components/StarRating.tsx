// components/StarRating.tsx
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function StarRating({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[s.star, { fontSize: size }]}>{i <= value ? "★" : "☆"}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  star: { color: "#ffb400", marginRight: 4 },
});
