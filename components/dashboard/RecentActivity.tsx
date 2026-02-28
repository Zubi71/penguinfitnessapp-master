import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, DollarSign, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type Activity = {
  type: 'attendance' | 'payment' | string;
  title: string;
  time: string | Date;
  amount?: number;
};

const ActivityItem = ({ activity }: { activity: Activity }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
    <div className={`p-2 rounded-full ${
      activity.type === 'attendance' ? 'bg-green-100' : 'bg-blue-100'
    }`}>
      {activity.type === 'attendance' ? 
        <CheckCircle className="w-4 h-4 text-green-600" /> :
        <DollarSign className="w-4 h-4 text-blue-600" />
      }
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900 truncate">{activity.title}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-slate-500">
          {format(new Date(activity.time), 'MMM d, h:mm a')}
        </span>
        {activity.amount && (
          <Badge variant="outline" className="text-xs">
            ${activity.amount}
          </Badge>
        )}
      </div>
    </div>
  </div>
);

type RecentActivityProps = {
  activities: Activity[];
  isLoading: boolean;
};

export default function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}