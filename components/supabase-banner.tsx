"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function SupabaseBanner() {
  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Supabase Not Connected</AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <span className="text-sm">Connect Supabase to enable authentication and data storage.</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-4 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20 bg-transparent"
        >
          Connect Supabase
        </Button>
      </AlertDescription>
    </Alert>
  )
}
