'use client'

import { usePermissions } from '@/components/auth/RoleGuard'
import { AdminOnly, TrainerOnly, StaffOnly } from '@/components/auth/AdminOnlyGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * Example component showing role-based access control in action
 * This demonstrates different content and actions based on user roles
 */
export default function RoleBasedExample() {
  const { user, isAdmin, isTrainer, isClient, isStaff } = usePermissions()

  if (!user) {
    return <div>Please log in to view this content.</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Role-Based Access Demo</h1>
        <Badge variant="outline" className="capitalize">
          {user.role}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Admin Only Content */}
        <AdminOnly>
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-700">Admin Only</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                This content is only visible to administrators.
              </p>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                Access Billing
              </Button>
            </CardContent>
          </Card>
        </AdminOnly>

        {/* Trainer Only Content */}
        <TrainerOnly>
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700">Trainer Only</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                This content is only visible to trainers.
              </p>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Manage Classes
              </Button>
            </CardContent>
          </Card>
        </TrainerOnly>

        {/* Staff Content (Admin + Trainer) */}
        <StaffOnly>
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-700">Staff Only</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                This content is visible to both admins and trainers.
              </p>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                View Dashboard
              </Button>
            </CardContent>
          </Card>
        </StaffOnly>
      </div>

      {/* Permission Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-16 text-sm font-medium">Admin:</span>
              <Badge variant={isAdmin() ? "default" : "secondary"}>
                {isAdmin() ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-sm font-medium">Trainer:</span>
              <Badge variant={isTrainer() ? "default" : "secondary"}>
                {isTrainer() ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-sm font-medium">Client:</span>
              <Badge variant={isClient() ? "default" : "secondary"}>
                {isClient() ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-sm font-medium">Staff:</span>
              <Badge variant={isStaff() ? "default" : "secondary"}>
                {isStaff() ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {isAdmin() && (
              <Button size="sm" variant="outline" className="border-red-300">
                Manage Billing
              </Button>
            )}
            {isStaff() && (
              <Button size="sm" variant="outline" className="border-blue-300">
                View Reports
              </Button>
            )}
            {isTrainer() && (
              <Button size="sm" variant="outline" className="border-green-300">
                Take Attendance
              </Button>
            )}
            {isClient() && (
              <Button size="sm" variant="outline" className="border-purple-300">
                View Profile
              </Button>
            )}
          </div>
          
          {!isStaff() && !isClient() && (
            <p className="text-sm text-gray-500 mt-3">
              No actions available for your role.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
