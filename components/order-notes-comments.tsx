"use client"

import { useState } from "react"
import { Loader2, MessageSquare, StickyNote } from "lucide-react"

const EMPTY_NOTES = "No notes have been added for this order."
const EMPTY_COMMENTS = "No comments yet. Be the first to add one."

/**
 * FileMaker stores multi-line fields with carriage returns (\r), which
 * `whitespace-pre-wrap` does not render as line breaks. Normalize to \n so the
 * original line structure from the database is preserved as-is on screen.
 */
function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n?/g, "\n")
}

function PanelHeader({
  title,
  icon: Icon,
}: {
  title: string
  icon: typeof StickyNote
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-3">
        <span className="h-8 w-1 rounded-full bg-primary" />
        <h3 className="text-[18px] font-semibold tracking-tight text-foreground">{title}</h3>
      </div>
    </div>
  )
}

export function OrderNotesComments({
  notes,
  initialComments,
  vendorId,
  poNumber,
  disabled = false,
}: {
  notes: string
  initialComments: string
  vendorId: string | null
  poNumber: string
  disabled?: boolean
}) {
  const [comments, setComments] = useState(initialComments)
  const [draft, setDraft] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePost = async () => {
    const trimmed = draft.trim()
    if (!trimmed || !vendorId || isPosting || disabled) {
      return
    }

    try {
      setIsPosting(true)
      setError(null)

      const response = await fetch("/api/orders/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, poNumber, comment: trimmed }),
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setComments(typeof data.vendorComments === "string" ? data.vendorComments : comments)
        setDraft("")
        return
      }

      setError(data.error || "Failed to post comment")
    } catch (postError) {
      setError("An unexpected error occurred")
      console.error(postError)
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <section className="grid items-stretch gap-6 lg:grid-cols-2">
      <div className="flex h-[460px] flex-col rounded-[18px] border border-border/70 bg-card p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <PanelHeader title="PO Notes" icon={StickyNote} />
        <div className="min-h-0 flex-1 overflow-y-auto rounded-[14px] border border-border/70 bg-muted/40 p-4">
          {notes ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
              {normalizeLineBreaks(notes)}
            </p>
          ) : (
            <p className="text-[14px] text-muted-foreground">{EMPTY_NOTES}</p>
          )}
        </div>
      </div>

      <div className="flex h-[460px] flex-col rounded-[18px] border border-border/70 bg-card p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <PanelHeader title="Vendor Comments" icon={MessageSquare} />
        <div className="min-h-0 flex-1 overflow-y-auto rounded-[14px] border border-border/70 bg-muted/40 p-4">
          {comments ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
              {normalizeLineBreaks(comments)}
            </p>
          ) : (
            <p className="text-[14px] text-muted-foreground">{EMPTY_COMMENTS}</p>
          )}
        </div>

        {error && (
          <p className="mt-3 text-[13px] font-medium text-destructive">{error}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void handlePost()
              }
            }}
            placeholder={disabled ? "Comments are closed for this order" : "Enter your comment"}
            disabled={isPosting || disabled}
            className="h-11 flex-1 rounded-xl border border-border/70 bg-background px-4 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handlePost()}
            disabled={isPosting || !draft.trim() || !vendorId || disabled}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(181,74,74,0.18)] transition-colors hover:bg-[#d36a6a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Post
          </button>
        </div>
      </div>
    </section>
  )
}
