"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Provider } from "@supabase/supabase-js";

// ── Email/Password ────────────────────────────────────────────────────────────
export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/** Sign in with username or email. Resolves username to email via profiles table. */
export async function signInWithUsernameOrEmail(usernameOrEmail: string, password: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const trimmed = usernameOrEmail.trim();
  if (!trimmed || !password) return { error: "Username or email and password are required." };

  let email: string;

  if (trimmed.includes("@")) {
    email = trimmed;
  } else {
    // Exact case-insensitive match; escape LIKE wildcards
    const escaped = trimmed.replace(/[\\%_]/g, (c) => "\\" + c);
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .ilike("username", escaped)
      .limit(1)
      .maybeSingle();

    if (!profile?.email) {
      return { error: "Username or email not found." };
    }
    email = profile.email;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return {};
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email to confirm your account!" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
export async function signInWithOAuth(provider: Provider) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}
