"use client";

import { AuthProvider, useAuth } from "@/lib/supabase/auth";
import type { ReactNode } from "react";

function AuthErrorBanner() {
  const { error } = useAuth();
  if (!error) return null;
  return (
    <div className="z-50 bg-red-900/90 px-4 py-3 text-center text-sm text-red-100">
      {error}
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthErrorBanner />
      {children}
    </AuthProvider>
  );
}
