"use client"

import { useState, useEffect } from "react"
import { Activity, CreditCard, DollarSign, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { CardLoader, ContentLoader } from "@/src/components/ui/loader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

/**
 * Dashboard overview page
 * Shows key metrics and data visualizations
 */
export default function DashboardPage() {
  const [loading, setLoading] = useState(false)

  

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Welcome back, Admin</span>
        </div>
      </div>

      {/* Dashboard tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$45,231.89</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                  </CardContent>
                </Card>

                {/* Subscriptions card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+2,350</div>
                    <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                  </CardContent>
                </Card>

                {/* Sales card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+12,234</div>
                    <p className="text-xs text-muted-foreground">+19% from last month</p>
                  </CardContent>
                </Card>

                {/* Active users card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-muted-foreground">+201 since last hour</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Charts section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {loading ? (
              <>
                <div className="col-span-4">
                  <CardLoader />
                </div>
                <div className="col-span-3">
                  <CardLoader />
                </div>
              </>
            ) : (
              <>
                {/* Overview chart */}
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>Your performance over the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="h-full w-full rounded-md bg-muted"></div>
                  </CardContent>
                </Card>

                {/* Recent sales chart */}
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>You made 265 sales this month</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <div className="h-full w-full rounded-md bg-muted"></div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Other tab contents */}
        <TabsContent value="analytics">
          {loading ? <ContentLoader /> : <div className="h-[400px] rounded-md bg-muted"></div>}
        </TabsContent>
        <TabsContent value="reports">
          {loading ? <ContentLoader /> : <div className="h-[400px] rounded-md bg-muted"></div>}
        </TabsContent>
        <TabsContent value="settings">
          {loading ? <ContentLoader /> : <div className="h-[400px] rounded-md bg-muted"></div>}
        </TabsContent>
      </Tabs>
    </div>
  )
}
