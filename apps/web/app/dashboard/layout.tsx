import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DemoBanner from "@/components/DemoBanner";
import TrialBanner from "@/components/TrialBanner";
import ChurnNudge from "@/components/ChurnNudge";
import ExpansionBanner from "@/components/ExpansionBanner";
import FeedbackWidget from "@/components/FeedbackWidget";
import SupportCopilot from "@/components/SupportCopilot";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import CrowWidget from "@/components/CrowWidget";
import SubscriptionGate from "@/components/SubscriptionGate";

const CROW_ENABLED = process.env.NEXT_PUBLIC_CROW_ENABLED === 'true';

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
        <MaintenanceBanner />
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-gray-50">
          <div className="mx-auto max-w-7xl w-full">
            <SubscriptionGate>{children}</SubscriptionGate>
          </div>
        </main>
      </div>
      <FeedbackWidget />
      <SupportCopilot />
      {CROW_ENABLED && <CrowWidget />}
    </div>
  );
}
