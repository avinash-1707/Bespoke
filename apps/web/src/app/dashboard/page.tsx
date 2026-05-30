import { PageHeader } from "@/components/shared/page-header";
import { StatCards } from "@/components/home/stat-cards";
import { GenerateMessage } from "@/components/home/generate-message";
import { RecentSection } from "@/components/home/recent-section";

export default function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Overview"
        title="Home"
        subtitle="Your outreach at a glance."
      />
      <StatCards />
      <GenerateMessage />
      <RecentSection />
    </div>
  );
}
