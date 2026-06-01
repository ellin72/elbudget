import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import GlobalOverlays from "@/components/layout/GlobalOverlays";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.onboardingDone) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-[240px] transition-all duration-200">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="page-container">{children}</div>
        </main>
        <GlobalOverlays />
      </div>
    </div>
  );
}
