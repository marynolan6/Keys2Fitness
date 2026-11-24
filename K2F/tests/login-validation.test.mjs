import assert from "node:assert/strict";
import test from "node:test";
import { validateEmail, validatePassword, validateLogin, MIN_PASSWORD_LENGTH } from "../src/validation/login.ts";

// Login validation rules. Pure functions, safe to run in Node.

test("email is required", () => {
  assert.equal(validateEmail(""), "Email is required.");
  assert.equal(validateEmail("   "), "Email is required.");
});

test("invalid email formats are rejected", () => {
  assert.equal(validateEmail("no-at-sign"), "Enter a valid email address.");
  assert.equal(validateEmail("@domain.com"), "Enter a valid email address.");
  assert.equal(validateEmail("user@"), "Enter a valid email address.");
  assert.equal(validateEmail("user.domain.com"), "Enter a valid email address.");
  assert.equal(validateEmail("user@domain"), "Enter a valid email address.");
});

test("valid emails pass", () => {
  assert.equal(validateEmail("user@example.com"), undefined);
  assert.equal(validateEmail("  User.Name+tag@Example.Co  "), undefined);
});

test("password is required", () => {
  assert.equal(validatePassword(""), "Password is required.");
});

test("passwords shorter than the minimum are rejected", () => {
  const short = "a".repeat(MIN_PASSWORD_LENGTH - 1);
  assert.equal(validatePassword(short), `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
});

test("passwords meeting the minimum pass", () => {
  const ok = "a".repeat(MIN_PASSWORD_LENGTH);
  assert.equal(validatePassword(ok), undefined);
  assert.equal(validatePassword("Str0ng!Pass"), undefined);
});

test("validateLogin returns errors for both fields", () => {
  const errors = validateLogin({ email: "", password: "short" });
  assert.equal(errors.email, "Email is required.");
  assert.equal(errors.password, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
});

test("validateLogin returns no errors when both fields are valid", () => {
  assert.deepEqual(validateLogin({ email: "a@b.com", password: "goodpass1" }), {});
});
