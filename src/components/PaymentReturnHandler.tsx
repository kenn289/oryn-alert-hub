"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

interface PaymentState {
  orderId: string
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'expired'
  plan: string
  amount: number
  currency: string
  createdAt: string
  expiresAt: string
  errorMessage?: string
}

export default function PaymentReturnHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = searchParams.get('order_id')
  const paymentId = searchParams.get('payment_id')
  const signature = searchParams.get('signature')

  useEffect(() => {
    if (!orderId || !user) return

    checkPaymentStatus()
  }, [orderId, user])

  const checkPaymentStatus = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(
        `/api/razorpay/payment-status?order_id=${orderId}&user_id=${user.id}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to check payment status')
      }

      const data = await response.json()
      
      if (data.success) {
        setPaymentState(data.payment)
      } else {
        setError(data.error || 'Failed to get payment status')
      }
    } catch (err) {
      console.error('Error checking payment status:', err)
      setError('Failed to check payment status')
    } finally {
      setLoading(false)
    }
  }

  const handleRetryPayment = async () => {
    if (!paymentState) return

    try {
      const response = await fetch('/api/razorpay/payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentState.orderId,
          userId: user?.id,
          action: 'retry'
        })
      })

      if (response.ok) {
        // Redirect to payment page
        router.push('/subscription')
      } else {
        setError('Failed to create new payment session')
      }
    } catch (err) {
      console.error('Error retrying payment:', err)
      setError('Failed to retry payment')
    }
  }

  const handleCancelPayment = async () => {
    if (!paymentState) return

    try {
      const response = await fetch('/api/razorpay/payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentState.orderId,
          userId: user?.id,
          action: 'cancel'
        })
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError('Failed to cancel payment')
      }
    } catch (err) {
      console.error('Error cancelling payment:', err)
      setError('Failed to cancel payment')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking payment status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Payment Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!paymentState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Not Found</h2>
          <p className="text-gray-600 mb-4">The payment you're looking for could not be found.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const renderPaymentStatus = () => {
    switch (paymentState.status) {
      case 'success':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-green-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">Payment Successful!</h2>
            <p className="text-green-600 mb-4">
              Your {paymentState.plan} subscription has been activated successfully.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold capitalize">{paymentState.plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">
                  ₹{(paymentState.amount / 100).toFixed(2)} {paymentState.currency}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )

      case 'failed':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Payment Failed</h2>
            <p className="text-red-600 mb-4">
              {paymentState.errorMessage || 'Your payment could not be processed.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetryPayment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )

      case 'cancelled':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Payment Cancelled</h2>
            <p className="text-yellow-600 mb-4">
              Your payment was cancelled. No charges have been made to your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetryPayment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )

      case 'expired':
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="text-orange-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-orange-800 mb-2">Payment Expired</h2>
            <p className="text-orange-600 mb-4">
              Your payment session has expired. Please try again to complete your subscription.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetryPayment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )

      case 'pending':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-blue-600 mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Payment in Progress</h2>
            <p className="text-blue-600 mb-4">
              Your payment is being processed. Please wait while we confirm your payment.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This page will automatically refresh to check the status.
            </p>
            <button
              onClick={checkPaymentStatus}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Check Status
            </button>
          </div>
        )

      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Unknown Status</h2>
            <p className="text-gray-600 mb-4">
              The payment status is unclear. Please contact support if you need assistance.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto">
        {renderPaymentStatus()}
      </div>
    </div>
  )
}
