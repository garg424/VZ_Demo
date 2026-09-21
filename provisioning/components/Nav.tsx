"use client";

import { useRouter } from "next/navigation";
import { clearUser, getUser } from "@/lib/session";
import { useEffect, useState } from "react";

const APP_NAME = "Provisioning";
const APP_TAG = "Circuit OSS";

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "•"
  );
}

export default function Nav() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const u = getUser();
    setName(u?.full_name ?? "");
    setRole(u?.role ?? "");
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold lowercase tracking-tight text-vz-red">
            verizon
          </span>
          <span className="h-5 w-px bg-slate-200" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">{APP_NAME}</div>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
              {APP_TAG}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 sm:inline">
            Demo
          </span>
          {name && (
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-vz-red text-xs font-bold text-white">
                {initials(name)}
              </span>
              <div className="hidden leading-tight sm:block">
                <div data-testid="current-user" className="text-sm font-medium text-slate-900">
                  {name}
                </div>
                <div className="text-[11px] capitalize text-slate-400">{role}</div>
              </div>
            </div>
          )}
          <button
            data-testid="signout-btn"
            onClick={() => {
              clearUser();
              router.push("/login");
            }}
            className="btn btn-secondary btn-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
