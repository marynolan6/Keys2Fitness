import { router } from "expo-router";
import { BrandedPage } from "@/components/BrandedPage";
import { BuilderButton } from "@/components/WorkoutBuilderControls";

export default function Preferences() {
  return <BrandedPage coach title="Preferences">
    <BuilderButton label="Back to coach profile" secondary onPress={() => router.navigate("/coach/profile")} />
  </BrandedPage>;
}
