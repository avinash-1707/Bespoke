"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api-client";

export interface DashboardData {
  totalMessages: number;
  messagesLast30Days: number;
  prospectsCount: number;
  conversationsWithReplies: number;
  offeringUsage: { offeringId: string; name: string; count: number }[];
  topRatedMessages: { messageId: string; content: string; rating: number }[];
  volumeByDay: { date: string; count: number }[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => apiClient.get<DashboardData>("/api/analytics/dashboard"),
  });
}
