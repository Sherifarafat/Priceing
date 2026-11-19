import * as React from 'react'
import { Star, Send, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSaaSStore } from '@/lib/saas-store'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { currentUser } = useSaaSStore()
  const [rating, setRating] = React.useState<number>(5)
  const [hoverRating, setHoverRating] = React.useState<number>(0)
  const [category, setCategory] = React.useState<string>('General')
  const [feedbackText, setFeedbackText] = React.useState<string>('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const categories = ['General', 'Feature Request', 'UI / Design', 'Bug Report']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackText.trim()) {
      toast.error('Please enter your feedback before submitting.')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success('Thank you for your feedback! It helps us improve Priceing.')
      setFeedbackText('')
      onOpenChange(false)
    }, 400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md p-6'>
        <DialogHeader className='space-y-1.5'>
          <div className='flex items-center gap-2'>
            <div className='size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#3EEA85] border border-emerald-500/20 flex items-center justify-center shrink-0'>
              <MessageSquare className='size-4' />
            </div>
            <div>
              <DialogTitle className='text-lg font-bold text-foreground'>Share Your Feedback</DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Help us make Priceing better. Tell us what you like or what needs improvement.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          {/* Star Rating */}
          <div className='flex flex-col items-center justify-center p-3 rounded-xl bg-muted/30 border border-border/40 gap-1.5'>
            <span className='text-xs font-semibold text-foreground'>How is your experience with the platform?</span>
            <div className='flex items-center gap-1.5'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className='p-1 transition-transform hover:scale-110 cursor-pointer'
                >
                  <Star
                    className={`size-6 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div>
            <label className='block text-xs font-semibold text-foreground mb-1.5'>Topic</label>
            <div className='flex flex-wrap gap-1.5'>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type='button'
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    category === cat
                      ? 'bg-black text-white dark:bg-[#3EEA85] dark:text-black font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Text Area */}
          <div>
            <label className='block text-xs font-semibold text-foreground mb-1.5'>Your Feedback</label>
            <Textarea
              rows={4}
              placeholder='What do you think of the new design, features, or performance? Any suggestions?'
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className='text-xs resize-none'
              required
            />
          </div>

          {/* User note */}
          <div className='text-[11px] text-muted-foreground flex items-center justify-between pt-1'>
            <span>Submitting as: <strong className='text-foreground'>{currentUser.name}</strong></span>
            <span>{currentUser.email}</span>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='text-xs'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              size='sm'
              className='text-xs bg-black text-white hover:bg-neutral-800 dark:bg-[#3EEA85] dark:text-black dark:hover:bg-[#34D399] font-bold'
              disabled={isSubmitting}
            >
              <Send className='size-3 mr-1.5' />
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
