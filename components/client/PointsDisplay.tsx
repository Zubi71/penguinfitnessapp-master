'use client'

import React, { useState, useEffect } from 'react'
import { Gift, Star, TrendingUp, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface PointsData {
  points_balance: number
  total_points_earned: number
  total_points_spent: number
}

interface Transaction {
  id: string
  transaction_type: 'earned' | 'spent' | 'expired' | 'bonus'
  points_amount: number
  description: string
  created_at: string
}

interface Reward {
  id: string
  reward_type: 'discount_percentage' | 'discount_fixed' | 'free_event' | 'free_class'
  reward_value: number
  description: string
  expires_at: string
}

interface PointsDisplayProps {
  className?: string
}

export default function PointsDisplay({ className }: PointsDisplayProps) {
  const [pointsData, setPointsData] = useState<PointsData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showRewardsModal, setShowRewardsModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)

  useEffect(() => {
    fetchPointsData()
  }, [])

  const fetchPointsData = async () => {
    try {
      const response = await fetch('/api/client/points')
      if (response.ok) {
        const data = await response.json()
        setPointsData(data.points)
        setTransactions(data.transactions)
        setRewards(data.rewards)
      }
    } catch (error) {
      console.error('Error fetching points data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'spent':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      case 'bonus':
        return <Award className="h-4 w-4 text-yellow-600" />
      default:
        return <Star className="h-4 w-4 text-gray-600" />
    }
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount_percentage':
      case 'discount_fixed':
        return <Gift className="h-5 w-5 text-purple-600" />
      case 'free_event':
      case 'free_class':
        return <Award className="h-5 w-5 text-yellow-600" />
      default:
        return <Gift className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pointsData) {
    return null
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Your Points & Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Points Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{pointsData.points_balance}</div>
              <div className="text-sm text-gray-600">Current Balance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{pointsData.total_points_earned}</div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{rewards.length}</div>
              <div className="text-sm text-gray-600">Active Rewards</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransactionsModal(true)}
              className="flex-1"
            >
              View History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRewardsModal(true)}
              className="flex-1"
            >
              View Rewards
            </Button>
          </div>

          {/* Recent Activity */}
          {transactions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recent Activity</h4>
              <div className="space-y-2">
                {transactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.transaction_type)}
                      <span className="truncate">{transaction.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.transaction_type === 'earned' ? 'default' : 'secondary'}>
                        {transaction.transaction_type === 'earned' ? '+' : '-'}{transaction.points_amount}
                      </Badge>
                      <span className="text-gray-500 text-xs">{formatDate(transaction.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Modal */}
      <Dialog open={showTransactionsModal} onOpenChange={setShowTransactionsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Points History</DialogTitle>
            <DialogDescription>
              View all your points transactions and activities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{formatDate(transaction.created_at)}</div>
                  </div>
                </div>
                <Badge variant={transaction.transaction_type === 'earned' ? 'default' : 'secondary'}>
                  {transaction.transaction_type === 'earned' ? '+' : '-'}{transaction.points_amount}
                </Badge>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No transactions yet. Start earning points by registering for events!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rewards Modal */}
      <Dialog open={showRewardsModal} onOpenChange={setShowRewardsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Rewards</DialogTitle>
            <DialogDescription>
              Available rewards and discounts you've earned.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getRewardIcon(reward.reward_type)}
                  <div>
                    <div className="font-medium">{reward.description}</div>
                    <div className="text-sm text-gray-500">
                      Expires: {formatDate(reward.expires_at)}
                    </div>
                  </div>
                </div>
                <Badge variant="default">
                  {reward.reward_type === 'discount_percentage' && `${reward.reward_value}% OFF`}
                  {reward.reward_type === 'discount_fixed' && `$${reward.reward_value} OFF`}
                  {reward.reward_type === 'free_event' && 'FREE EVENT'}
                  {reward.reward_type === 'free_class' && 'FREE CLASS'}
                </Badge>
              </div>
            ))}
            {rewards.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No rewards yet. Keep earning points to unlock rewards!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
