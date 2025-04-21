"use client"

import { useState, useEffect } from "react"
import { 
  Activity, FileText, CircleUser, Settings, 
  Calendar, Bell, Layers, MessageSquare, 
  Clock, CheckCircle, AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { useAuth } from "@/src/context/AuthContext"
import { Badge } from "@/src/components/ui/badge"
import { Skeleton } from "@/src/components/ui/skeleton"

/**
 * User Dashboard page
 * A simpler dashboard view for regular users and admins
 */
export default function UserDashboard() {
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  
  // Sample data for charts - replace with real data in production
  const activityData = [
    { name: 'Mon', value: 5 },
    { name: 'Tue', value: 8 },
    { name: 'Wed', value: 12 },
    { name: 'Thu', value: 7 },
    { name: 'Fri', value: 10 },
    { name: 'Sat', value: 4 },
    { name: 'Sun', value: 3 },
  ]

  const taskStatusData = [
    { name: 'Completed', value: 12 },
    { name: 'In Progress', value: 5 },
    { name: 'Pending', value: 3 },
  ]
  
  const COLORS = ['#10b981', '#f59e0b', '#ef4444']
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || 'User'} | Role: {user?.role || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array(4).fill(0).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
              <div className="h-10">
                <Skeleton className="h-full w-full" />
              </div>
            </Card>
          ))
        ) : (
          <>
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
                <div className="rounded-full bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/40">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">2 upcoming deadlines</p>
              </CardContent>
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTasks)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <div className="rounded-full bg-purple-100 p-1.5 text-purple-600 dark:bg-purple-900/40">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">1 unread message</p>
              </CardContent>
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorMessages)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <div className="rounded-full bg-green-100 p-1.5 text-green-600 dark:bg-green-900/40">
                  <Layers className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-muted-foreground">2 active projects</p>
              </CardContent>
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorProjects)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activity</CardTitle>
                <div className="rounded-full bg-amber-100 p-1.5 text-amber-600 dark:bg-amber-900/40">
                  <Activity className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">+5 from yesterday</p>
              </CardContent>
              <div className="h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorActivity)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        )}
      </div>
      
      {/* Main content sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-52 w-full rounded-md" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Your latest assigned tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/40">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Website Content Update</p>
                    <p className="text-xs text-muted-foreground">Due in 2 days</p>
                  </div>
                  <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                    In Progress
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/40">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Client Communication</p>
                    <p className="text-xs text-muted-foreground">Completed yesterday</p>
                  </div>
                  <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    Completed
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/40">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">SEO Optimization</p>
                    <p className="text-xs text-muted-foreground">Due next week</p>
                  </div>
                  <Badge variant="outline" className="ml-auto bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800">
                    Pending
                  </Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">
                  View All Tasks
                </Button>
              </CardFooter>
            </Card>
            
            {/* Task Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
                <CardDescription>Your current task distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <span className="mr-1 h-3 w-3 rounded-full bg-green-500"></span>
                  Completed
                </div>
                <div className="flex items-center">
                  <span className="mr-1 h-3 w-3 rounded-full bg-amber-500"></span>
                  In Progress
                </div>
                <div className="flex items-center">
                  <span className="mr-1 h-3 w-3 rounded-full bg-red-500"></span>
                  Pending
                </div>
              </CardFooter>
            </Card>
            
            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Tasks due soon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Content Update</span>
                  </div>
                  <Badge variant="outline">Tomorrow</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Client Presentation</span>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                    Today
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Analytics Report</span>
                  </div>
                  <Badge variant="outline">3 days</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Marketing Campaign</span>
                  </div>
                  <Badge variant="outline">Next week</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">
                  View Calendar
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
      
      {/* Recent Activity */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-4 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Task Completed</p>
                  <p className="text-xs text-muted-foreground">You completed the "Client Meeting Notes" task</p>
                  <p className="text-xs text-muted-foreground mt-1">Today at 10:30 AM</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-0.5">
                  <CircleUser className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">New Assignment</p>
                  <p className="text-xs text-muted-foreground">John assigned you to the "Website Redesign" project</p>
                  <p className="text-xs text-muted-foreground mt-1">Yesterday at 2:15 PM</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-0.5">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Comment Added</p>
                  <p className="text-xs text-muted-foreground">Sarah commented on your task "Content Strategy"</p>
                  <p className="text-xs text-muted-foreground mt-1">Yesterday at 11:30 AM</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-0.5">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Deadline Approaching</p>
                  <p className="text-xs text-muted-foreground">Your task "SEO Analysis" is due tomorrow</p>
                  <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Activity</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}