# Database Issues Fix Guide

## 🚨 Current Issues Found

1. **Missing `notifications` table** - API endpoints are failing with error: `Could not find the table 'public.notifications'`
2. **Missing database schema** - Several tables may not exist
3. **API endpoints failing** - 500 errors due to missing tables

## 🔧 Fix Steps

### Step 1: Apply Database Fix
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `fix-database.sql`
4. Paste and run the SQL script
5. Verify all tables are created

### Step 2: Verify Tables Created
After running the SQL, you should see these tables:
- ✅ `users`
- ✅ `support_tickets` 
- ✅ `notifications` (THIS WAS MISSING!)
- ✅ `subscriptions`
- ✅ `payment_events`

### Step 3: Test API Endpoints
The following endpoints should now work:
- ✅ `/api/notifications?userId=test`
- ✅ `/api/support/stats`
- ✅ `/api/support/tickets`
- ✅ `/api/admin/users`
- ✅ `/api/master/users`

## 📋 What the Fix Includes

### Database Tables
- **users**: User accounts with plans (free, pro, master)
- **support_tickets**: Support ticket system
- **notifications**: User notifications (WAS MISSING!)
- **subscriptions**: Payment subscriptions
- **payment_events**: Payment tracking

### Security & Permissions
- Row Level Security (RLS) enabled
- Proper policies for data access
- Master account with full access
- User-specific data isolation

### Sample Data
- Master account: `kennethoswin289@gmail.com`
- Test users for development
- Sample support tickets
- Sample notifications

## 🎯 Expected Results

After applying the fix:
1. ✅ No more "table not found" errors
2. ✅ API endpoints return proper responses
3. ✅ Database schema is complete
4. ✅ Security policies are in place
5. ✅ Sample data for testing

## 🚀 Quick Verification

Run this in your browser console to test:
```javascript
fetch('/api/notifications?userId=test')
  .then(r => r.json())
  .then(console.log)
```

Should return an array of notifications instead of a 500 error.

## 📞 Support

If you still see issues after applying the fix:
1. Check Supabase logs for any SQL errors
2. Verify all tables exist in the database
3. Check that RLS policies are properly configured
4. Ensure the master account is created

The fix is comprehensive and should resolve all database-related issues!
