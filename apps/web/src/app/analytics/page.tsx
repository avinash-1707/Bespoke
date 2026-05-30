"use client";

import { useDashboard } from "@/lib/hooks/use-analytics";

// Functional only — totals, breakdowns, top-rated, and a simple volume bar list.
export default function AnalyticsPage() {
  const dashboard = useDashboard();

  if (dashboard.isLoading) return <p>Loading…</p>;
  if (dashboard.isError) return <p role="alert">{dashboard.error.message}</p>;
  if (!dashboard.data) return null;

  const d = dashboard.data;
  const maxVolume = Math.max(1, ...d.volumeByDay.map((v) => v.count));

  return (
    <main>
      <h1>Analytics</h1>

      <section>
        <h2>Totals</h2>
        <ul>
          <li>Messages generated (all time): {d.totalMessages}</li>
          <li>Messages generated (last 30 days): {d.messagesLast30Days}</li>
          <li>Prospects saved: {d.prospectsCount}</li>
          <li>Conversations with a reply: {d.conversationsWithReplies}</li>
        </ul>
      </section>

      <section>
        <h2>Offering usage</h2>
        <ul>
          {d.offeringUsage.map((o) => (
            <li key={o.offeringId}>
              {o.name}: {o.count}
            </li>
          ))}
        </ul>
        {d.offeringUsage.length === 0 ? <p>No usage yet.</p> : null}
      </section>

      <section>
        <h2>Top-rated messages</h2>
        <ol>
          {d.topRatedMessages.map((m) => (
            <li key={m.messageId}>
              <strong>{m.rating}★</strong> <span>{m.content.slice(0, 120)}</span>
            </li>
          ))}
        </ol>
        {d.topRatedMessages.length === 0 ? <p>No rated messages yet.</p> : null}
      </section>

      <section>
        <h2>Generation volume (last 14 days)</h2>
        <ul>
          {d.volumeByDay.map((v) => (
            <li key={v.date}>
              {v.date}{" "}
              <span aria-hidden>
                {"█".repeat(Math.round((v.count / maxVolume) * 20))}
              </span>{" "}
              {v.count}
            </li>
          ))}
        </ul>
        {d.volumeByDay.length === 0 ? <p>No generations yet.</p> : null}
      </section>
    </main>
  );
}
