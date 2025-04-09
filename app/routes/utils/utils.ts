import { useMatches } from "@remix-run/react";
import { useMemo } from "react";

import type { User } from "~/routes/utils/auth.server";

const DEFAULT_REDIRECT = "/";

//Protect against open-redirect vulnerabilities from untrusted input.
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== "string") return defaultRedirect;
  if (!to.startsWith("/") || to.startsWith("//")) return defaultRedirect;
  return to;
}

// Use route matches to access loader data by route ID.
export function useMatchesData(
  id: string,
): Record<string, unknown> | undefined {
  const matches = useMatches();
  return useMemo(
    () => matches.find((route) => route.id === id)?.data as Record<string, unknown> | undefined,
    [matches, id],
  );
}

//Type guard to validate a basic User object.
function isUser(user: unknown): user is User {
  return (
    typeof user === "object" &&
    user !== null &&
    "email" in user &&
    typeof (user as User).email === "string"
  );
}

//Use optional user (e.g., in layout where auth isn't required).
export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root"); // assumes root loader returns user
  if (!data || !isUser(data.user)) return undefined;
  return data.user;
}

//Use required user (e.g., in protected routes).
export function useUser(): User {
  const user = useOptionalUser();
  if (!user) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, use useOptionalUser instead.",
    );
  }
  return user;
}

//Validate email format for client-side forms.
export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}
