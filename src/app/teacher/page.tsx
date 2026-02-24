import { cookies } from "next/headers";
import { Suspense } from "react";
import TeacherPortalLoader from "@/components/TeacherPortalLoader";
import TeacherPortalHomeInner from "./TeacherPortalHomeInner";

export default async function TeacherPortalHomePage() {
  const cookieStore = await cookies();
  const teacherMode = cookieStore.get("teacher_mode")?.value === "1";

  return (
    <Suspense fallback={<TeacherPortalLoader />}>
      <TeacherPortalHomeInner teacherMode={teacherMode} />
    </Suspense>
  );
}
