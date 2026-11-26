import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRef, useState, type ComponentRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthFormScreen, authFormStyles as styles } from "@/components/AuthFormScreen";
import { PageTitle } from "@/components/K2FBrand";

import { WelcomeAnimation } from "@/components/DoorOpeningIntro";
import { ActionButton } from "@/components/ActionButton";
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

      const profile = await getDoc(doc(db, "users", credential.user.uid));
      router.replace(profile.data()?.role === "coach" ? "/coach" : "/client/home");
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
    <AuthFormScreen>
      <PageTitle style={styles.title}>Log in</PageTitle>
      <Text style={styles.subtitle}>Use your Keys2Fitness email and password.</Text>

      {submitAttempted && hasErrors && <View style={styles.formError} accessibilityRole="alert">
        <Text style={styles.formErrorText}>Please fix the highlighted fields to log in.</Text>
      </View>}
      {authError ? <View style={styles.formError} accessibilityRole="alert">
        <Text style={styles.formErrorText}>{authError}</Text>
      </View> : null}

      <Text style={styles.label}>Email</Text>
      <TextInput style={[styles.input, emailError && styles.inputError]} placeholder="Enter your email"
        placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none"
        autoCorrect={false} autoComplete="email" returnKeyType="next"
        value={fields.email} onChangeText={updateField("email")} onBlur={markTouched("email")}
        onSubmitEditing={() => passwordRef.current?.focus()} accessibilityLabel="Email" accessibilityHint={emailError} />
      {emailError && <Text style={styles.errorText}>{emailError}</Text>}

      <Text style={styles.label}>Password</Text>
      <TextInput ref={passwordRef} style={[styles.input, passwordError && styles.inputError]} placeholder="Enter your password"
        placeholderTextColor={colors.textMuted} secureTextEntry autoComplete="password" returnKeyType="go"
        value={fields.password} onChangeText={updateField("password")} onBlur={markTouched("password")}
        onSubmitEditing={handleSubmit} accessibilityLabel="Password" accessibilityHint={passwordError} />
      {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

      <ActionButton label={isSubmitting ? "Logging in..." : "Log In"} onPress={handleSubmit} disabled={isSubmitting} />
      <TouchableOpacity accessibilityRole="button" onPress={handleSignUp} style={styles.link}>
        <Text style={styles.linkText}>Don&apos;t have an account? Sign up here</Text>
      </TouchableOpacity>
      <WelcomeAnimation />
    </AuthFormScreen>
  );
}
