import { supabase } from './supabase'

export interface UserInitializationData {
  userId: string
  email: string
  plan: 'free' | 'pro' | 'master'
  isActive: boolean
}

export class UserInitializationService {
  /**
   * Initialize a new user with all required data
   */
  static async initializeNewUser(userId: string, email: string): Promise<UserInitializationData> {
    try {
      console.log(`🚀 Initializing new user: ${email}`)
      
      // 1. Create user record in users table
      let userData
      try {
        userData = await this.createUserRecord(userId, email)
      } catch (error) {
        console.error('Failed to create user record:', error)
        // If user creation fails, we can't continue
        throw error
      }
      
      // 2. Create welcome notification (optional)
      try {
        await this.createWelcomeNotification(userId, email)
      } catch (error) {
        console.warn('Failed to create welcome notification:', error)
        // Continue even if notification creation fails
      }
      
      // 3. Create default subscription (optional)
      try {
        await this.createDefaultSubscription(userId, email)
      } catch (error) {
        console.warn('Failed to create default subscription:', error)
        // Continue even if subscription creation fails
      }
      
      // 4. Create sample data (optional)
      try {
        await this.createSampleData(userId, email)
      } catch (error) {
        console.warn('Failed to create sample data:', error)
        // Continue even if sample data creation fails
      }
      
      console.log(`✅ User initialization complete for: ${email}`)
      
      return userData
    } catch (error) {
      console.error('Error initializing new user:', error)
      throw error
    }
  }

  /**
   * Create user record in users table
   */
  private static async createUserRecord(userId: string, email: string): Promise<UserInitializationData> {
    // First, test database connectivity
    console.log('Testing database connectivity...')
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('Database connectivity test failed:', testError)
        console.error('Test error details:', {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        })
        throw new Error('Database connection failed')
      }
      
      console.log('Database connectivity test passed')
    } catch (connectError) {
      console.error('Database connectivity test exception:', connectError)
      throw new Error('Database connection failed')
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        plan: 'free',
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user record:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // Check if it's a duplicate key error (user already exists)
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        console.log('User already exists, fetching existing record...')
        // Try to fetch the existing user
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (fetchError) {
          console.error('Error fetching existing user:', fetchError)
          console.error('Fetch error details:', {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint
          })
          throw new Error('Failed to fetch existing user record')
        }
        
        return {
          userId: existingUser.id,
          email: existingUser.email,
          plan: existingUser.plan,
          isActive: existingUser.is_active
        }
      }
      
      // Check if it's a table not found error
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('Users table not found, skipping user creation')
        throw new Error('Database table not found')
      }
      
      // If error object is empty, it might be a connection issue
      if (!error.code && !error.message) {
        console.error('Empty error object - possible connection issue')
        throw new Error('Database connection error')
      }
      
      throw new Error('Failed to create user record')
    }

    return {
      userId: data.id,
      email: data.email,
      plan: data.plan,
      isActive: data.is_active
    }
  }

  /**
   * Create welcome notification
   */
  private static async createWelcomeNotification(userId: string, email: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'user_joined',
        title: 'Welcome to Oryn Alert Hub!',
        message: `Welcome ${email}! Your account has been created successfully. Start exploring our features and set up your first stock alerts.`,
        read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating welcome notification:', error)
      // Don't throw error for notification failure
    }
  }

  /**
   * Create default subscription (free plan)
   */
  private static async createDefaultSubscription(userId: string, email: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: 'free',
        status: 'active',
        amount: 0,
        currency: 'INR',
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating default subscription:', error)
      // Don't throw error for subscription failure
    }
  }

  /**
   * Create sample data for new users
   */
  private static async createSampleData(userId: string, email: string): Promise<void> {
    // Create sample notifications to help users understand the system
    const sampleNotifications = [
      {
        user_id: userId,
        type: 'alert_triggered',
        title: 'Sample Alert',
        message: 'This is a sample notification. You can create stock alerts and receive notifications like this.',
        read: false,
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        type: 'plan_updated',
        title: 'Free Plan Active',
        message: 'You are currently on the free plan. Upgrade to Pro for advanced features.',
        read: false,
        created_at: new Date().toISOString()
      }
    ]

    const { error } = await supabase
      .from('notifications')
      .insert(sampleNotifications)

    if (error) {
      console.error('Error creating sample notifications:', error)
      // Don't throw error for sample data failure
    }
  }

  /**
   * Check if user exists in our users table
   */
  static async userExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user existence:', error)
        console.error('User existence check error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error checking user existence:', error)
      return false
    }
  }

  /**
   * Update user's last login
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating last login:', error)
      }
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }
}
