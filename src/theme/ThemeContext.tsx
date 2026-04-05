import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DARK, LIGHT, type ColorPalette } from "./colors";

const STORAGE_KEY = "@theme_mode";
const TRANSITION_MS = 300;

interface ThemeContextValue {
  isDark: boolean;
  colors: ColorPalette;
  toggle: () => void;
  /** 0 = light, 1 = dark — use for animated interpolations */
  animValue: Animated.Value;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: LIGHT,
  toggle: () => {},
  animValue: new Animated.Value(0),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  // Restore saved preference
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "dark") {
        setIsDark(true);
        animValue.setValue(1);
      }
    });
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      // Smooth animated transition
      Animated.timing(animValue, {
        toValue: next ? 1 : 0,
        duration: TRANSITION_MS,
        useNativeDriver: false, // Must be false for color interpolation
      }).start();
      AsyncStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }, [animValue]);

  const colors: ColorPalette = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggle, animValue }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Helper: interpolate a background color from light → dark using animValue */
export function useAnimatedBg(lightColor: string, darkColor: string) {
  const { animValue } = useTheme();
  return animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [lightColor, darkColor],
  });
}
