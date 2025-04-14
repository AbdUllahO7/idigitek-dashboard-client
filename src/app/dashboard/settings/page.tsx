"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { ContentLoader } from "@/src/components/ui/loader"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Label } from "@/src/components/ui/label"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Switch } from "@/src/components/ui/switch"
import { Edit } from "lucide-react"
import { useRouter } from "next/navigation"

/**
 * Settings page component
 * Allows users to configure their account and application settings
 */
export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleNavigate = () => { 
    router.push("/websiteConfiguration")
  }


  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <Button onClick={handleNavigate} variant="outline">
          <Edit/>
            <span className="text-sm font-medium  ">Edit Sections</span>
        </Button>
      </div>

      {/* Settings tabs */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Account tab content */}
        <TabsContent value="account" className="space-y-6">
          {loading ? (
            <ContentLoader />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your account details and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input id="first-name" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input id="last-name" defaultValue="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" defaultValue="I'm a product manager with over 10 years of experience." />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save changes</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Notifications tab content */}
        <TabsContent value="notifications" className="space-y-6">
          {loading ? (
            <ContentLoader />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="text-sm font-normal text-muted-foreground">Receive notifications via email</span>
                  </Label>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                    <span>Push Notifications</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Receive notifications on your device
                    </span>
                  </Label>
                  <Switch id="push-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
                    <span>Marketing Emails</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Receive emails about new products and features
                    </span>
                  </Label>
                  <Switch id="marketing-emails" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save preferences</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Appearance tab content */}
        <TabsContent value="appearance" className="space-y-6">
          {loading ? (
            <ContentLoader />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                    <span>Dark Mode</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Toggle between light and dark mode
                    </span>
                  </Label>
                  <Switch
                    id="dark-mode"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="compact-view" className="flex flex-col space-y-1">
                    <span>Compact View</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Display more content with less spacing
                    </span>
                  </Label>
                  <Switch id="compact-view" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save settings</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* Security tab content */}
        <TabsContent value="security" className="space-y-6">
          {loading ? (
            <ContentLoader />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and authentication.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <div className="flex items-center justify-between space-x-2 pt-4">
                  <Label htmlFor="two-factor" className="flex flex-col space-y-1">
                    <span>Two-Factor Authentication</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Add an extra layer of security to your account
                    </span>
                  </Label>
                  <Switch id="two-factor" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Update password</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
