import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ProfileForm from "@/components/profile/ProfileForm";
import DashboardLayout from "@/components/layout/DashboardLayout"; 

export const metadata = {
  title: "My Profile | Task Manager",
};

export default async function ProfilePage() {
  const session = await getSession();

  // Protect the route
  if (!session || !session.id) {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      {/* We use a wrapper div here to give the page some breathing room.
        The ProfileForm itself handles its own dynamic background and borders
        based on the time theme!
      */}
      <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <ProfileForm user={session} />
      </div>
    </DashboardLayout>
  );
}