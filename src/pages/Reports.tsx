import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Flame, Moon } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const weeklyData = [
  { name: 'Mon', calories: 2100, burn: 1800, sleep: 7.2 },
  { name: 'Tue', calories: 1950, burn: 2200, sleep: 6.8 },
  { name: 'Wed', calories: 2200, burn: 1900, sleep: 7.5 },
  { name: 'Thu', calories: 2050, burn: 2100, sleep: 7.1 },
  { name: 'Fri', calories: 2400, burn: 2500, sleep: 6.5 },
  { name: 'Sat', calories: 2600, burn: 2800, sleep: 8.2 },
  { name: 'Sun', calories: 2300, burn: 2000, sleep: 8.0 },
];

const exerciseLog = [
  { id: 1, activity: 'Morning Run', duration: '45 min', hr: '142 bpm', cals: '420 kcal', status: 'Completed' },
  { id: 2, activity: 'Swimming', duration: '30 min', hr: '128 bpm', cals: '280 kcal', status: 'Completed' },
  { id: 3, activity: 'Strength Training', duration: '60 min', hr: '115 bpm', cals: '350 kcal', status: 'Scheduled' },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Reports</h1>
          <p className="text-slate-500">Comprehensive overview of your health metrics.</p>
        </div>
        <div className="flex items-center space-x-2">
          <select className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Yearly</option>
          </select>
          <Button variant="outline" className="shrink-0 bg-white">
            <Download className="mr-2 h-4 w-4" />
            PDF Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="calories" name="Intake" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="burn" name="Burned" fill="#0866D5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
