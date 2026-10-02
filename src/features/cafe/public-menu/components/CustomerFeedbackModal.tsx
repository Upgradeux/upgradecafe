"use client";

import React, { useState } from "react";
import {
  IconX,
  IconStar,
  IconCheck,
  IconHeart,
  IconExternalLink,
} from "@tabler/icons-react";

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  cafeName: string;
  orderNumber?: string;
  googleReviewUrl?: string | null;
  onClose: () => void;
  onSubmitFeedback: (data: {
    rating: number;
    tags: string[];
    comment: string;
  }) => void;
}

const FEEDBACK_TAGS = [
  "Exceptional Coffee ☕",
  "Great Ambiance ✨",
  "Warm & Fast Service ⚡",
  "Fresh Artisanal Bakery 🥐",
  "Perfect Temperature 🌡️",
  "Comfortable Seating 🛋️",
];

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  cafeName,
  orderNumber,
  googleReviewUrl,
  onClose,
  onSubmitFeedback,
}) => {
  if (!isOpen) return null;

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Exceptional Coffee ☕"]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFeedback({
      rating,
      tags: selectedTags,
      comment: comment.trim(),
    });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-t-lg sm:rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center shadow-xs">
              <IconStar className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
                Rate Your Experience
              </h3>
              <p className="text-[10px] text-[var(--color-muted)]">
                {cafeName} {orderNumber ? `• Order ${orderNumber}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto">
          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <IconHeart className="w-6 h-6 fill-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-foreground)]">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-[11px] text-[var(--color-muted)] mt-1 max-w-[240px] mx-auto">
                  Your review helps our baristas and chefs craft even better moments. +15 Bean Points added!
                </p>
              </div>

              {googleReviewUrl && rating >= 4 && (
                <div className="pt-2 pb-1 border-t border-[var(--color-border-subtle)] space-y-2">
                  <p className="text-[11px] font-medium text-[var(--color-foreground)]">
                    Loved your visit? Help others find us on Google!
                  </p>
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-md text-xs font-semibold bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-xs transition-colors"
                  >
                    <IconExternalLink className="w-3.5 h-3.5 text-amber-500" />
                    <span>Review us on Google ★</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating selector */}
              <div className="text-center space-y-1">
                <span className="text-[11px] font-medium text-[var(--color-muted)]">
                  How was your order today?
                </span>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 text-2xl transition-transform active:scale-125 focus:outline-none"
                    >
                      <IconStar
                        className={`w-7 h-7 transition-colors ${
                          s <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-[var(--color-border)]"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-[11px] font-medium text-[var(--color-foreground)]">
                  {rating === 5 && "Outstanding! Loved everything"}
                  {rating === 4 && "Great experience"}
                  {rating === 3 && "Average, good vibes"}
                  {rating === 2 && "Could be better"}
                  {rating === 1 && "Disappointing"}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-[var(--color-foreground)] block">
                  What did you love most?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition-colors shadow-xs ${
                          isSelected
                            ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium border border-[var(--color-primary)]/40"
                            : "bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-border)]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                  Detailed Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell our baristas and chef what you thought..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-md text-xs font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconCheck className="w-4 h-4" />
                <span>Submit Review & Earn 15 Pts</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
