import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

// Validate custom referral code format and uniqueness
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { customCode } = body

    if (!customCode) {
      return NextResponse.json({ error: 'Custom code is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate format
    const { data: formatValidation, error: formatError } = await supabase.rpc('validate_custom_referral_code_format', {
      p_code: customCode
    })

    if (formatError) {
      console.error('Error validating format:', formatError)
      return NextResponse.json({ error: 'Failed to validate code format' }, { status: 500 })
    }

    const formatResult = formatValidation[0]
    if (!formatResult.is_valid) {
      return NextResponse.json({ 
        isValid: false, 
        error: formatResult.error_message,
        suggestions: null
      })
    }

    // Check uniqueness
    const { data: isUnique, error: uniqueError } = await supabase.rpc('check_custom_referral_code_unique', {
      p_code: customCode
    })

    if (uniqueError) {
      console.error('Error checking uniqueness:', uniqueError)
      return NextResponse.json({ error: 'Failed to check code uniqueness' }, { status: 500 })
    }

    if (!isUnique) {
      // Get suggestions for alternative codes
      const { data: suggestions, error: suggestionsError } = await supabase.rpc('suggest_alternative_codes', {
        p_base_code: customCode,
        p_count: 5
      })

      if (suggestionsError) {
        console.error('Error getting suggestions:', suggestionsError)
      }

      return NextResponse.json({ 
        isValid: false, 
        error: 'This referral code is already taken. Please choose a different one.',
        suggestions: suggestions || []
      })
    }

    return NextResponse.json({ 
      isValid: true, 
      error: null,
      suggestions: null
    })

  } catch (error) {
    console.error('Validate custom code API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
