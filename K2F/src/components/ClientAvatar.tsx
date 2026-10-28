import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme";

type ClientAvatarProps = {
  name: string;
  imageUrl?: string;
  size?: number;
};

export function ClientAvatar({
  name,
  imageUrl,
  size = 48,
}: ClientAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.avatar,
          {
            height: size,
            width: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.fallback,
        {
          height: size,
          width: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    overflow: "hidden",
  },
  fallback: {
    alignItems: "center",
    backgroundColor: colors.primary,
    justifyContent: "center",
  },
  initial: {
    color: colors.surface,
    fontWeight: "700",
  },
});