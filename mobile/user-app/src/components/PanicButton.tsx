import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, Vibration, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { usePanicHold } from '../hooks/usePanicHold';

const SIZE = 200;
const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  onConfirm: () => void;
}

export default function PanicButton({ onConfirm }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const [dashOffset, setDashOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setDashOffset(CIRCUMFERENCE * (1 - value));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const handleConfirm = () => {
    Vibration.vibrate([0, 120, 80, 120]);
    onConfirm();
  };

  const { start, cancel } = usePanicHold(handleConfirm);

  const startWithAnimation = () => {
    Vibration.vibrate(60);
    animation.current = Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    });
    animation.current.start();
    start();
  };

  const cancelWithAnimation = () => {
    animation.current?.stop();
    Animated.timing(progress, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
    cancel();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: startWithAnimation,
      onPanResponderRelease: cancelWithAnimation,
      onPanResponderTerminate: cancelWithAnimation,
    }),
  ).current;

  return (
    <View style={styles.wrapper} {...panResponder.panHandlers}>
      <Svg
        width={SIZE}
        height={SIZE}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#1e293b"
          strokeWidth={10}
          fill="transparent"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#ef4444"
          strokeWidth={10}
          fill="transparent"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>

      <View style={styles.inner}>
        <Text style={styles.sos}>SOS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: SIZE - 36,
    height: SIZE - 36,
    borderRadius: (SIZE - 36) / 2,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  sos: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
  },
});
