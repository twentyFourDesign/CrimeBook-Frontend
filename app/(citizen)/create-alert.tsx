import { Redirect } from "expo-router";

/** Legacy route: middle tab opens the multi-step report flow. */
export default function CreateAlertRedirect() {
  return <Redirect href="/(citizen)/report-step1" />;
}
