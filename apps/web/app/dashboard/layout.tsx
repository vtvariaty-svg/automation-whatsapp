import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DemoBanner from "@/components/DemoBanner";
import TrialBanner from "@/components/TrialBanner";
import ChurnNudge from "@/components/ChurnNudge";
import ExpansionBanner from "@/components/ExpansionBanner";
import FeedbackWidget from "@/components/FeedbackWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full relative">
        <DemoBanner />
        <TrialBanner />
        <ChurnNudge />
        <ExpansionBanner />
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-gray-50">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
      <FeedbackWidget />
    </div>
  );
}
