import { useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { GoogleIcon } from '@/components/google-icon';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

const heroImage = require('../../assets/images/onboarding-hero.jpg');
const useNativeDriver = Platform.OS !== 'web';

export function OnboardingScreen() {
  const [isStarted, setIsStarted] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const reduceMotion = useReduceMotion();
  const [sheetProgress] = useState(() => new Animated.Value(0));
  const [optionsProgress] = useState(() => new Animated.Value(0));

  const handleStart = () => {
    if (isStarted) {
      return;
    }

    setIsStarted(true);

    if (reduceMotion) {
      sheetProgress.setValue(1);
      optionsProgress.setValue(1);
      setShowStartButton(false);
      return;
    }

    Animated.parallel([
      Animated.timing(sheetProgress, {
        toValue: 1,
        duration: 500,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: false,
      }),
      Animated.timing(optionsProgress, {
        toValue: 1,
        duration: 320,
        delay: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShowStartButton(false);
      }
    });
  };

  return (
    <View style={styles.screen}>
      <Image source={heroImage} style={styles.hero} resizeMode="cover" accessibilityIgnoresInvertColors />

      <Animated.View
        style={[
          styles.sheet,
          {
            left: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [0, Spacing.two] }),
            right: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [0, Spacing.two] }),
            borderTopLeftRadius: sheetProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [Spacing.three, Spacing.five],
            }),
            borderTopRightRadius: sheetProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [Spacing.three, Spacing.five],
            }),
            borderBottomLeftRadius: sheetProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Spacing.five],
            }),
            borderBottomRightRadius: sheetProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Spacing.five],
            }),
          },
        ]}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>Get together, finally</Text>
          <Text style={styles.body}>No random people. No noise. Just you and your inner circle.</Text>
        </View>

        <Animated.View
          style={[
            styles.actions,
            {
              height: sheetProgress.interpolate({ inputRange: [0, 1], outputRange: [40, 88] }),
            },
          ]}
        >
          {showStartButton && (
            <Animated.View
              accessibilityElementsHidden={isStarted}
              importantForAccessibility={isStarted ? 'no-hide-descendants' : 'auto'}
              style={[
                styles.actionLayer,
                {
                  pointerEvents: isStarted ? 'none' : 'auto',
                  opacity: sheetProgress.interpolate({
                    inputRange: [0, 0.55, 1],
                    outputRange: [1, 0, 0],
                  }),
                  transform: [
                    {
                      translateY: sheetProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable
                style={styles.primaryButton}
                onPress={handleStart}
                accessibilityRole="button"
                accessibilityLabel="Get started"
              >
                <Text style={styles.primaryButtonLabel}>Get started</Text>
              </Pressable>
            </Animated.View>
          )}

          <Animated.View
            aria-hidden={!isStarted}
            accessibilityElementsHidden={!isStarted}
            importantForAccessibility={isStarted ? 'auto' : 'no-hide-descendants'}
            style={[
              styles.actionLayer,
              styles.options,
              {
                pointerEvents: isStarted ? 'auto' : 'none',
                opacity: optionsProgress,
                transform: [
                  {
                    translateY: optionsProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable
              style={styles.primaryButton}
              disabled
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.primaryButtonLabel}>Continue with Google</Text>
              <View style={styles.googleIcon}>
                <GoogleIcon />
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
              onPress={() => router.push('/enter-email')}
              accessibilityRole="button"
              accessibilityLabel="Continue with email"
            >
              <Text style={styles.secondaryButtonLabel}>Continue with email</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
    overflow: 'hidden',
  },
  hero: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.four,
    paddingVertical: 48,
    gap: Spacing.six,
  },
  copy: {
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0,
    color: Colors.ink,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22.4,
    color: Colors.muted,
  },
  actions: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
  },
  options: {
    gap: Spacing.two,
  },
  primaryButton: {
    height: 40,
    borderRadius: Spacing.two,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  primaryButtonLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.32,
    color: Colors.cream,
    textAlign: 'center',
  },
  googleIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  secondaryButton: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  secondaryPressed: {
    opacity: 0.75,
  },
  secondaryButtonLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.32,
    color: Colors.primary,
    textAlign: 'center',
  },
});
