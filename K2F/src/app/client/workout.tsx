import { Redirect } from "expo-router";

// Keep old links on the selected demo client's actual assignment list.
export default function WorkoutScreen() {
  return <Redirect href="/client/home" />;
}
