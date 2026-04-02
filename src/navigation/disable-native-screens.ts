import { enableScreens } from "react-native-screens";

/**
 * Workaround for RN New Architecture / Fabric:
 * `Exception in HostFunction: expected dynamic type 'boolean', but had type 'string'`
 * when mounting expo-router Stack / native screens.
 * Forces JS fallbacks instead of native screen views (slightly less optimal; stable).
 */
enableScreens(false);
