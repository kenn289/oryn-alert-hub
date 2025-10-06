"use client"

import { useMemo } from "react"
import { UserPlan, checkFeatureAccess, hasFeatureAccess, getFeatureLimit, isFeatureUnlimited } from "../lib/watchlist"

export function useFeatures(userPlan: UserPlan) {
  const features = useMemo(() => {
    const checkAccess = (feature: keyof UserPlan['features'], currentUsage: number = 0) => {
      return checkFeatureAccess(userPlan, feature, currentUsage)
    }

    const hasAccess = (feature: keyof UserPlan['features']) => {
      return hasFeatureAccess(userPlan, feature)
    }

    const getLimit = (feature: keyof UserPlan['features']) => {
      return getFeatureLimit(userPlan, feature)
    }

    const isUnlimited = (feature: keyof UserPlan['features']) => {
      return isFeatureUnlimited(userPlan, feature)
    }

    return {
      checkAccess,
      hasAccess,
      getLimit,
      isUnlimited,
      plan: userPlan
    }
  }, [userPlan])

  return features
}

export function useFeatureAccess(feature: keyof UserPlan['features'], userPlan: UserPlan, currentUsage: number = 0) {
  return useMemo(() => {
    return checkFeatureAccess(userPlan, feature, currentUsage)
  }, [feature, userPlan, currentUsage])
}

