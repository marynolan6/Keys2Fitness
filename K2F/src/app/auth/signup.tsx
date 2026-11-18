import { router } from "expo-router";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { AuthFormScreen, authFormStyles as styles } from "@/components/AuthFormScreen";
import { colors } from "@/theme";

import { auth, db } from "@/lib/firebase";

export default function SignupScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setIsSubmitting(true);

      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      await setDoc(doc(db, "users", credential.user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role: "client",
        createdAt: serverTimestamp(),
      });

      // Signup is being tested separately from login for this sprint.
      await signOut(auth);
      setSuccess("Account created successfully. You can log in later.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      router.push("/auth/login");
    } catch (signupError: unknown) {
      if (
        signupError &&
        typeof signupError === "object" &&
        "code" in signupError
      ) {
        const code = String(signupError.code);

        if (code === "auth/email-already-in-use") {
          setError("An account already exists with this email.");
        } else if (code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else if (code === "auth/weak-password") {
          setError("Please choose a stronger password.");
        } else {
          setError("Unable to create the account. Please try again.");
        }
      } else {
        setError("Unable to create the account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormScreen>
      <Text accessibilityRole="header" style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>
      {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      <Text style={styles.label}>First name</Text>
      <TextInput accessibilityLabel="First name" style={styles.input} placeholder="Enter your first name"
        placeholderTextColor={colors.textMuted} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
      <Text style={styles.label}>Last name</Text>
      <TextInput accessibilityLabel="Last name" style={styles.input} placeholder="Enter your last name"
        placeholderTextColor={colors.textMuted} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
      <Text style={styles.label}>Email</Text>
      <TextInput accessibilityLabel="Email" style={styles.input} placeholder="Enter your email" placeholderTextColor={colors.textMuted}
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Text style={styles.label}>Password</Text>
      <TextInput accessibilityLabel="Password" style={styles.input} placeholder="Enter your password"
        placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
      <Text style={styles.label}>Confirm password</Text>
      <TextInput accessibilityLabel="Confirm password" style={styles.input} placeholder="Re-enter your password"
        placeholderTextColor={colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      <TouchableOpacity accessibilityRole="button" style={[styles.primary, isSubmitting && styles.disabled]}
        onPress={handleSubmit} disabled={isSubmitting}>
        <Text style={styles.primaryText}>{isSubmitting ? "Creating account..." : "Create account"}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.link}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </AuthFormScreen>
  );
}
