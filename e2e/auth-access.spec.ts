import { expect, test } from "@playwright/test";

const signInEmail = process.env.E2E_SIGNIN_EMAIL;
const signInPassword = process.env.E2E_SIGNIN_PASSWORD;
const signUpEmail = process.env.E2E_SIGNUP_EMAIL;
const signUpPassword = process.env.E2E_SIGNUP_PASSWORD;

test.describe("auth access", () => {
  test("sign in reaches the app shell", async ({ page }) => {
    test.skip(!signInEmail || !signInPassword, "Set E2E_SIGNIN_EMAIL and E2E_SIGNIN_PASSWORD.");

    await page.goto("/");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.getByPlaceholder(/email/i).fill(signInEmail!);
    await page.getByPlaceholder(/password/i).fill(signInPassword!);
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(/your private reflection space/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /journal/i })).toBeVisible();
  });

  test("sign up creates account access when signup creds are provided", async ({ page }) => {
    test.skip(!signUpEmail || !signUpPassword, "Set E2E_SIGNUP_EMAIL and E2E_SIGNUP_PASSWORD.");

    await page.goto("/");
    await page.getByRole("button", { name: /sign up/i }).click();
    await page.getByPlaceholder(/email/i).fill(signUpEmail!);
    await page.getByPlaceholder(/password/i).fill(signUpPassword!);
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText(/your private reflection space/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /journal/i })).toBeVisible();
  });
});
