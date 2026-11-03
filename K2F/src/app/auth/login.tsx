// Login screen for Keys2Fitness app
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRef, useState, type ComponentRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DoorOpeningIntro from "../../components/DoorOpeningIntro";
import { colors } from "@/theme";
import { auth, db } from "@/lib/firebase";
import type { LoginFields } from "@/validation/login";
import { validateLogin } from "@/validation/login";

export default function LoginScreen() {
  const [fields, setFields] = useState<LoginFields>({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState<
    Record<keyof LoginFields, boolean>
  >({
    email: false,
    password: false,
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Controls the opening door animation
  const [showIntro, setShowIntro] = useState(true);

  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const errors = validateLogin(fields);

  const visibleError = (field: keyof LoginFields) =>
    submitAttempted || touched[field]
      ? errors[field]
      : undefined;

  const emailError = visibleError("email");
  const passwordError = visibleError("password");
  const hasErrors = Object.keys(errors).length > 0;

  const updateField =
    (field: keyof LoginFields) => (value: string) =>
      setFields((current) => ({
        ...current,
        [field]: value,
      }));

  const markTouched = (field: keyof LoginFields) => () =>
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

  // Firebase login
  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setAuthError("");

    if (hasErrors || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const credential = await signInWithEmailAndPassword(
        auth,
        fields.email.trim(),
        fields.password
      );

      const userId = credential.user.uid;

      const profileSnapshot = await getDoc(
        doc(db, "users", userId)
      );

      const role = profileSnapshot.data()?.role;

      console.log("Logged-in Firebase user:", userId);
      console.log("User role:", role);

      // Navigate based on user role
      if (role === "coach") {
        router.replace("/coach");
      } else {
        router.replace("/client/home");
      }
    } catch (loginError: unknown) {
      if (
        loginError &&
        typeof loginError === "object" &&
        "code" in loginError
      ) {
        const code = String(loginError.code);

        if (
          code === "auth/invalid-credential" ||
          code === "auth/user-not-found" ||
          code === "auth/wrong-password"
        ) {
          setAuthError("The email or password is incorrect.");
        } else if (code === "auth/too-many-requests") {
          setAuthError("Too many attempts. Please try again later.");
        } else {
          setAuthError("Unable to log in. Please try again.");
        }
      } else {
        setAuthError("Unable to log in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = () => {
    router.push("/auth/signup");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Log in to continue
            </Text>

            {/* Form validation error */}
            {submitAttempted && hasErrors && (
              <View
                style={styles.formError}
                accessibilityRole="alert"
              >
                <Text style={styles.formErrorText}>
                  Please fix the highlighted fields to log in.
                </Text>
              </View>
            )}

            {/* Firebase authentication error */}
            {authError ? (
              <View
                style={styles.formError}
                accessibilityRole="alert"
              >
                <Text style={styles.formErrorText}>
                  {authError}
                </Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={styles.label}>Email</Text>

            <TextInput
              style={[
                styles.input,
                emailError && styles.inputError,
              ]}
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
              onSubmitEditing={() =>
                passwordRef.current?.focus()
              }
              accessibilityLabel="Email"
              accessibilityHint={emailError}
            />

            {emailError && (
              <Text style={styles.errorText}>
                {emailError}
              </Text>
            )}

            {/* Password */}
            <Text style={styles.label}>Password</Text>

            <TextInput
              ref={passwordRef}
              style={[
                styles.input,
                passwordError && styles.inputError,
              ]}
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

            {passwordError && (
              <Text style={styles.errorText}>
                {passwordError}
              </Text>
            )}

            {/* Login button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || showIntro}
            >
              <Text style={styles.loginButtonText}>
                {isSubmitting ? "Logging in..." : "Log In"}
              </Text>
            </TouchableOpacity>

            {/* Signup */}
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signupText}>
                Don't have an account? Sign up here
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Door opening animation above login screen */}
      {showIntro && (
        <View style={StyleSheet.absoluteFill}>
          <DoorOpeningIntro
            onComplete={() => setShowIntro(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fa",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  disabledButton: {
    opacity: 0.6,
  },
  signupText: {
    color: "#2563eb",
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
  },
});