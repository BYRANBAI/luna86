"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  useEffect(() => {
    const destination = new URLSearchParams(window.location.search).get("redirect") || "/menu?tab=profile";
    router.replace(destination.startsWith("/menu") ? destination : "/menu?tab=profile");
  }, [router]);
  return null;
}
