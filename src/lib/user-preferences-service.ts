import { supabase } from './supabase'

export interface UserPreferences {
  currency: string
  timezone?: string
  dateFormat?: string
  notifications?: {
    email: boolean
    push: boolean
    alerts: boolean
  }
}

export class UserPreferencesService {
  /**
   * Get user preferences from database
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user preferences:', error)
        return this.getDefaultPreferences()
      }

      const metadata = data?.metadata || {}
      return {
        currency: metadata.currency || 'USD',
        timezone: metadata.timezone,
        dateFormat: metadata.dateFormat,
        notifications: metadata.notifications
      }
    } catch (error) {
      console.error('UserPreferencesService.getUserPreferences error:', error)
      return this.getDefaultPreferences()
    }
  }

  /**
   * Update user preferences in database
   */
  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<{ success: boolean; message: string }> {
    try {
      // Get current preferences
      const currentPrefs = await this.getUserPreferences(userId)
      
      // Merge with new preferences
      const updatedPrefs = { ...currentPrefs, ...preferences }
      
      const { error } = await supabase
        .from('users')
        .update({ 
          metadata: {
            currency: updatedPrefs.currency,
            timezone: updatedPrefs.timezone,
            dateFormat: updatedPrefs.dateFormat,
            notifications: updatedPrefs.notifications
          }
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user preferences:', error)
        return { success: false, message: 'Failed to update preferences' }
      }

      return { success: true, message: 'Preferences updated successfully' }
    } catch (error) {
      console.error('UserPreferencesService.updateUserPreferences error:', error)
      return { success: false, message: 'Failed to update preferences' }
    }
  }

  /**
   * Update user currency preference
   */
  static async updateUserCurrency(userId: string, currency: string): Promise<{ success: boolean; message: string }> {
    return this.updateUserPreferences(userId, { currency })
  }

  /**
   * Get default user preferences
   */
  private static getDefaultPreferences(): UserPreferences {
    return {
      currency: 'USD',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/DD/YYYY',
      notifications: {
        email: true,
        push: true,
        alerts: true
      }
    }
  }
}
