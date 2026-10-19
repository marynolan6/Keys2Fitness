import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "@/theme";
import { LoginFields, validateLogin } from "@/validation/login";

export default function LoginScreen() {
  const [fields, setFields] = useState<LoginFields>({ email: "", password: "" });
  const [touched, setTouched] = useState<Record<keyof LoginFields, boolean>>({
    email: false,
    password: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const errors = validateLogin(fields);
  const visibleError = (field: keyof LoginFields) =>
    submitAttempted || touched[field] ? errors[field] : undefined;
  const emailError = visibleError("email");
  const passwordError = visibleError("password");
  const hasErrors = Object.keys(errors).length > 0;

  const updateField = (field: keyof LoginFields) => (value: string) =>
    setFields((current) => ({ ...current, [field]: value }));

  const markTouched = (field: keyof LoginFields) => () =>
    setTouched((current) => ({ ...current, [field]: true }));

  const handleSubmit = () => {
    setSubmitAttempted(true);
    // Stay on the login screen until every field passes validation.
    if (hasErrors) return;
    router.replace("/client/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Log in to continue</Text>

        {submitAttempted && hasErrors && (
          <View style={styles.formError} accessibilityRole="alert">
            <Text style={styles.formErrorText}>
              Please fix the highlighted fields to log in.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="next"
          value={fields.email}
          onChangeText={updateField("email")}
          onBlur={markTouched("email")}
          onSubmitEditing={() => passwordRef.current?.focus()}
          accessibilityLabel="Email"
          accessibilityHint={emailError}
        />
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}

        <Text style={styles.label}>Password</Text>
        <TextInput
          ref={passwordRef}
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Enter your password"
          placeholderTextColor="#999"
          secureTextEntry
          autoComplete="password"
          returnKeyType="go"
          value={fields.password}
          onChangeText={updateField("password")}
          onBlur={markTouched("password")}
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Password"
          accessibilityHint={passwordError}
        />
        {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

        <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fa",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#222",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#777",
    fontSize: 16,
    marginBottom: 32,
  },
  label: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 16,
    marginTop: -14,
  },
  formError: {
    backgroundColor: "#fbeaea",
    borderColor: colors.danger,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    padding: 12,
  },
  formErrorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 10,
    marginTop: 8,
    paddingVertical: 15,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});