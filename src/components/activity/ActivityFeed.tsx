"use client";

interface Activity {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  actor: string;
  icon: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return <p className="text-xs text-text-muted">No recent activity.</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((a) => {
        const diff = Date.now() - new Date(a.timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        const timeStr = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;

        return (
          <div key={a.id} className="flex items-start gap-3">
            <span className="text-text-muted text-sm mt-0.5">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">
                <span className="font-medium">{a.actor}</span>{" "}
                {a.action}{" "}
                <span className="text-primary font-medium">{a.target}</span>
              </p>
              <p className="text-xs text-text-muted mt-0.5">{timeStr}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
