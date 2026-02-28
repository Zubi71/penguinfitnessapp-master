'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Copy, ExternalLink, Plus, Trash2, Edit, Eye, Users, TrendingUp, Gift, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ReferralCode {
  id: string
  code: string
  max_uses: number | null
  current_uses: number
  points_per_referral: number
  is_active: boolean
  expires_at: string | null
  created_at: string
  total_tracked?: number
  successful_referrals?: number
  pending_referrals?: number
  total_points_awarded?: number
}

interface ReferralAnalytics {
  total_referrals: number
  successful_referrals: number
  pending_referrals: number
  total_points_earned: number
  conversion_rate: number
  referral_codes_count: number
  active_codes_count: number
}

interface ReferralTracking {
  id: string
  status: 'pending' | 'completed' | 'cancelled'
  points_awarded: number
  completed_at: string | null
  created_at: string
  referral_codes: {
    code: string
    points_per_referral: number
  }
}

export default function TrainerReferralDashboard() {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([])
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null)
  const [tracking, setTracking] = useState<ReferralTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit referral code form
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null)
  const [editForm, setEditForm] = useState({
    maxUses: '',
    pointsPerReferral: '',
    isActive: true,
    expiresAt: null as Date | null
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [codesRes, analyticsRes, trackingRes] = await Promise.all([
        fetch('/api/referrals/codes'),
        fetch('/api/referrals/analytics'),
        fetch('/api/referrals/tracking?type=sent')
      ])

      if (codesRes.ok) {
        const codesData = await codesRes.json()
        setReferralCodes(codesData.referralCodes)
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData.analytics)
      }

      if (trackingRes.ok) {
        const trackingData = await trackingRes.json()
        setTracking(trackingData.tracking)
      }
    } catch (err) {
      setError('Failed to fetch referral data')
    } finally {
      setLoading(false)
    }
  }

  const createReferralCodeInstant = async () => {
    try {
      setCreating(true)
      setError('')
      
      const response = await fetch('/api/referrals/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxUses: null, // Unlimited uses
          pointsPerReferral: 100, // Default 100 points per referral
          expiresAt: null // No expiration
        })
      })

      if (response.ok) {
        setSuccess('Referral code created successfully!')
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create referral code')
      }
    } catch (err) {
      setError('Failed to create referral code')
    } finally {
      setCreating(false)
    }
  }

  const updateReferralCode = async () => {
    if (!editingCode) return

    try {
      const response = await fetch('/api/referrals/codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCode.id,
          maxUses: editForm.maxUses ? parseInt(editForm.maxUses) : null,
          pointsPerReferral: parseInt(editForm.pointsPerReferral),
          isActive: editForm.isActive,
          expiresAt: editForm.expiresAt?.toISOString() || null
        })
      })

      if (response.ok) {
        setSuccess('Referral code updated successfully!')
        setEditDialogOpen(false)
        setEditingCode(null)
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update referral code')
      }
    } catch (err) {
      setError('Failed to update referral code')
    }
  }

  const deleteReferralCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this referral code?')) return

    try {
      const response = await fetch(`/api/referrals/codes?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Referral code deleted successfully!')
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete referral code')
      }
    } catch (err) {
      setError('Failed to delete referral code')
    }
  }

  const copyReferralLink = (code: string) => {
    const link = `${window.location.origin}/register?ref=${code}`
    navigator.clipboard.writeText(link)
    setSuccess('Referral link copied to clipboard!')
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      cancelled: 'destructive'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading referral data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Trainer Referral Program</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Earn 100 points for each successful referral</p>
        </div>
        <Button onClick={createReferralCodeInstant} disabled={creating} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{creating ? 'Creating...' : 'Create Referral Code'}</span>
          <span className="sm:hidden">{creating ? 'Creating...' : 'Create Code'}</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{analytics.total_referrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Successful Referrals</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{analytics.successful_referrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Points Earned</CardTitle>
              <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{analytics.total_points_earned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{analytics.conversion_rate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="codes">My Referral Codes</TabsTrigger>
          <TabsTrigger value="tracking">Referral Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          <div className="grid gap-4">
            {referralCodes.map((code) => (
              <Card key={code.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{code.code}</CardTitle>
                      <CardDescription>
                        Created {formatDate(code.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyReferralLink(code.code)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCode(code)
                          setEditForm({
                            maxUses: code.max_uses?.toString() || '',
                            pointsPerReferral: code.points_per_referral.toString(),
                            isActive: code.is_active,
                            expiresAt: code.expires_at ? new Date(code.expires_at) : null
                          })
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteReferralCode(code.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Uses</div>
                      <div>{code.current_uses}</div>
                    </div>
                    <div>
                      <div className="font-medium">Points</div>
                      <div>{code.points_per_referral} per referral</div>
                    </div>
                    <div>
                      <div className="font-medium">Status</div>
                      <Badge variant={code.is_active ? 'default' : 'secondary'}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">Expires</div>
                      <div>{formatDate(code.expires_at)}</div>
                    </div>
                  </div>
                  {code.total_tracked && code.total_tracked > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Total Tracked</div>
                          <div>{code.total_tracked}</div>
                        </div>
                        <div>
                          <div className="font-medium">Successful</div>
                          <div>{code.successful_referrals || 0}</div>
                        </div>
                        <div>
                          <div className="font-medium">Points Awarded</div>
                          <div>{code.total_points_awarded || 0}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <div className="space-y-4">
            {tracking.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Referral Code: {item.referral_codes.code}</div>
                      <div className="text-sm text-muted-foreground">
                        Created {formatDate(item.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      {item.points_awarded > 0 && (
                        <Badge variant="outline">
                          +{item.points_awarded} points
                        </Badge>
                      )}
                    </div>
                  </div>
                  {item.completed_at && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Completed {formatDate(item.completed_at)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Referral Code</DialogTitle>
            <DialogDescription>
              Update your referral code settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editMaxUses">Maximum Uses</Label>
              <Input
                id="editMaxUses"
                type="number"
                placeholder="Leave empty for unlimited"
                value={editForm.maxUses}
                onChange={(e) => setEditForm({ ...editForm, maxUses: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editPointsPerReferral">Points Per Referral</Label>
              <Input
                id="editPointsPerReferral"
                type="number"
                value={editForm.pointsPerReferral}
                onChange={(e) => setEditForm({ ...editForm, pointsPerReferral: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              />
              <Label htmlFor="editIsActive">Active</Label>
            </div>
            <div>
              <Label>Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editForm.expiresAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editForm.expiresAt ? format(editForm.expiresAt, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editForm.expiresAt || undefined}
                    onSelect={(date) => setEditForm({ ...editForm, expiresAt: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={updateReferralCode} className="w-full">
              Update Referral Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
