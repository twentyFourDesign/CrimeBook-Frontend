import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ─────────────────────────────────────────────
   SLIDE DATA
───────────────────────────────────────────── */
const SLIDES = [
  {
    id: 'shield',
    icon: 'shield-checkmark' as const,
    bgFrom: '#FFFFFF',
    bgTo: '#F0F7FF',
    accentColor: '#2563EB',
    glowColor: 'rgba(37,99,235,0.08)',
    title: 'Report Crime\nInstantly',
    subtitle:
      'Submit detailed incident reports with photo evidence, precise GPS location, and live police tracking — all in under 60 seconds.',
    badge: 'INTELLIGENT REPORTING',
    stats: [
      { icon: 'camera', label: 'Photo Evidence' },
      { icon: 'location', label: 'GPS Precise' },
      { icon: 'flash', label: '60s Submission' },
    ],
  },
  {
    id: 'map',
    icon: 'map' as const,
    bgFrom: '#FFFFFF',
    bgTo: '#F0FDF4',
    accentColor: '#16A34A',
    glowColor: 'rgba(22,163,74,0.08)',
    title: 'Live Safety\nIntelligence',
    subtitle:
      'AI-powered crime heatmaps reveal danger zones near you in real-time. Know where threats are before you step outside.',
    badge: 'AI POWERED',
    stats: [
      { icon: 'analytics', label: 'Real-time Data' },
      { icon: 'eye', label: 'Heat Mapping' },
      { icon: 'trending-up', label: 'Predictions' },
    ],
  },
  {
    id: 'bell',
    icon: 'notifications' as const,
    bgFrom: '#FFFFFF',
    bgTo: '#F5F3FF',
    accentColor: '#7C3AED',
    glowColor: 'rgba(124,58,237,0.08)',
    title: 'Instant Threat\nAlerts',
    subtitle:
      'Receive sub-second notifications the moment any crime is detected in your neighbourhood. Stay ahead, stay safe.',
    badge: 'ALWAYS ALERT',
    stats: [
      { icon: 'pulse', label: 'Sub-second' },
      { icon: 'people', label: 'Community' },
      { icon: 'lock-closed', label: 'Private & Secure' },
    ],
  },
];


/* ─────────────────────────────────────────────
   SINGLE SLIDE
───────────────────────────────────────────── */
function OnboardingSlide({
  slide,
  isActive,
  index,
}: {
  slide: (typeof SLIDES)[0];
  isActive: boolean;
  index: number;
}) {
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(40)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const statsY = useRef(new Animated.Value(20)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Reset
      iconScale.setValue(0);
      iconRotate.setValue(0);
      titleY.setValue(40);
      titleOpacity.setValue(0);
      subtitleY.setValue(30);
      subtitleOpacity.setValue(0);
      badgeOpacity.setValue(0);
      statsY.setValue(20);
      statsOpacity.setValue(0);

      // Entrance sequence
      Animated.sequence([
        Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(badgeOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(titleY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
          Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(subtitleY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
          Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(statsY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
          Animated.timing(statsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ]).start();

      // Continuous float animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconFloat, { toValue: -10, duration: 2500, useNativeDriver: true }),
          Animated.timing(iconFloat, { toValue: 0, duration: 2500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isActive]);

  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <View style={styles.iconArea}>
        <Animated.View
          style={[
            styles.iconCircle,
            {
              shadowColor: slide.accentColor,
              transform: [
                { scale: iconScale },
                { translateY: iconFloat },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.iconInnerGlow,
              { backgroundColor: slide.glowColor },
            ]}
          />
          <Ionicons name={slide.icon} size={72} color={slide.accentColor} />
        </Animated.View>
      </View>

      {/* Badge */}
      <Animated.View style={[styles.badge, { borderColor: slide.accentColor + '40', opacity: badgeOpacity, backgroundColor: slide.accentColor + '10' }]}>
        <View style={[styles.badgeDot, { backgroundColor: slide.accentColor }]} />
        <Text style={[styles.badgeText, { color: slide.accentColor }]}>{slide.badge}</Text>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
          },
        ]}
      >
        {slide.title}
      </Animated.Text>

      {/* Accent underline */}
      <View style={[styles.titleUnderline, { backgroundColor: slide.accentColor }]} />

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleY }],
          },
        ]}
      >
        {slide.subtitle}
      </Animated.Text>

      {/* Stat pills */}
      <Animated.View
        style={[
          styles.statsRow,
          {
            opacity: statsOpacity,
            transform: [{ translateY: statsY }],
          },
        ]}
      >
        {slide.stats.map((stat, i) => (
          <View
            key={i}
            style={[styles.statPill, { borderColor: slide.accentColor + '15' }]}
          >
            <Ionicons name={stat.icon as any} size={14} color={slide.accentColor} />
            <Text style={[styles.statLabel, { color: slide.accentColor }]}>{stat.label}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   MAIN ONBOARDING SCREEN
───────────────────────────────────────────── */
export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_W);
    if (index !== activeIndex) setActiveIndex(index);
  }, [activeIndex]);

  const next = () => {
    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.95, friction: 7, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();

    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * SCREEN_W, animated: true });
      setActiveIndex(activeIndex + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const skip = () => router.replace('/(auth)/login');

  const currentSlide = SLIDES[activeIndex];
  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background with overlapping opacity for transitions */}
      <View style={[styles.bgBase, { backgroundColor: currentSlide.bgFrom }]} />
      {SLIDES.map((slide, i) => (
        <Animated.View
          key={slide.id}
          style={[
            styles.bgLayer,
            { backgroundColor: slide.bgTo },
            {
              opacity: scrollX.interpolate({
                inputRange: [
                  (i - 1) * SCREEN_W,
                  i * SCREEN_W,
                  (i + 1) * SCREEN_W,
                ],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      ))}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: 60 }}
      >
        {SLIDES.map((slide, i) => (
          <OnboardingSlide
            key={slide.id}
            slide={slide}
            isActive={i === activeIndex}
            index={i}
          />
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W],
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: currentSlide.accentColor,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Skip */}
        {!isLast && (
          <TouchableOpacity onPress={skip} style={styles.skipBtn} activeOpacity={0.6}>
            <Text style={styles.skipText}>Skip introduction</Text>
          </TouchableOpacity>
        )}

        {/* CTA Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
          <TouchableOpacity
            onPress={next}
            activeOpacity={0.9}
            style={[styles.ctaButton, { backgroundColor: '#0F172A' }]}
          >
            <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>
              {isLast ? 'Get Started' : 'Continue'}
            </Text>
            <View style={styles.ctaIconWrapper}>
              <Ionicons
                name={isLast ? 'checkmark-circle' : 'arrow-forward'}
                size={20}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Sign-in link on last screen */}
        {isLast && (
          <TouchableOpacity onPress={skip} style={styles.signInLink}>
            <Text style={styles.signInText}>
              Already a member?{' '}
              <Text style={[styles.signInBold, { color: currentSlide.accentColor }]}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },

  // Icon
  iconArea: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  iconInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 70,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  // Text
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 48,
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 4,
  },

  // Stat pills
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Controls
  controls: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: 16,
    alignItems: 'center',
    gap: 14,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  ctaButton: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ctaIconWrapper: {
    marginLeft: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInLink: {
    paddingVertical: 6,
  },
  signInText: {
    color: '#64748B',
    fontSize: 14,
  },
  signInBold: {
    fontWeight: '800',
  },
});