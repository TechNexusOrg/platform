import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = {
  title: "Contributor Onboarding — TechNexusOrg",
};

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/api/auth/github");
  }

  const user = await verifySessionToken(token);
  if (!user) {
    redirect("/api/auth/github");
  }

  if (user.isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <OnboardingForm user={user} />
    </div>
  );
}
