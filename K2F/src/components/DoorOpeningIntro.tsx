import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DOOR_WIDTH = Math.min(SCREEN_WIDTH * 0.76, 355);
const DOOR_HEIGHT = Math.min(SCREEN_HEIGHT * 0.74, 660);

// Keys2Fitness palette — change DOOR_BLUE if you want a different shade.
const DOOR_BLUE = '#438EF2';
const DOOR_DARK = '#176E96';
const DOOR_LIGHT = '#BDD3DC';
const SILVER = '#F7FAFB';

type Props = { onComplete: () => void };

/**
 * Mount this OVER the actual next screen (e.g. Choose Dashboard).
 * Its backdrop becomes transparent during the swing, exposing the real screen.
 */
export default function DoorOpeningIntro({ onComplete }: Props) {
  const keyIn = useRef(new Animated.Value(0)).current;
  const keyTurn = useRef(new Animated.Value(0)).current;
  const keyOut = useRef(new Animated.Value(1)).current;
  const handleDown = useRef(new Animated.Value(0)).current;
  const open = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(1)).current;
  const endFade = useRef(new Animated.Value(1)).current;
  const completeRef = useRef(onComplete);

  useEffect(() => { completeRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.delay(400),
      Animated.timing(keyIn, {
        toValue: 1, duration: 820, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.delay(130),
      Animated.timing(keyTurn, {
        toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(handleDown, {
        toValue: 1, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
      }),
      Animated.delay(130),
      Animated.parallel([
        Animated.timing(keyOut, { toValue: 0, duration: 230, useNativeDriver: true }),
        Animated.timing(open, {
          toValue: 1, duration: 1800,
          easing: Easing.bezier(0.25, 0.1, 0.12, 1), useNativeDriver: true,
        }),
        // This is what exposes the REAL screen behind the door.
        Animated.timing(backdrop, {
          toValue: 0, duration: 1400, easing: Easing.in(Easing.cubic), useNativeDriver: true,
        }),
      ]),
      Animated.delay(140),
      Animated.timing(endFade, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]);
    sequence.start(({ finished }) => { if (finished) completeRef.current(); });
    return () => sequence.stop();
  }, [keyIn, keyTurn, keyOut, handleDown, open, backdrop, endFade]);

  const doorY = open.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-86deg'] });
  const handleRotation = handleDown.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '23deg'] });
  const keyX = keyIn.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });
  const keyRotation = keyTurn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '85deg'] });
  const frameFade = open.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.85, 0] });

  return (
    <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity: endFade }]}>
      {/* The screen below is already mounted; this background fades as the door opens. */}
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
      <Animated.Text style={[styles.wordmark, { opacity: backdrop }]}>KEYS2FITNESS</Animated.Text>

      <View style={styles.doorArea}>
        <Animated.View style={[styles.frame, { opacity: frameFade }]} pointerEvents="none" />
        <Animated.View
          style={[
            styles.door,
            {
              transform: [
                { perspective: 1100 },
                { translateX: -DOOR_WIDTH / 2 },
                { rotateY: doorY },
                { translateX: DOOR_WIDTH / 2 },
              ],
            },
          ]}
        >
          {/* Slim raised edge, two recessed rectangular panels like your example */}
          <View style={styles.leftSheen} />
          <View style={styles.rightShadow} />
          <View style={styles.topPanel}><View style={styles.panelInset} /></View>
          <View style={styles.bottomPanel}><View style={styles.panelInset} /></View>

          {/* Modern brushed-silver door lever */}
          <Animated.View style={[styles.handleAssembly, { transform: [{ rotate: handleRotation }] }]}>
            <View style={styles.handlePlate} />
            <View style={styles.handleStem} />
            <View style={styles.handleLever} />
            <View style={styles.handleGloss} />
          </Animated.View>

          <View style={styles.lockPlate}>
            <View style={styles.keyholeTop} />
            <View style={styles.keyholeBase} />
          </View>

          {/* Black key: approaches from the right, inserts, then twists. */}
          <Animated.View
            style={[
              styles.key,
              { opacity: keyOut, transform: [{ translateX: keyX }, { rotate: keyRotation }] },
            ]}
          >
            <View style={styles.keyHead}><View style={styles.keyHeadHole} /></View>
            <View style={styles.keyShaft} />
            <View style={styles.keyNotchOne} />
            <View style={styles.keyNotchTwo} />
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    zIndex: 1000, elevation: 1000, alignItems: 'center', justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: '#EAF4FF',
  },
  wordmark: {
    position: "absolute",
    fontSize: 28,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 2,
    color: "#2069CB",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 4,
  },
  doorArea: { width: DOOR_WIDTH, height: DOOR_HEIGHT },
  frame: {
    position: 'absolute', top: -12, left: -12, right: -12, bottom: -12,
    borderWidth: 12, borderColor: '#C6D9EF',
    borderTopColor: '#F6FBFF', borderLeftColor: '#EEF6FF',
    borderRightColor: '#87ADD7', borderBottomColor: '#92B3D8',
  },
  door: {
    position: 'absolute', top: 0, left: 0, width: DOOR_WIDTH, height: DOOR_HEIGHT,
    backgroundColor: DOOR_BLUE, borderWidth: 3, borderColor: DOOR_DARK,
    backfaceVisibility: 'hidden',
    shadowColor: '#092D61', shadowOpacity: 0.5, shadowRadius: 16, elevation: 16,
  },
  leftSheen: {
    position: 'absolute', left: 5, top: 0, bottom: 0, width: 9,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  rightShadow: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 12,
    backgroundColor: 'rgba(7,38,93,0.22)',
  },
  topPanel: {
    position: 'absolute', left: '16%', right: '16%', top: '8%', height: '47%',
    borderWidth: 6, borderTopColor: '#1C58A8', borderLeftColor: '#1C58A8',
    borderRightColor: '#82B9FF', borderBottomColor: '#82B9FF',
    backgroundColor: '#367DD9', padding: 5,
  },
  bottomPanel: {
    position: 'absolute', left: '16%', right: '16%', top: '64%', height: '28%',
    borderWidth: 6, borderTopColor: '#1C58A8', borderLeftColor: '#1C58A8',
    borderRightColor: '#82B9FF', borderBottomColor: '#82B9FF',
    backgroundColor: '#367DD9', padding: 5,
  },
  panelInset: {
    flex: 1, backgroundColor: '#579BF1',
    borderWidth: 2, borderTopColor: '#357AD4', borderLeftColor: '#357AD4',
    borderRightColor: DOOR_LIGHT, borderBottomColor: DOOR_LIGHT,
  },
  handleAssembly: {
    position: 'absolute', top: '55%', right: 4, width: 88, height: 40,
    justifyContent: 'center',
  },
  handlePlate: {
    position: 'absolute', right: 11, top: 5, width: 29, height: 30,
    borderRadius: 5, borderWidth: 2, borderColor: '#8897A8', backgroundColor: SILVER,
  },
  handleStem: {
    position: 'absolute', right: 33, top: 16, width: 17, height: 9,
    backgroundColor: '#AEBAC8', borderRadius: 3,
  },
  handleLever: {
    position: 'absolute', right: 37, top: 15, width: 47, height: 11,
    borderRadius: 4, backgroundColor: '#CBD2DB', borderWidth: 1, borderColor: '#A2ADBA',
  },
  handleGloss: {
    position: 'absolute', right: 43, top: 16, width: 37, height: 2,
    borderRadius: 2, backgroundColor: '#FFFFFF', opacity: 0.9,
  },
  lockPlate: {
    position: 'absolute', right: 16, top: '65%', width: 19, height: 25,
    backgroundColor: '#CED8E3', borderWidth: 2, borderColor: '#8D9DAC',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  keyholeTop: { height: 7, width: 7, borderRadius: 4, backgroundColor: '#1C293B' },
  keyholeBase: { height: 9, width: 4, marginTop: -1, backgroundColor: '#1C293B' },
  key: {
    position: 'absolute', right: 25, top: '65%', marginTop: 6,
    width: 112, height: 26,
  },
  keyHead: {
    position: 'absolute', top: 0, left: 0, height: 26, width: 29,
    borderRadius: 9, backgroundColor: '#15171B', borderWidth: 2, borderColor: '#3C4149',
    alignItems: 'center', justifyContent: 'center',
  },
  keyHeadHole: { height: 12, width: 12, borderRadius: 6, backgroundColor: DOOR_BLUE },
  keyShaft: {
    position: 'absolute', top: 10, left: 26, width: 84, height: 7,
    backgroundColor: '#1E2229', borderRadius: 2,
  },
  keyNotchOne: {
    position: 'absolute', top: 14, left: 77, width: 7, height: 10,
    backgroundColor: '#15171B',
  },
  keyNotchTwo: {
    position: 'absolute', top: 14, left: 92, width: 8, height: 7,
    backgroundColor: '#15171B',
  },
});
