"use client";

import { useTheme } from "@/context/ThemeContext";
import TeacherLandingPage from "./TeacherLandingPage";

export default function TeacherLandingWrapper({ teacherMode }: { teacherMode: boolean }) {
  const { light } = useTheme();
  return <TeacherLandingPage light={light} teacherMode={teacherMode} />;
}
