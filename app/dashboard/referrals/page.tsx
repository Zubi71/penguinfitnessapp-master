'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Eye, TrendingUp, Users, DollarSign, Target } from 'lucide-react'

interface ReferralStats {
  totalReferrals: number
  successfulReferrals: number
  totalPointsEarned: number
  conversionRate: number
}

interface TopPerformer {
  user_id: string
  total_referrals: number
  successful_referrals: number
  total_points_earned: number
  conversion_rate: number
  profiles: {
    first_name: string
    last_name: string
    email: string
  }
}

interface ReferralCode {
  referral_code_id: string
  referrer_id: string
  code: string
  max_uses: number | null
  current_uses: number
  points_per_referral: number
  is_active: boolean
  expires_at: string | null
  created_at: string
  total_tracked: number
  successful_referrals: number
  pending_referrals: number
  total_points_awarded: number
  profiles: {
    first_name: string
    last_name: string
    email: string
  }
}

interface ReferralActivity {
  id: string
  status: 'pending' | 'completed' | 'cancelled'
  points_awarded: number
  completed_at: string | null
  created_at: string
  referral_codes: {
    code: string
  }
  referrer: {
    first_name: string
    last_name: string
    email: string
  }
  referred: {
    first_name: string
    last_name: string
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([])
  const [recentActivity, setRecentActivity] = useState<ReferralActivity[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [currentPage])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/referrals?page=${currentPage}&limit=20`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.overallStats)
        setTopPerformers(data.topPerformers)
        setReferralCodes(data.referralCodes)
        setRecentActivity(data.recentActivity)
        setPagination(data.pagination)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch referral data')
      }
    } catch (err) {
      setError('Failed to fetch referral data')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async (type: string) => {
    try {
      const response = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to export data')
      }
    } catch (err) {
      setError('Failed to export data')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const formatName = (profile: { first_name: string; last_name: string }) => {
    return `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown'
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
          <h1 className="text-2xl sm:text-3xl font-bold">Referral Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Monitor and manage referral system</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData('codes')} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export Codes</span>
            <span className="sm:hidden">Codes</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('tracking')} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export Tracking</span>
            <span className="sm:hidden">Tracking</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('analytics')} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export Analytics</span>
            <span className="sm:hidden">Analytics</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.totalReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Successful Referrals</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.successfulReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Points Awarded</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.totalPointsEarned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="codes">Referral Codes</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Users with the most successful referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Total Referrals</TableHead>
                    <TableHead>Successful</TableHead>
                    <TableHead>Points Earned</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.map((performer) => (
                    <TableRow key={performer.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatName(performer.profiles)}</div>
                          <div className="text-sm text-muted-foreground">{performer.profiles.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{performer.total_referrals}</TableCell>
                      <TableCell>{performer.successful_referrals}</TableCell>
                      <TableCell>{performer.total_points_earned}</TableCell>
                      <TableCell>{performer.conversion_rate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Referral Codes</CardTitle>
              <CardDescription>Complete list of referral codes in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">Code</TableHead>
                      <TableHead className="min-w-[150px]">Creator</TableHead>
                      <TableHead className="min-w-[60px]">Uses</TableHead>
                      <TableHead className="min-w-[60px]">Points</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Created</TableHead>
                      <TableHead className="min-w-[100px]">Expires</TableHead>
                      <TableHead className="min-w-[120px]">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralCodes.map((code) => (
                      <TableRow key={code.referral_code_id}>
                        <TableCell>
                          <div className="font-mono font-medium text-sm">{code.code}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{formatName(code.profiles)}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[140px]">{code.profiles.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{code.current_uses}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{code.points_per_referral}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={code.is_active ? 'default' : 'secondary'} className="text-xs">
                            {code.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{formatDate(code.created_at)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{formatDate(code.expires_at)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{code.successful_referrals} successful</div>
                            <div className="text-muted-foreground">{code.total_points_awarded} points</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Referral Activity</CardTitle>
              <CardDescription>Latest referral activities across the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatName(activity.referrer)}</div>
                          <div className="text-sm text-muted-foreground">{activity.referrer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatName(activity.referred)}</div>
                          <div className="text-sm text-muted-foreground">{activity.referred.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">{activity.referral_codes.code}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          activity.status === 'completed' ? 'default' :
                          activity.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activity.points_awarded > 0 ? `+${activity.points_awarded}` : '-'}
                      </TableCell>
                      <TableCell>{formatDate(activity.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
