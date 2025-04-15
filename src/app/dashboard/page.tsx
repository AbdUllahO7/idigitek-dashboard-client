"use client"

import { useState, useEffect } from "react"
import { Activity, CreditCard, DollarSign, Users,  ArrowUpRight,  Calendar,  } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { CardLoader, ContentLoader } from "@/src/components/ui/loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

/**
 * Dashboard overview page
 * Shows key metrics and data visualizations
 */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Sample data for charts
  const revenueData = [
    { name: 'Jan', value: 34500 },
    { name: 'Feb', value: 28900 },
    { name: 'Mar', value: 32400 },
    { name: 'Apr', value: 39100 },
    { name: 'May', value: 42300 },
    { name: 'Jun', value: 38200 },
    { name: 'Jul', value: 41500 },
    { name: 'Aug', value: 38700 },
    { name: 'Sep', value: 42800 },
    { name: 'Oct', value: 45200 },
    { name: 'Nov', value: 37600 },
    { name: 'Dec', value: 45231 }
  ]
  
  const overviewData = [
    { name: '01/11', revenue: 4000, sales: 2400, users: 1800 },
    { name: '05/11', revenue: 3000, sales: 1398, users: 2800 },
    { name: '10/11', revenue: 2000, sales: 9800, users: 2290 },
    { name: '15/11', revenue: 2780, sales: 3908, users: 2000 },
    { name: '20/11', revenue: 1890, sales: 4800, users: 2181 },
    { name: '25/11', revenue: 2390, sales: 3800, users: 2500 },
    { name: '30/11', revenue: 3490, sales: 4300, users: 2100 },
  ]
  
  const salesData = [
    { name: 'Sarah Johnson', email: 'sarah@example.com', amount: '$250.00', status: 'success' },
    { name: 'Michael Brown', email: 'michael@example.com', amount: '$129.99', status: 'pending' },
    { name: 'Emily Davis', email: 'emily@example.com', amount: '$89.95', status: 'success' },
    { name: 'David Wilson', email: 'david@example.com', amount: '$199.00', status: 'success' },
    { name: 'Jessica Taylor', email: 'jessica@example.com', amount: '$149.99', status: 'pending' }
  ]
  
  const salesDistributionData = [
    { name: 'Desktop', value: 65 },
    { name: 'Mobile', value: 25 },
    { name: 'Tablet', value: 10 }
  ]
  
  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef']
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your business performance and analytics</p>
        </div>
      </div>

      {/* Dashboard tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
        </TabsList>

        {/* Overview tab content */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metric cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              <>
                <CardLoader />
                <CardLoader />
                <CardLoader />
                <CardLoader />
              </>
            ) : (
              <>
                {/* Revenue card */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <div className="rounded-full bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/40">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">$45,231.89</div>
                    <p className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      +20.1% from last month
                    </p>
                  </CardContent>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Subscriptions card */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                    <div className="rounded-full bg-purple-100 p-1.5 text-purple-600 dark:bg-purple-900/40">
                      <Users className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">+2,350</div>
                    <p className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      +180.1% from last month
                    </p>
                  </CardContent>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData.slice(-6)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Sales card */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                    <div className="rounded-full bg-green-100 p-1.5 text-green-600 dark:bg-green-900/40">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">+12,234</div>
                    <p className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      +19% from last month
                    </p>
                  </CardContent>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData.slice(-6)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Active users card */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                    <div className="rounded-full bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/40">
                      <Activity className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">+573</div>
                    <p className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      +201 since last hour
                    </p>
                  </CardContent>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        {value: 240}, {value: 300}, {value: 220}, {value: 380}, 
                        {value: 400}, {value: 450}, {value: 570}
                      ]} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Charts section */}
          <div className="grid gap-4 md:grid-cols-7">
            {loading ? (
              <>
                <div className="col-span-4">
                  <CardLoader  />
                </div>
                <div className="col-span-3">
                  <CardLoader  />
                </div>
              </>
            ) : (
              <>
                {/* Overview chart */}
                <Card className="col-span-7 md:col-span-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Performance Overview</CardTitle>
                        <CardDescription>Your business performance over the last 30 days</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Monthly</Button>
                        <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Weekly</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={overviewData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.2} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px' }} />
                          <Legend />
                          <defs>
                            <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue2)"
                          />
                          <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorSales)"
                          />
                          <Area
                            type="monotone"
                            dataKey="users"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorUsers)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Sales distribution */}
                <Card className="col-span-7 md:col-span-3">
                  <CardHeader>
                    <CardTitle>Sales Distribution</CardTitle>
                    <CardDescription>Sales channels breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={salesDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {salesDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      {salesDistributionData.map((item, index) => (
                        <div key={item.name} className="rounded-lg border border-border p-2">
                          <div className="flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                            <span className="ml-2 text-sm font-medium">{item.name}</span>
                          </div>
                          <p className="mt-1 text-lg font-semibold">{item.value}%</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          
          {/* Recent sales section */}
          {!loading && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>You made 265 sales this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          {sale.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{sale.name}</p>
                          <p className="text-xs text-muted-foreground">{sale.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium">{sale.amount}</div>
                        <div className={`flex items-center rounded-full px-2 py-1 text-xs ${
                          sale.status === 'success' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {sale.status === 'success' ? 'Completed' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            
            </Card>
          )}
        </TabsContent>

        {/* Other tab contents */}
        <TabsContent value="analytics">
          {loading ? <ContentLoader  /> : <div className="h-96 rounded-md border p-6">Analytics content here</div>}
        </TabsContent>
        <TabsContent value="reports">
          {loading ? <ContentLoader  /> : <div className="h-96 rounded-md border p-6">Reports content here</div>}
        </TabsContent>
        <TabsContent value="settings">
          {loading ? <ContentLoader  /> : <div className="h-96 rounded-md border p-6">Settings content here</div>}
        </TabsContent>
      </Tabs>
    </div>
  )
}