"use client"

import { useState, useEffect } from "react"
import { Activity, CreditCard, DollarSign, Users, ArrowUpRight, Languages, FileText, Globe, Layers } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { CardLoader, ContentLoader } from "@/src/components/ui/loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useSections } from "@/src/hooks/webConfiguration/use-section"
import { Section } from "@/src/api/types/sectionsTypes"
import { useLanguages } from "@/src/hooks/webConfiguration/use-language"
import { Language } from "@/src/api/types/languagesTypes"

/**
 * Dashboard overview page
 * Shows key metrics and data visualizations
 */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  
  // Get data from API hooks
  const { 
    useGetAll: useGetAllSections
  } = useSections();
  
  const { 
    useGetAll: useGetAllLanguages
  } = useLanguages();

  const { 
    data: sections, 
    isLoading: isLoadingSections,
    error: sectionsError
  } = useGetAllSections();

  const { 
    data: languages, 
    isLoading: isLoadingLanguages,
    error: languagesError
  } = useGetAllLanguages();

  // Extract active sections and languages from the API response
  const sectionsData = sections?.data || [];
  const languagesData = languages?.data || [];
  const activeSections = sectionsData.filter((section: Section) => section.isActive) || [];
  const activeLanguages = languagesData.filter((lang: Language) => lang.isActive) || [];
  
  // Create data for sections visualization
  const sectionChartData = [
    { name: 'Active', value: activeSections.length },
    { name: 'Inactive', value: sectionsData.length - activeSections.length }
  ];
  
  // Create data for languages visualization
  const languageChartData = [
    { name: 'Active', value: activeLanguages.length },
    { name: 'Inactive', value: languagesData.length - activeLanguages.length }
  ];
  
  // Colors for charts
  const COLORS = ['#10b981', '#6366f1', '#8b5cf6', '#3b82f6'];
  
  // Set loading state based on API data loading
  useEffect(() => {
    if (!isLoadingSections && !isLoadingLanguages) {
      setLoading(false);
    }
  }, [isLoadingSections, isLoadingLanguages]);

  // Generate monthly growth data based on sections and languages
  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, index) => {
      // Simple algorithm to generate fake growth data based on actual section and language counts
      const baseValue = (sectionsData.length * 1000) + (languagesData.length * 500);
      const growth = index <= currentMonth ? 
        baseValue * (1 + (index / 12)) : 
        baseValue * (1 + (currentMonth / 12));
        
      return {
        name: month,
        value: Math.round(growth)
      };
    });
  };
  
  const revenueData = generateMonthlyData();
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between space-y-2 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your website configuration and analytics</p>
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
                {/* Total Sections card */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
                    <div className="rounded-full bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/40">
                      <Layers className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">{sectionsData.length}</div>
                    <p className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      {Math.round((activeSections.length / Math.max(sectionsData.length, 1)) * 100)}% active
                    </p>
                  </CardContent>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sectionChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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

                {/* Active Sections card */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Sections</CardTitle>
                    <div className="rounded-full bg-purple-100 p-1.5 text-purple-600 dark:bg-purple-900/40">
                      <FileText className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">{activeSections.length}</div>
                    <p className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      {sectionsData.length - activeSections.length} inactive
                    </p>
                  </CardContent>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectionChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Total Languages card */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Languages</CardTitle>
                    <div className="rounded-full bg-green-100 p-1.5 text-green-600 dark:bg-green-900/40">
                      <Globe className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">{languagesData.length}</div>
                    <p className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      {Math.round((activeLanguages.length / Math.max(languagesData.length, 1)) * 100)}% active
                    </p>
                  </CardContent>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={languageChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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

                {/* Active Languages card */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Languages</CardTitle>
                    <div className="rounded-full bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/40">
                      <Activity className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-2xl font-bold">{activeLanguages.length}</div>
                    <p className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      {languagesData.length - activeLanguages.length} inactive
                    </p>
                  </CardContent>
                  <div className="h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={languageChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </>
            )}
          </div>
          
          {/* Charts section */}
          {!loading && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Section Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Section Distribution</CardTitle>
                  <CardDescription>Active vs. Inactive Sections</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectionChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {sectionChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-between w-full text-sm text-muted-foreground">
                    <div>Total Sections: {sectionsData.length}</div>
                    <div>Updated: {new Date().toLocaleDateString()}</div>
                  </div>
                </CardFooter>
              </Card>
              
              {/* Language Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Language Distribution</CardTitle>
                  <CardDescription>Active vs. Inactive Languages</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={languageChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {languageChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-between w-full text-sm text-muted-foreground">
                    <div>Total Languages: {languagesData.length}</div>
                    <div>Updated: {new Date().toLocaleDateString()}</div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}