// components/RadiusStepper.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  index: number;
  optionsKm: number[];          // [0.5, 1, 1.5, ...]
  onChange: (nextIndex: number) => void;
};

function labelOf(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km}km`;
}

export default function RadiusStepper({ index, optionsKm, onChange }: Props) {
  const canDec = index > 0;
  const canInc = index < optionsKm.length - 1;
  const onDec = () => canDec && onChange(index - 1);
  const onInc = () => canInc && onChange(index + 1);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={onDec} disabled={!canDec} style={[styles.btn, !canDec && styles.disabled]}>
        <Text style={styles.btnText}>−</Text>
      </TouchableOpacity>

      <View style={styles.valueBox}>
        <Text style={styles.valueText}>{labelOf(optionsKm[index])}</Text>
      </View>

      <TouchableOpacity onPress={onInc} disabled={!canInc} style={[styles.btn, !canInc && styles.disabled]}>
        <Text style={styles.btnText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#333', fontSize: 18, fontWeight: '700' },
  valueBox: { minWidth: 64, paddingHorizontal: 10, alignItems: 'center' },
  valueText: { fontSize: 14, fontWeight: '600', color: '#111' },
  disabled: { opacity: 0.3 },
});
