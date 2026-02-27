"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Lazy initializer reads localStorage synchronously on first render,
  // so authenticated users never see the loading spinner flash.
  const [ready, setReady] = useState(() => isAuthenticated());

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "#209dd7", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
