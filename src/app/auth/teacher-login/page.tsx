"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TeacherLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/login?next=/teacher");
  }, [router]);
  return null;
}
