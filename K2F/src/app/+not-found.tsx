import { router } from "expo-router";
import { BrandedPage } from "@/components/BrandedPage";
import { BuilderButton } from "@/components/WorkoutBuilderControls";

export default function NotFoundScreen() {
  return <BrandedPage title="Page not found">
    <BuilderButton label="Go to Home" accessibilityLabel="Go to home screen" onPress={() => router.replace("/")} />
  </BrandedPage>;
}
