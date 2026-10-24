import { createAuthClient } from "better-auth/react";
import { API_BASE } from "./api";

/** Browser client for the Better Auth handler hosted by the Express API. */
export const authClient = createAuthClient({
  baseURL: API_BASE,
  fetchOptions: {
    credentials: "include",
  },
});
