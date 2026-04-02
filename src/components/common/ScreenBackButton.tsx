import { Pressable, StyleSheet } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  /** When `router.canGoBack()` is false (e.g. after `replace`), navigate here instead of calling `back()`. */
  fallbackHref?: Href;
};

/** Shared back control — use with Stack so iOS edge swipe + this stay aligned. */
export function ScreenBackButton({ fallbackHref }: Props) {
  const router = useRouter();
  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (fallbackHref != null) {
      router.replace(fallbackHref);
    }
  };
  return (
    <Pressable
      onPress={onPress}
      style={styles.backBtn}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={22} color="#111" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
});
