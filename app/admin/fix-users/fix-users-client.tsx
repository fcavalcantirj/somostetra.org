"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

type BrokenUser = {
  id: string
  email: string
  created_at: string
  user_type: string
  referred_by?: string
  display_name: string
}

type FixResult = {
  email: string
  success: boolean
  error?: string
  message?: string
}

export function FixUsersClient({
  initialUsers,
  fixUserAction,
  fixAllAction,
}: {
  initialUsers: BrokenUser[]
  fixUserAction: (userData: BrokenUser) => Promise<{ success: boolean; error?: string; message?: string }>
  fixAllAction: () => Promise<FixResult[]>
}) {
  const [users, setUsers] = useState(initialUsers)
  const [fixing, setFixing] = useState<string | null>(null)
  const [fixingAll, setFixingAll] = useState(false)
  const [results, setResults] = useState<FixResult[]>([])
  const { toast } = useToast()

  const handleFixUser = async (user: BrokenUser) => {
    setFixing(user.id)
    setResults([])

    try {
      const result = await fixUserAction(user)

      if (result.success) {
        toast({
          title: "User Fixed",
          description: result.message || `Successfully fixed ${user.email}`,
        })
        // Remove from list
        setUsers(users.filter((u) => u.id !== user.id))
      } else {
        toast({
          title: "Fix Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Fix Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setFixing(null)
    }
  }

  const handleFixAll = async () => {
    setFixingAll(true)
    setResults([])

    try {
      const fixResults = await fixAllAction()
      setResults(fixResults)

      const successCount = fixResults.filter((r) => r.success).length
      const failCount = fixResults.filter((r) => !r.success).length

      if (successCount > 0) {
        toast({
          title: "Batch Fix Complete",
          description: `Fixed ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ""}`,
        })
        // Remove successful fixes from list
        const successEmails = fixResults.filter((r) => r.success).map((r) => r.email)
        setUsers(users.filter((u) => !successEmails.includes(u.email)))
      } else {
        toast({
          title: "Batch Fix Failed",
          description: "All fixes failed. Check the results below.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Batch Fix Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setFixingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Broken Accounts Found</h2>
            <p className="text-muted-foreground">{users.length} users need fixing</p>
          </div>
          <Button onClick={handleFixAll} size="lg" disabled={users.length === 0 || fixingAll}>
            {fixingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fix All {users.length} Users
          </Button>
        </div>

        {users.length > 0 && (
          <div className="space-y-2 mt-6">
            <h3 className="font-medium mb-3">Users to be fixed:</h3>
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Type: {user.user_type} • Created: {new Date(user.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleFixUser(user)}
                  variant="outline"
                  size="sm"
                  disabled={fixing === user.id || fixingAll}
                >
                  {fixing === user.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Fix This User
                </Button>
              </div>
            ))}
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">All users have profiles. No broken accounts found.</p>
          </div>
        )}
      </Card>

      {results.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Fix Results</h3>
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.success ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{result.email}</p>
                  {result.error && <p className="text-sm text-muted-foreground">{result.error}</p>}
                  {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
