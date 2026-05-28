"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, router]);

  return null;
}
