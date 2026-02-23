"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function TeacherSignupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/signup?next=/teacher");
  }, [router]);
  return null;
}
