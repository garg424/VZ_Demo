"use client";

import { useRouter } from "next/navigation";
import { clearUser, getUser } from "@/lib/session";
import { useEffect, useState } from "react";

export default function Nav() {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    setName(getUser()?.full_name ?? "");
  }, []);

  return (
    <header className="flex items-center justify-between border-b-4 border-vz-red bg-black px-6 py-3 text-white">
      <div className="flex items-center gap-3">
        <span className="text-xl font-extrabold tracking-tight text-vz-red">
          verizon
        </span>
        <span className="text-sm font-semibold uppercase tracking-wide text-gray-300">
          Provisioning
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        {name && <span data-testid="current-user">{name}</span>}
        <button
          data-testid="signout-btn"
          onClick={() => {
            clearUser();
            router.push("/login");
          }}
          className="rounded bg-white px-3 py-1 font-semibold text-black"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
