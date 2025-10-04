"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, X } from 'lucide-react'
import { toast } from 'sonner'

interface TicketRatingModalProps {
  ticket: {
    id: string
    subject: string
    status: string
  }
  isOpen: boolean
  onClose: () => void
  onRated: () => void
}

export function TicketRatingModal({ ticket, isOpen, onClose, onRated }: TicketRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/support/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          rating: rating,
          feedback: feedback.trim() || null
        })
      })

      if (response.ok) {
        toast.success('Thank you for your feedback!')
        onRated()
        onClose()
        setRating(0)
        setFeedback('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-primary">Rate Your Experience</CardTitle>
              <CardDescription className="text-muted-foreground">{ticket.subject}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Rating Stars */}
            <div className="space-y-2">
              <Label className="text-foreground">How would you rate our support?</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-colors hover:scale-110"
                    type="button"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground hover:text-yellow-500'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {rating === 0 && 'Click a star to rate'}
                {rating === 1 && 'Poor - We need to improve'}
                {rating === 2 && 'Fair - Room for improvement'}
                {rating === 3 && 'Good - Satisfactory service'}
                {rating === 4 && 'Very Good - Great service'}
                {rating === 5 && 'Excellent - Outstanding service'}
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-foreground">
                Additional Feedback (Optional)
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us about your experience..."
                className="border-border focus:border-primary focus:ring-primary/20 bg-background/50"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={handleRating}
                disabled={isSubmitting || rating === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-border hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
