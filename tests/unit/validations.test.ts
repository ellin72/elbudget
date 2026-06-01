import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  transactionSchema,
} from "@/lib/validations";

describe("validation schemas", () => {
  it("requires strong registration passwords", () => {
    const parsed = registerSchema.safeParse({
      name: "User One",
      email: "user@example.com",
      password: "weakpass",
      confirmPassword: "weakpass",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts login with optional 2FA code", () => {
    const parsed = loginSchema.safeParse({
      email: "user@example.com",
      password: "Password1",
      twoFactorCode: "123456",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates password reset payload", () => {
    const parsed = resetPasswordSchema.safeParse({
      token: "abc",
      password: "Password1",
      confirmPassword: "Password1",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects negative transaction amounts", () => {
    const parsed = transactionSchema.safeParse({
      type: "EXPENSE",
      amount: -1,
      description: "Bad",
      date: "2026-01-01",
    });

    expect(parsed.success).toBe(false);
  });
});
