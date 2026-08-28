import { ArrowUpRight, Droplets, Flame, Moon, Activity, Pill } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const healthData = [
  { name: 'Mon', score: 78, weight: 71.5 },
  { name: 'Tue', score: 82, weight: 71.4 },
  { name: 'Wed', score: 80, weight: 71.4 },
  { name: 'Thu', score: 85, weight: 71.2 },
  { name: 'Fri', score: 84, weight: 71.2 },
  { name: 'Sat', score: 88, weight: 71.0 },
  { name: 'Sun', score: 85, weight: 71.2 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Good morning, John.</h1>
        <p className="text-slate-500">Here is your daily health summary.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-white border-transparent overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <Activity className="h-32 w-32 -mr-8 -mt-8" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="text-white/80 font-medium">Overall Health Score</CardDescription>
            <CardTitle className="text-4xl font-bold">85<span className="text-xl font-normal text-white/80">/100</span></CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center text-sm bg-white/20 w-fit px-2 py-1 rounded-full backdrop-blur-sm">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              +3 from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Weight & BMI</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">71.2 <span className="text-sm font-normal text-slate-500">kg</span></div>
            <div className="flex items-center mt-1">
              <span className="text-sm font-medium text-slate-600 mr-2">BMI: 22.4</span>
              <Badge variant="success">Normal</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Water & Calories</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-bold text-slate-900">1.8<span className="text-sm font-normal text-slate-500">/2.5L</span></div>
                <div className="flex items-center mt-1 text-xs text-blue-600 font-medium">
                  <Droplets className="h-3 w-3 mr-1" /> Water
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">1,450</div>
                <div className="flex items-center mt-1 text-xs text-orange-600 font-medium">
                  <Flame className="h-3 w-3 mr-1" /> kcal Burned
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Sleep & Activity</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Moon className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-bold text-slate-900">7h 12m</div>
                <div className="flex items-center mt-1 text-xs text-purple-600 font-medium">
                  <Moon className="h-3 w-3 mr-1" /> Sleep
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">45<span className="text-sm font-normal text-slate-500">m</span></div>
                <div className="flex items-center mt-1 text-xs text-green-600 font-medium">
                  <Activity className="h-3 w-3 mr-1" /> Exercise
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Weekly Health Trends</CardTitle>
              <CardDescription>Your health score progression over the last 7 days.</CardDescription>
            </div>
            <select className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Health Score</option>
              <option>Weight</option>
              <option>Sleep</option>
            </select>
          </CardHeader>
          <CardContent className="px-2 sm:p-6 sm:pt-0">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0866D5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0866D5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#0866D5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Based on your recent trends, your sleep consistency is improving. Consider maintaining your current bedtime routine to see further improvements in your daily energy levels.
              </p>
              <Button variant="outline" className="w-full bg-white text-primary border-primary/20 hover:bg-primary/5">
                View Full Analysis
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Today's Medication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white p-2 rounded-md shadow-sm border border-slate-100">
                      <Pill className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Vitamin D3</p>
                      <p className="text-xs text-slate-500">1000 IU • After breakfast</p>
                    </div>
                  </div>
                  <Badge variant="success">Taken</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-50 p-2 rounded-md border border-orange-100">
                      <Pill className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Omega 3</p>
                      <p className="text-xs text-slate-500">1 Capsule • After dinner</p>
                    </div>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
