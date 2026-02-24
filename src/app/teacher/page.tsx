import { cookies } from "next/headers";
import TeacherLandingWrapper from "./TeacherLandingWrapper";

/** Teacher landing page — always shown when visiting /teacher. Portal dashboard is at /teacher/hub. */
export default async function TeacherPortalHomePage() {
  const cookieStore = await cookies();
  const teacherMode = cookieStore.get("teacher_mode")?.value === "1";

  return <TeacherLandingWrapper teacherMode={teacherMode} />;
}
