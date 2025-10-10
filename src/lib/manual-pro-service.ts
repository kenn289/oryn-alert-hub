import { supabase } from './supabase'

export interface ManualProGrant {
  id: string
  user_id: string
  granted_by: string
  reason?: string
  expires_at?: string
  created_at: string
  revoked_at?: string
  revoked_by?: string
  revoked_reason?: string
}

export interface ManualProGrantRequest {
  userId: string
  grantedBy: string
  reason?: string
  expiresAt?: string
}

export interface ManualProRevokeRequest {
  userId: string
  revokedBy: string
  reason?: string
}

export class ManualProService {
  /**
   * Grant manual Pro access to a user
   */
  static async grantManualProAccess(request: ManualProGrantRequest): Promise<{
    success: boolean
    message: string
    grantId?: string
  }> {
    try {
      const { data, error } = await supabase.rpc('grant_manual_pro_access', {
        target_user_id: request.userId,
        granted_by_user_id: request.grantedBy,
        reason: request.reason || null,
        expires_at: request.expiresAt || null
      })

      if (error) {
        console.error('Error granting manual Pro access:', error)
        return { success: false, message: 'Failed to grant manual Pro access' }
      }

      console.log(`✅ Manual Pro access granted to user ${request.userId} by ${request.grantedBy}`)
      return { 
        success: true, 
        message: 'Manual Pro access granted successfully',
        grantId: data?.id
      }
    } catch (error) {
      console.error('ManualProService.grantManualProAccess error:', error)
      return { success: false, message: 'Failed to grant manual Pro access' }
    }
  }

  /**
   * Revoke manual Pro access from a user
   */
  static async revokeManualProAccess(request: ManualProRevokeRequest): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const { data, error } = await supabase.rpc('revoke_manual_pro_access', {
        target_user_id: request.userId,
        revoked_by_user_id: request.revokedBy,
        reason: request.reason || null
      })

      if (error) {
        console.error('Error revoking manual Pro access:', error)
        return { success: false, message: 'Failed to revoke manual Pro access' }
      }

      console.log(`✅ Manual Pro access revoked from user ${request.userId} by ${request.revokedBy}`)
      return { 
        success: true, 
        message: 'Manual Pro access revoked successfully'
      }
    } catch (error) {
      console.error('ManualProService.revokeManualProAccess error:', error)
      return { success: false, message: 'Failed to revoke manual Pro access' }
    }
  }

  /**
   * Check if user has valid manual Pro access
   */
  static async hasValidManualProAccess(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_manual_pro_valid', {
        user_id: userId
      })

      if (error) {
        console.error('Error checking manual Pro access:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('ManualProService.hasValidManualProAccess error:', error)
      return false
    }
  }

  /**
   * Get manual Pro grants for a user
   */
  static async getUserManualProGrants(userId: string): Promise<ManualProGrant[]> {
    try {
      const { data, error } = await supabase
        .from('manual_pro_grants')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching manual Pro grants:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('ManualProService.getUserManualProGrants error:', error)
      return []
    }
  }

  /**
   * Get all manual Pro grants (admin only)
   */
  static async getAllManualProGrants(): Promise<ManualProGrant[]> {
    try {
      const { data, error } = await supabase
        .from('manual_pro_grants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching all manual Pro grants:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('ManualProService.getAllManualProGrants error:', error)
      return []
    }
  }

  /**
   * Get users with manual Pro access
   */
  static async getUsersWithManualProAccess(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          plan,
          manual_pro_override,
          manual_pro_granted_by,
          manual_pro_granted_at,
          manual_pro_reason,
          manual_pro_expires_at
        `)
        .eq('manual_pro_override', true)
        .order('manual_pro_granted_at', { ascending: false })

      if (error) {
        console.error('Error fetching users with manual Pro access:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('ManualProService.getUsersWithManualProAccess error:', error)
      return []
    }
  }

  /**
   * Check if manual Pro access is expired and clean up
   */
  static async cleanupExpiredManualProAccess(): Promise<{
    success: boolean
    cleanedCount: number
    message: string
  }> {
    try {
      // Get users with expired manual Pro access
      const { data: expiredUsers, error: fetchError } = await supabase
        .from('users')
        .select('id, email')
        .eq('manual_pro_override', true)
        .not('manual_pro_expires_at', 'is', null)
        .lt('manual_pro_expires_at', new Date().toISOString())

      if (fetchError) {
        console.error('Error fetching expired users:', fetchError)
        return { success: false, cleanedCount: 0, message: 'Failed to fetch expired users' }
      }

      let cleanedCount = 0

      for (const user of expiredUsers || []) {
        try {
          // Revoke manual Pro access
          await this.revokeManualProAccess({
            userId: user.id,
            revokedBy: 'system',
            reason: 'Manual Pro access expired'
          })
          cleanedCount++
        } catch (error) {
          console.error(`Error revoking expired access for user ${user.id}:`, error)
        }
      }

      console.log(`✅ Cleaned up ${cleanedCount} expired manual Pro accesses`)
      return { 
        success: true, 
        cleanedCount, 
        message: `Cleaned up ${cleanedCount} expired manual Pro accesses` 
      }
    } catch (error) {
      console.error('ManualProService.cleanupExpiredManualProAccess error:', error)
      return { success: false, cleanedCount: 0, message: 'Failed to cleanup expired access' }
    }
  }

  /**
   * Get manual Pro access statistics
   */
  static async getManualProStats(): Promise<{
    totalGrants: number
    activeGrants: number
    expiredGrants: number
    revokedGrants: number
  }> {
    try {
      const { data: grants, error } = await supabase
        .from('manual_pro_grants')
        .select('*')

      if (error) {
        console.error('Error fetching manual Pro stats:', error)
        return {
          totalGrants: 0,
          activeGrants: 0,
          expiredGrants: 0,
          revokedGrants: 0
        }
      }

      const now = new Date()
      const totalGrants = grants?.length || 0
      const activeGrants = grants?.filter(grant => 
        !grant.revoked_at && 
        (!grant.expires_at || new Date(grant.expires_at) > now)
      ).length || 0
      const expiredGrants = grants?.filter(grant => 
        !grant.revoked_at && 
        grant.expires_at && 
        new Date(grant.expires_at) <= now
      ).length || 0
      const revokedGrants = grants?.filter(grant => grant.revoked_at).length || 0

      return {
        totalGrants,
        activeGrants,
        expiredGrants,
        revokedGrants
      }
    } catch (error) {
      console.error('ManualProService.getManualProStats error:', error)
      return {
        totalGrants: 0,
        activeGrants: 0,
        expiredGrants: 0,
        revokedGrants: 0
      }
    }
  }
}
