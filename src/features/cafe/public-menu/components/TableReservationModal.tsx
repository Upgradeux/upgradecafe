"use client";

import React, { useState } from "react";
import { TableReservationRequest } from "../types";
import {
  IconX,
  IconCalendarTime,
  IconCheck,
  IconUsers,
  IconClock,
  IconArmchair,
} from "@tabler/icons-react";

interface TableReservationModalProps {
  isOpen: boolean;
  cafeName: string;
  defaultName?: string;
  defaultPhone?: string;
  onClose: () => void;
  onSubmitReservation: (data: {
    name: string;
    phone: string;
    guests: number;
    date: string;
    time: string;
    notes: string;
  }) => void;
}

const TIME_SLOTS = [
  "10:00 AM",
  "11:30 AM",
  "01:00 PM",
  "02:30 PM",
  "04:30 PM",
  "06:00 PM",
  "07:30 PM",
  "09:00 PM",
];

export const TableReservationModal: React.FC<TableReservationModalProps> = ({
  isOpen,
  cafeName,
  defaultName = "",
  defaultPhone = "",
  onClose,
  onSubmitReservation,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(TIME_SLOTS[2]);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onSubmitReservation({
      name: name.trim(),
      phone: phone.trim(),
      guests,
      date,
      time,
      notes: notes.trim(),
    });
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-t-lg sm:rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shadow-xs">
              <IconCalendarTime className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
                Reserve a Table
              </h3>
              <p className="text-[10px] text-[var(--color-muted)]">
                {cafeName}
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
        <div className="p-4 space-y-3.5 text-xs overflow-y-auto">
          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <IconCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-foreground)]">
                  Reservation Requested!
                </h4>
                <p className="text-[11px] text-[var(--color-muted)] mt-1 max-w-[240px] mx-auto">
                  We have reserved your table for <span className="font-medium text-[var(--color-foreground)]">{guests} guests</span> on <span className="font-medium text-[var(--color-foreground)]">{date}</span> at <span className="font-medium text-[var(--color-foreground)]">{time}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white shadow-xs"
              >
                Back to Menu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Date & Guests */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                    Party Size
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                  Select Seating Time
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`py-1.5 px-1 rounded-md text-[10.5px] border text-center transition-colors shadow-xs ${
                          isSelected
                            ? "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)] font-medium"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)]"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Contact */}
              <div className="space-y-2 pt-1 border-t border-[var(--color-border-subtle)]">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Confirmation SMS sent here"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                    Special Seating Request (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Window booth, quiet corner..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-md text-xs font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <IconArmchair className="w-4 h-4" />
                  <span>Confirm Table Booking</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
