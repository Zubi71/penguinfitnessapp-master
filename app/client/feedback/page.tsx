'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { MessageSquare, Calendar, Clock, User, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FeedbackForm from '@/components/feedback/FeedbackForm'
import { toast } from 'sonner'

// Utility function to format time to 12-hour format with AM/PM and no seconds
const formatTime = (timeString: string): string => {
  try {
    // Parse the time string (e.g., "14:30:00" or "14:30")
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return timeString; // Return original if parsing fails
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  } catch (error) {
    return timeString; // Return original if any error occurs
  }
};

interface RecentClass {
  id: string
  name: string
  date: string
  start_time: string
  end_time: string
  instructor_name?: string
  trainer_name?: string
  class_type?: string
  session_type?: string
}

export default function ClientFeedbackPage() {
  const router = useRouter()
  const [recentClasses, setRecentClasses] = useState<RecentClass[]>([])
  const [selectedClass, setSelectedClass] = useState<RecentClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchRecentClasses()
  }, [])

  const fetchRecentClasses = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      // Get client ID from user email - try multiple tables
      console.log('Looking up client with email:', user.email)
      
      let clientData: any = null
      let clientError: any = null
      
      // First try client_signups table
      const { data: signupData, error: signupError } = await supabase
        .from('client_signups')
        .select('id')
        .eq('email', user.email)
        .single()

      if (signupData) {
        clientData = signupData
        console.log('Found client in client_signups table')
      } else {
        // Try clients table (alternative table name)
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .single()
        
        if (clientsData) {
          clientData = clientsData
          console.log('Found client in clients table')
        } else {
          // Try profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()
          
          if (profileData) {
            clientData = { id: profileData.id }
            console.log('Found user in profiles table')
          } else {
            clientError = 'No client record found in any table'
          }
        }
      }

      if (!clientData) {
        console.error('Client lookup error:', clientError)
        console.error('User email:', user.email)
        console.error('User ID:', user.id)
        
        // Instead of showing error and returning, show a message and sample data
        console.log('No client record found, showing sample data for testing')
        toast.info('Welcome! Since this is your first time, you can test the feedback system with a sample class.')
        const sampleClass: RecentClass = {
          id: 'sample-1',
          name: 'Sample Swimming Class',
          date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '11:00',
          instructor_name: 'John Doe',
          class_type: 'group'
        }
        setRecentClasses([sampleClass])
        setLoading(false)
        return
      }

      // Try to fetch recent classes using multiple approaches
      console.log('Fetching classes for client ID:', clientData.id)
      
      let attendanceData: any = null
      let attendanceError: any = null
      
      // First try to get classes directly from classes table
      try {
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            date,
            start_time,
            end_time,
            class_type,
            instructor_id
          `)
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 7 days
          .order('date', { ascending: false })
          .limit(10)
        
        if (classesData && classesData.length > 0) {
          // Format classes data to match expected structure
          attendanceData = classesData.map(classItem => ({
            classes: classItem
          }))
          console.log('Found classes directly:', classesData)
        } else {
          console.log('No classes found in classes table')
        }
      } catch (classesError) {
        console.log('Error accessing classes table:', classesError)
      }
      
      // If no classes found directly, try attendance table
      if (!attendanceData) {
        try {
          const { data: attData, error: attError } = await supabase
            .from('attendance')
            .select(`
              *,
              classes (
                id,
                name,
                date,
                start_time,
                end_time,
                class_type,
                instructor_id
              )
            `)
            .eq('client_id', clientData.id)
            .eq('status', 'present')
            .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('date', { ascending: false })
          
          if (attData && attData.length > 0) {
            attendanceData = attData
            console.log('Found attendance data:', attData)
          } else {
            attendanceError = attError
            console.log('No attendance data found')
          }
        } catch (attTableError) {
          console.log('Attendance table not accessible:', attTableError)
          attendanceError = attTableError
        }
      }

      // If still no data, show sample data
      if (!attendanceData) {
        console.log('No class data found, showing sample data')
        const sampleClass: RecentClass = {
          id: 'sample-1',
          name: 'Sample Swimming Class',
          date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '11:00',
          instructor_name: 'John Doe',
          class_type: 'group'
        }
        setRecentClasses([sampleClass])
        setLoading(false)
        return
      }

      // Also fetch recent training sessions (simplified approach)
      let sessionData: any = null
      try {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('training_sessions')
          .select(`
            id,
            name,
            date,
            start_time,
            end_time,
            session_type,
            trainer_id
          `)
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('date', { ascending: false })
          .limit(5)
        
        if (sessionsData && sessionsData.length > 0) {
          sessionData = sessionsData.map(session => ({
            training_sessions: session
          }))
          console.log('Found training sessions:', sessionsData)
        }
      } catch (sessionsError) {
        console.log('Error accessing training_sessions table:', sessionsError)
      }

      // Get instructor names for the classes
      const instructorIds = attendanceData
        ?.map((attendance: any) => attendance.classes?.instructor_id)
        .filter((id: any) => id) || []
      
      let instructorNames: { [key: string]: string } = {}
      if (instructorIds.length > 0) {
        try {
          const { data: instructorData, error: instructorError } = await supabase
            .from('instructors')
            .select('id, first_name, last_name')
            .in('id', instructorIds)
          
          if (instructorError) {
            console.error('Error fetching instructors:', instructorError)
          } else if (instructorData) {
            instructorData.forEach(instructor => {
              instructorNames[instructor.id] = `${instructor.first_name} ${instructor.last_name}`
            })
          }
        } catch (instructorError) {
          console.log('Error accessing instructors table:', instructorError)
        }
      }

      // Get trainer names for the training sessions
      const trainerIds = sessionData
        ?.map((session: any) => session.training_sessions?.trainer_id)
        .filter((id: any) => id) || []
      
      let trainerNames: { [key: string]: string } = {}
      if (trainerIds.length > 0) {
        try {
          const { data: trainerData, error: trainerError } = await supabase
            .from('trainers')
            .select('id, first_name, last_name')
            .in('id', trainerIds)
          
          if (trainerError) {
            console.error('Error fetching trainers:', trainerError)
          } else if (trainerData) {
            trainerData.forEach(trainer => {
              trainerNames[trainer.id] = `${trainer.first_name} ${trainer.last_name}`
            })
          }
        } catch (trainerError) {
          console.log('Error accessing trainers table:', trainerError)
        }
      }

      // Combine and format the data
      const formattedClasses: RecentClass[] = []

      // Add classes
      attendanceData?.forEach((attendance: any) => {
        if (attendance.classes) {
          formattedClasses.push({
            id: attendance.classes.id,
            name: attendance.classes.name,
            date: attendance.classes.date,
            start_time: attendance.classes.start_time,
            end_time: attendance.classes.end_time,
            instructor_name: attendance.classes.instructor_id 
              ? instructorNames[attendance.classes.instructor_id]
              : undefined,
            class_type: attendance.classes.class_type
          })
        }
      })

      // Add training sessions
      sessionData?.forEach((session: any) => {
        if (session.training_sessions) {
          formattedClasses.push({
            id: session.training_sessions.id,
            name: session.training_sessions.name,
            date: session.training_sessions.date,
            start_time: session.training_sessions.start_time,
            end_time: session.training_sessions.end_time,
            trainer_name: session.training_sessions.trainer_id
              ? trainerNames[session.training_sessions.trainer_id]
              : undefined,
            session_type: session.training_sessions.session_type
          })
        }
      })

      console.log('Formatted classes:', formattedClasses)
      
      // If no recent classes found, show sample data for testing
      if (formattedClasses.length === 0) {
        console.log('No recent classes found, showing sample data for testing')
        const sampleClass: RecentClass = {
          id: 'sample-1',
          name: 'Sample Swimming Class',
          date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '11:00',
          instructor_name: 'John Doe',
          class_type: 'group'
        }
        setRecentClasses([sampleClass])
      } else {
        setRecentClasses(formattedClasses)
      }

    } catch (error) {
      console.error('Error fetching recent classes:', error)
      toast.error('Failed to fetch recent classes')
    } finally {
      setLoading(false)
    }
  }

  const handleClassSelect = (classItem: RecentClass) => {
    setSelectedClass(classItem)
    setShowFeedbackForm(true)
  }

  const handleFeedbackSubmit = (feedback: any) => {
    toast.success('Thank you for your feedback!')
    setShowFeedbackForm(false)
    setSelectedClass(null)
    // Optionally refresh the list to show feedback has been given
  }

  const handleBack = () => {
    setShowFeedbackForm(false)
    setSelectedClass(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showFeedbackForm && selectedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recent Classes
          </Button>
          
          <FeedbackForm
            classId={selectedClass.class_type ? selectedClass.id : undefined}
            sessionId={selectedClass.session_type ? selectedClass.id : undefined}
            className={selectedClass.name}
            sessionName={selectedClass.name}
            trainerName={selectedClass.instructor_name || selectedClass.trainer_name}
            onSubmit={handleFeedbackSubmit}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Class Feedback
                </h1>
                <p className="text-blue-100 text-lg">Share your experience with us</p>
              </div>
              <div className="flex items-center space-x-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {recentClasses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                No Recent Classes
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                You haven't attended any classes in the past week. 
                Feedback forms will appear here after you attend a class.
              </p>
              <Button onClick={() => router.push('/client')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
                         <div className="mb-8">
               <h2 className="text-2xl font-bold text-gray-800 mb-4">
                 Recent Classes
               </h2>
               <p className="text-gray-600">
                 Select a class below to provide feedback about your experience.
               </p>
               {recentClasses.some(c => c.id === 'sample-1') && (
                 <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                   <p className="text-blue-800 text-sm">
                     💡 <strong>Demo Mode:</strong> You're seeing sample data to test the feedback system. 
                     Once you attend real classes, they will appear here automatically.
                   </p>
                 </div>
               )}
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentClasses.map((classItem) => (
                <Card 
                  key={classItem.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-blue-300"
                  onClick={() => handleClassSelect(classItem)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{classItem.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {classItem.class_type || classItem.session_type || 'Session'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(classItem.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                      </div>
                      {(classItem.instructor_name || classItem.trainer_name) && (
                        <div className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          {classItem.instructor_name || classItem.trainer_name}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full mt-4"
                      variant="outline"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Provide Feedback
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
