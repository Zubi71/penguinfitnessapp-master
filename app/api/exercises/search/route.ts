import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = await createClient()

    // Build the query
    let dbQuery = supabase
      .from('exercise_library')
      .select('*')

    // Add search filters
    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`)
    }

    if (category && category !== 'all') {
      dbQuery = dbQuery.eq('category', category)
    }

    // Add limit and ordering
    dbQuery = dbQuery
      .order('name', { ascending: true })
      .limit(limit)

    const { data: exercises, error } = await dbQuery

    if (error) {
      console.error('Error fetching exercises:', error)
      
      // Check if it's a table not found error
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Exercise library table does not exist',
          code: 'TABLE_NOT_FOUND',
          message: 'Please run the migration: supabase/migrations/create_exercise_library.sql'
        }, { status: 404 })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch exercises', details: error.message },
        { status: 500 }
      )
    }

    // Get unique categories for filter dropdown
    const { data: categories } = await supabase
      .from('exercise_library')
      .select('category')
      .order('category')

    const uniqueCategories = [...new Set(categories?.map((c: any) => c.category) || [])]

    return NextResponse.json({
      exercises: exercises || [],
      categories: uniqueCategories
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
