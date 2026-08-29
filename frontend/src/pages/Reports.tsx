import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Flame, Moon, Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { getHealthDashboard, getNotifications, downloadPdfReport } from '@/api/healthApi';

export default function Reports() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [exerciseReminders, setExerciseReminders] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('weekly');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboard, notifications] = await Promise.all([
          getHealthDashboard(),
          getNotifications()
        ]);
        setDashboardData(dashboard);
        
        // Filter notifications of type 'workout' to act as exercise/activity log
        const workouts = (notifications || []).filter((n: any) => n.type === 'workout');
        setExerciseReminders(workouts);
      } catch (error) {
        console.error('Error fetching reports data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadPdfReport();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CuraPlus_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Format chart history data
  const chartHistory = (dashboardData?.chartHistory || []).map((day: any) => ({
    name: day.day,
    calories: day.caloriesConsumed || 0,
    burn: day.caloriesBurned || 0,
    sleep: day.sleepHours || 0
  }));

  // Create a default exercise log based on user's active workout reminders + some defaults
  const staticActivities = [
    { id: 'act_1', activity: 'Morning Jogging', duration: '40 min', hr: '135 bpm', cals: '380 kcal', status: 'Completed' },
    { id: 'act_2', activity: 'Stretching & Yoga', duration: '20 min', hr: '105 bpm', cals: '120 kcal', status: 'Completed' }
  ];

  const dynamicActivities = exerciseReminders.map((workout: any) => ({
    id: workout.id,
    activity: workout.title || 'Workout',
    duration: workout.notes?.includes('min') ? workout.notes : '45 min',
    hr: '120 bpm',
    cals: '300 kcal',
    status: workout.isActive ? 'Scheduled' : 'Completed'
  }));

  const exerciseLog = [...dynamicActivities, ...staticActivities];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Reports</h1>
          <p className="text-slate-500">Comprehensive overview of your health metrics.</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <Button 
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            variant="outline" 
            className="shrink-0 bg-white"
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            PDF Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Calorie Intake vs Burn</CardTitle>
                <CardDescription>Daily energy balance</CardDescription>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {chartHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="calories" name="Intake (kcal)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="burn" name="Burned (kcal)" fill="#0866D5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sleep Duration</CardTitle>
                <CardDescription>Hours of sleep per night</CardDescription>
              </div>
              <div className="bg-purple-50 p-2 rounded-lg">
                <Moon className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {chartHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>A log of your latest recorded exercises.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Avg HR</th>
                  <th className="px-4 py-3 font-medium">Calories</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {exerciseLog.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{log.activity}</td>
                    <td className="px-4 py-3 text-slate-600">{log.duration}</td>
                    <td className="px-4 py-3 text-slate-600">{log.hr}</td>
                    <td className="px-4 py-3 text-slate-600">{log.cals}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={log.status === 'Completed' ? 'success' : 'secondary'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
