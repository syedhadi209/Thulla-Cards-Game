import { createClient } from "@/lib/supabase/server";
import { apiError } from "./errors";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { user: null, response: apiError("UNAUTHENTICATED", "Sign in required", 401) };
  }
  return { user: data.user, response: null };
}
