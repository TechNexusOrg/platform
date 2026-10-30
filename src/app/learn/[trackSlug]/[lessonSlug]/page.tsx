import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { getLesson } from "@/lib/learning/service";
import { LessonViewer } from "./LessonViewer";

interface LessonPageProps {
  params: Promise<{
    trackSlug: string;
    lessonSlug: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: LessonPageProps) {
  const { trackSlug, lessonSlug } = await params;
  const lesson = await getLesson(trackSlug, lessonSlug);
  if (!lesson) return { title: "Lesson Not Found — TechNexusOrg" };

  return {
    title: `${lesson.title} — ${lesson.track.title} | TechNexusOrg`,
    description: `Learn ${lesson.title} in the ${lesson.track.title} learning track on TechNexusOrg.`,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { trackSlug, lessonSlug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  const lesson = await getLesson(trackSlug, lessonSlug, user?.id);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100">
      <main>
        <LessonViewer lesson={lesson} isLoggedIn={!!user} />
      </main>
    </div>
  );
}
