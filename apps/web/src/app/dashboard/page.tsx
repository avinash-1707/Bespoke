import { PageHeader } from "@/components/shared/page-header";
import { StatCards } from "@/components/home/stat-cards";
import { RecentSection } from "@/components/home/recent-section";

export default function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Home"
        subtitle="Your outreach at a glance."
      />
      <StatCards />
      <RecentSection />
    </div>
  );
}
