"use client";

import React, { useState } from "react";
import { DigitalMenuCartItem, CustomerProfile } from "../types";
import {
  IconX,
  IconPlus,
  IconMinus,
  IconTrash,
  IconArmchair,
  IconShoppingBag,
  IconQrcode,
  IconCash,
  IconLoader2,
  IconCheck,
  IconUser,
  IconTag,
} from "@tabler/icons-react";

interface CustomerCartDrawerProps {
  isOpen: boolean;
  cart: DigitalMenuCartItem[];
  activeTableName: string | null;
  customerProfile: CustomerProfile | null;
  isPlacingOrder: boolean;
  allowOrderNotes?: boolean;
  enableOffers?: boolean;
  onClose: () => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onOpenAuth: () => void;
  onPlaceOrder: (options: {
    orderType: "DINE_IN" | "TAKEAWAY";
    tableName: string | null;
    customerName: string;
    customerPhone: string;
    notes: string;
    discount?: number;
    paymentPreference: "COUNTER" | "UPI_NOW";
  }) => void;
}

export const CustomerCartDrawer: React.FC<CustomerCartDrawerProps> = ({
  isOpen,
  cart,
  activeTableName,
  customerProfile,
  isPlacingOrder,
  allowOrderNotes = true,
  enableOffers = true,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onOpenAuth,
  onPlaceOrder,
}) => {
  if (!isOpen) return null;

  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">(
    activeTableName ? "DINE_IN" : "TAKEAWAY"
  );
  const [manualTableNumber, setManualTableNumber] = useState(activeTableName || "");
  const [guestName, setGuestName] = useState(customerProfile?.name || "");
  const [guestPhone, setGuestPhone] = useState(customerProfile?.phone || "");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentPreference, setPaymentPreference] = useState<"COUNTER" | "UPI_NOW">("COUNTER");

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    label: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const subtotal = cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const discountAmount = appliedPromo ? Math.min(subtotal, appliedPromo.discount) : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * 0.05);
  const total = taxableAmount + tax;

  const handleApplyPromo = (codeToApply: string) => {
    const code = codeToApply.trim().toUpperCase();
    if (!code) return;

    if (code === "WELCOME10") {
      const disc = Math.round(subtotal * 0.1);
      setAppliedPromo({ code, discount: disc, label: "10% OFF Welcome Bonus" });
      setPromoError(null);
    } else if (code === "FLAT50") {
      if (subtotal < 250) {
        setPromoError("FLAT50 requires an order above ₹250");
        return;
      }
      setAppliedPromo({ code, discount: 50, label: "₹50 Flat Discount" });
      setPromoError(null);
    } else if (code === "CHEF20") {
      const disc = Math.round(subtotal * 0.2);
      setAppliedPromo({ code, discount: disc, label: "20% OFF Chef's Special" });
      setPromoError(null);
    } else {
      setPromoError("Code not applicable for this café.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError(null);
    setPromoInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    onPlaceOrder({
      orderType,
      tableName: orderType === "DINE_IN" ? (activeTableName || manualTableNumber || "Table") : null,
      customerName: customerProfile?.name || guestName.trim() || (orderType === "DINE_IN" ? "Dine-in Guest" : "Takeaway Guest"),
      customerPhone: customerProfile?.phone || guestPhone.trim(),
      notes: orderNotes.trim(),
      discount: discountAmount,
      paymentPreference,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-t-lg sm:rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl overflow-hidden flex flex-col max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shadow-xs">
              <IconShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
                Your Table Order
              </h3>
              <p className="text-[10px] text-[var(--color-muted)]">
                {cart.length} item{cart.length === 1 ? "" : "s"} selected
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

        {/* Scrollable Cart Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">
          {/* Dining Mode Toggle (Dine-in vs Takeaway) */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2 p-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs">
              <button
                type="button"
                onClick={() => setOrderType("DINE_IN")}
                className={`py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  orderType === "DINE_IN"
                    ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs font-medium"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <IconArmchair className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Dine-In</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType("TAKEAWAY")}
                className={`py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  orderType === "TAKEAWAY"
                    ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-xs font-medium"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <IconShoppingBag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Takeaway</span>
              </button>
            </div>

            {/* Table Number indicator / manual input */}
            {orderType === "DINE_IN" && (
              <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between gap-2 shadow-xs">
                <span className="text-[11px] text-[var(--color-muted)]">
                  Serving to Table:
                </span>
                {activeTableName ? (
                  <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold text-xs border border-[var(--color-primary)]/20 shadow-xs">
                    {activeTableName}
                  </span>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter Table No. (e.g. Table 4)"
                    value={manualTableNumber}
                    onChange={(e) => setManualTableNumber(e.target.value)}
                    className="w-32 px-2 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-right font-medium"
                  />
                )}
              </div>
            )}
          </div>

          {/* Customer / Loyalty Prompt */}
          <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between gap-2 shadow-xs">
            {customerProfile && !customerProfile.isGuest ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                  ★
                </div>
                <div>
                  <span className="font-medium text-[var(--color-foreground)] block text-[11px]">
                    {customerProfile.name}
                  </span>
                  <span className="text-[9.5px] text-[var(--color-muted)]">
                    {customerProfile.memberTier} Member • {customerProfile.loyaltyPoints} Bean Pts
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <IconUser className="w-4 h-4 text-[var(--color-muted)]" />
                  <span className="text-[11px] text-[var(--color-muted)]">
                    Ordering as Guest
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-[11px] font-medium text-[var(--color-primary)] hover:underline"
                >
                  Sign in for Points
                </button>
              </div>
            )}
          </div>

          {/* Cart Item Rows */}
          <div className="space-y-2 border-y border-[var(--color-border-subtle)] py-3">
            {cart.map((item) => (
              <div
                key={item.cartItemId}
                className="p-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] space-y-1.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-xs text-[var(--color-foreground)] leading-tight truncate">
                      {item.menuItem.name}
                    </h4>
                    {item.variantSnapshotText && (
                      <p className="text-[10px] text-[var(--color-primary)] font-medium mt-0.5">
                        {item.variantSnapshotText}
                      </p>
                    )}
                    {item.customization.specialInstructions && (
                      <p className="text-[10px] text-[var(--color-muted)] italic mt-0.5">
                        &quot;{item.customization.specialInstructions}&quot;
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-semibold text-xs font-mono text-[var(--color-foreground)]">
                      ₹{item.totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[var(--color-muted)] font-mono">
                    ₹{item.unitPrice} each
                  </span>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        item.quantity > 1
                          ? onUpdateQuantity(item.cartItemId, item.quantity - 1)
                          : onRemoveItem(item.cartItemId)
                      }
                      className="w-6 h-6 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-border-subtle)] text-[var(--color-foreground)] flex items-center justify-center transition-colors"
                    >
                      {item.quantity === 1 ? (
                        <IconTrash className="w-3 h-3 text-red-500" />
                      ) : (
                        <IconMinus className="w-3 h-3" />
                      )}
                    </button>
                    <span className="w-5 text-center font-mono font-medium text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateQuantity(item.cartItemId, item.quantity + 1)
                      }
                      className="w-6 h-6 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-[var(--color-border-subtle)] text-[var(--color-foreground)] flex items-center justify-center transition-colors"
                    >
                      <IconPlus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo / Coupon Code Section */}
          {enableOffers && (
            <div className="p-2.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--color-foreground)] flex items-center gap-1.5">
                  <IconTag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span>Café Promo & Offers</span>
                </span>
                {appliedPromo && (
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-[10px] text-red-500 hover:underline font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              {appliedPromo ? (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <IconCheck className="w-3.5 h-3.5" />
                    <span className="font-semibold font-mono">{appliedPromo.code}</span>
                    <span className="text-[10px] opacity-80">({appliedPromo.label})</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    -₹{discountAmount}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. WELCOME10)"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value);
                        setPromoError(null);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] uppercase font-mono font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromo(promoInput)}
                      className="px-3 py-1 rounded-md text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] cursor-pointer transition-colors shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[10px] text-red-500 font-medium">{promoError}</p>
                  )}
                  {/* Quick Code suggestions */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[9.5px] text-[var(--color-muted)]">Popular:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPromo("WELCOME10")}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-foreground)]"
                    >
                      WELCOME10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPromo("FLAT50")}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-foreground)]"
                    >
                      FLAT50
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Special Kitchen Note */}
          {allowOrderNotes && (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
                Instructions for Kitchen (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Serve coffee first, send warm water..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] shadow-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          )}

          {/* Payment Method Preference */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--color-foreground)] block">
              Payment Option
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentPreference("COUNTER")}
                className={`p-2 rounded-md border text-left flex items-center gap-2 transition-colors shadow-xs ${
                  paymentPreference === "COUNTER"
                    ? "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)] font-medium"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)]"
                }`}
              >
                <IconCash className="w-4 h-4 flex-shrink-0" />
                <div>
                  <div className="text-[11px] font-medium">Pay Later</div>
                  <div className="text-[9.5px] opacity-75">Cash / Card at counter</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentPreference("UPI_NOW")}
                className={`p-2 rounded-md border text-left flex items-center gap-2 transition-colors shadow-xs ${
                  paymentPreference === "UPI_NOW"
                    ? "bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)] font-medium"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-foreground)]"
                }`}
              >
                <IconQrcode className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <div>
                  <div className="text-[11px] font-medium">Pay via UPI QR</div>
                  <div className="text-[9.5px] opacity-75">GooglePay, PhonePe</div>
                </div>
              </button>
            </div>
          </div>

          {/* Bill Calculation Details */}
          <div className="p-3 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] space-y-1.5 shadow-xs">
            <div className="flex justify-between text-xs text-[var(--color-muted)]">
              <span>Items Subtotal</span>
              <span className="font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Special Promo Discount</span>
                <span className="font-mono">- ₹{discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-[var(--color-muted)]">
              <span>GST / Taxes (5%)</span>
              <span className="font-mono">₹{tax.toLocaleString("en-IN")}</span>
            </div>
            <div className="pt-2 border-t border-[var(--color-border-subtle)] flex justify-between items-baseline font-semibold text-sm text-[var(--color-foreground)]">
              <span>Total Payable</span>
              <span className="font-mono text-base text-[var(--color-primary)]">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3 sm:p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <button
            type="button"
            disabled={isPlacingOrder || cart.length === 0}
            onClick={handleSubmit}
            className="w-full py-2.5 px-4 rounded-md text-xs font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isPlacingOrder ? (
              <IconLoader2 className="w-4 h-4 animate-spin" />
            ) : paymentPreference === "UPI_NOW" ? (
              <IconQrcode className="w-4 h-4" />
            ) : (
              <IconCheck className="w-4 h-4" />
            )}
            <span>
              {isPlacingOrder
                ? "Placing Order..."
                : paymentPreference === "UPI_NOW"
                ? `Pay UPI • ₹${total.toLocaleString("en-IN")}`
                : `Place Order • ₹${total.toLocaleString("en-IN")}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
