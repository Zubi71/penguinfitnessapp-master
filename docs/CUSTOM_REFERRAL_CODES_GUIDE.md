# Custom Referral Code System Implementation

## Overview
This implementation allows users to create their own custom referral codes with comprehensive validation to ensure uniqueness and security. The system prevents duplicate codes and makes it difficult to track or guess codes.

## Features Implemented

### 1. Database Functions (`supabase/custom_referral_codes.sql`)
- **`validate_custom_referral_code_format()`** - Validates code format and security requirements
- **`check_custom_referral_code_unique()`** - Checks if a code is already taken
- **`create_custom_referral_code()`** - Creates custom codes with full validation
- **`suggest_alternative_codes()`** - Suggests alternatives when a code is taken

### 2. API Endpoints
- **`POST /api/referrals/codes`** - Updated to handle both random and custom codes
- **`POST /api/referrals/validate-custom`** - Validates custom codes and provides suggestions

### 3. UI Components
- **`CustomReferralCodeDialog`** - Interactive dialog for creating custom codes
- **Updated Referral Dashboard** - Now includes both random and custom code creation options

## Validation Rules

### Format Requirements
- **Length**: 4-20 characters
- **Characters**: Letters, numbers, underscores, and hyphens only
- **Start/End**: Must start and end with letter or number
- **Patterns**: No sequential patterns (123, abc, qwe, etc.)
- **Repetition**: No more than 3 consecutive identical characters
- **Common Words**: Blocks common words like "admin", "test", "demo", etc.

### Security Features
- **Case Insensitive**: All codes are stored in uppercase for consistency
- **Uniqueness Check**: Prevents duplicate codes across all users
- **Real-time Validation**: Validates format and uniqueness as user types
- **Suggestions**: Provides alternative codes when requested code is taken

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the custom referral code functions:

```sql
-- Execute the contents of supabase/custom_referral_codes.sql
-- This creates all necessary functions and grants permissions
```

### 2. API Integration
The existing `/api/referrals/codes` endpoint now supports:
- **Random codes**: `POST` with no `customCode` parameter
- **Custom codes**: `POST` with `customCode` parameter

### 3. UI Integration
The referral dashboard now includes:
- **Random Code Button**: Creates codes using the original system
- **Custom Code Button**: Opens dialog for custom code creation

## Usage Examples

### Creating a Custom Code
1. User clicks "Create Custom Code" button
2. Enters desired code (e.g., "MYCODE2024")
3. System validates format and uniqueness in real-time
4. If taken, shows suggestions (e.g., "MYCODE20241", "MYCODE20242")
5. User selects valid code and creates it

### API Usage
```javascript
// Create custom code
const response = await fetch('/api/referrals/codes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customCode: 'MYCODE2024',
    maxUses: 100,
    pointsPerReferral: 100,
    expiresAt: '2024-12-31T23:59:59Z'
  })
})

// Validate custom code
const validation = await fetch('/api/referrals/validate-custom', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customCode: 'MYCODE2024' })
})
```

## Security Considerations

### Code Generation
- **No Sequential Patterns**: Prevents easy guessing
- **Format Validation**: Ensures codes meet security standards
- **Uniqueness Enforcement**: Database-level constraints prevent duplicates
- **Case Normalization**: All codes stored in uppercase

### Tracking Prevention
- **Random Suggestions**: Alternative codes use random numbers
- **Pattern Blocking**: Common patterns are blocked
- **Length Requirements**: Minimum 4 characters prevents short, guessable codes

## Testing

### Manual Testing
1. **Valid Codes**: Test with codes like "MYCODE2024", "FITNESS123", "GYM2024"
2. **Invalid Codes**: Test with "123", "admin", "test", "abc"
3. **Duplicate Codes**: Try creating the same code twice
4. **Suggestions**: Test suggestion system when code is taken

### Edge Cases
- **Empty Codes**: Should show validation error
- **Special Characters**: Should be filtered out
- **Very Long Codes**: Should be truncated to 20 characters
- **Case Sensitivity**: Should work regardless of input case

## Benefits

### For Users
- **Memorable Codes**: Users can create codes they remember
- **Branding**: Codes can reflect user's brand or name
- **Easy Sharing**: Custom codes are easier to share verbally

### For Security
- **Uniqueness**: No duplicate codes across the system
- **Validation**: Comprehensive format and security validation
- **Tracking Prevention**: Makes it difficult to track or guess codes
- **Real-time Feedback**: Immediate validation prevents errors

## Future Enhancements

### Potential Additions
- **Code Analytics**: Track which custom codes perform best
- **Code Templates**: Pre-defined templates for common patterns
- **Bulk Creation**: Create multiple codes at once
- **Code History**: Track code creation and modification history
- **Advanced Suggestions**: AI-powered code suggestions based on user preferences

### Performance Optimizations
- **Caching**: Cache validation results for better performance
- **Indexing**: Add database indexes for faster uniqueness checks
- **Rate Limiting**: Prevent abuse of validation endpoints

## Troubleshooting

### Common Issues
1. **Code Already Taken**: Use suggestions or try variations
2. **Invalid Format**: Check character requirements and length
3. **API Errors**: Verify database functions are properly installed
4. **UI Not Loading**: Check component imports and dependencies

### Debug Steps
1. Check database function permissions
2. Verify API endpoint responses
3. Test validation logic manually
4. Check browser console for errors
5. Verify component props and state management
