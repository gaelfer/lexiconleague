import { Suspense } from "react";
import TeacherPortalLoader from "@/components/TeacherPortalLoader";
import TeacherPortalHomeInner from "../TeacherPortalHomeInner";

/** Teacher dashboard — requires teacher_mode cookie. Landing page is always at /teacher. */
export default function TeacherHubPage() {
  return (
    <Suspense fallback={<TeacherPortalLoader />}>
      <TeacherPortalHomeInner teacherMode={true} />
    </Suspense>
  );
}
