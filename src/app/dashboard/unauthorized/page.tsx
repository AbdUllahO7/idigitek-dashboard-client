"use client"

import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"

export default function UnauthorizedPage() {
    const router = useRouter()

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
            <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3 text-red-600">
                <AlertTriangle className="h-8 w-8" />
                </div>
            </div>
            <CardTitle className="text-xl font-bold">Access Denied</CardTitle>
            <CardDescription>
                You don't have permission to access this page.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <p className="text-center text-muted-foreground">
                This page requires specific permissions or an active section that isn't available 
                for your account. Please contact your administrator if you believe this is an error.
            </p>
            </CardContent>
        </Card>
        </div>
    )
}