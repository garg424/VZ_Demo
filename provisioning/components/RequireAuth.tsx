"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/session";

// Client-side guard: pages redirect to /login when no demo_user is present.
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getUser()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready)
    return (
      <div
        data-testid="loading"
        className="grid min-h-screen place-items-center text-sm font-medium text-slate-400"
      >
        Loading…
      </div>
    );
  return <>{children}</>;
}
