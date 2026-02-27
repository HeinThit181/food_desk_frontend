import React, { useMemo, useState, useEffect } from "react";
import Modal from "./Modal.jsx";
import { calcDeliveryFee, currency, nowISO } from "../lib/utils.js";

function Field({ label, children }) {
  return (
    <label className="field">
      <div className="label">{label}</div>
      {children}
    </label>
  );
}

function getCartRate(totalQty) {
  if (totalQty > 15) return 0.10;
  if (totalQty > 10) return 0.05;
  return 0;
}

function getPerDishRate(qty) {
  if (qty > 20) return 0.25;
  if (qty > 12) return 0.15;
  return 0;
}

function isValidDateStr(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
function isValidHourTimeStr(v) {
  return typeof v === "string" && /^(?:[01]\d|2[0-3]):00$/.test(v);
}

function toLocalMidnight(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
}

function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function generateHourlyTimeOptions(start = 9, end = 20) {
  const options = [];
  for (let h = start; h <= end; h++) {
    const hh = String(h).padStart(2, "0");
    options.push(`${hh}:00`);
  }
  return options;
}

function isTodayOrLater(dateStr) {
  if (!isValidDateStr(dateStr)) return false;
  const selected = toLocalMidnight(dateStr);

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return selected >= todayMidnight;
}

function isAtLeastTomorrow(dateStr) {
  if (!isValidDateStr(dateStr)) return false;
  const selected = toLocalMidnight(dateStr);

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);

  return selected >= tomorrowMidnight;
}

function isHourTimeValidForDate(dateStr, timeStr) {
  if (!isValidDateStr(dateStr) || !isValidHourTimeStr(timeStr)) return false;

  const [hh] = timeStr.split(":").map(Number);

  const selectedDate = toLocalMidnight(dateStr);
  const scheduled = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    hh,
    0,
    0,
    0
  );

  const now = new Date();

  if (isSameLocalDay(scheduled, now)) {
    const nowRoundedToHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0,
      0,
      0
    );
    return scheduled >= nowRoundedToHour;
  }

  return true;
}

import qrImage from "../assets/img/qr.png";

export default function CheckoutModal({
  open,
  onClose,
  cartLines,
  zones,
  guest,
  setGuest,
  subtotal: _unused,
  onPlaceOrder,
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [step, setStep] = useState(0); 


  useEffect(() => {
    if (!open) setStep(0);
  }, [open]);

  function isValidEmail(email) {
    if (!email) return false;

    const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return re.test(email);
  }

  function isValidPhone(phone) {
    if (!phone) return false;

    const re = /^\+?\d{8,15}$/;
    return re.test(phone);
  }

  const pricing = useMemo(() => {
    const rawSubtotal = cartLines.reduce((acc, l) => acc + l.price * l.qty, 0);
    const totalQty = cartLines.reduce((acc, l) => acc + l.qty, 0);

    const cartDiscountRate = getCartRate(totalQty);
    const cartDiscount = rawSubtotal * cartDiscountRate;

    const itemsWithDiscount = cartLines.map(l => {
      const rate = getPerDishRate(l.qty);
      const discount = l.price * l.qty * rate;
      return {
        ...l,
        discountRate: rate * 100,
        discountAmount: discount,
        finalPrice: (l.price * l.qty) - discount
      };
    });

    const dishDiscount = itemsWithDiscount.reduce((acc, l) => acc + l.discountAmount, 0);
    const discountTotal = cartDiscount + dishDiscount;

    return {
      rawSubtotal,
      totalQty,
      cartDiscount,
      dishDiscount,
      discountTotal,
      items: itemsWithDiscount
    };
  }, [cartLines]);

  const deliveryFee = useMemo(
    () => calcDeliveryFee(guest.address, zones),
    [guest.address, zones]
  );
  const isBulkOrder = useMemo(() => cartLines.some((l) => l.qty > 12), [cartLines]);

  const total = pricing.rawSubtotal - pricing.discountTotal + (deliveryFee || 0);

  const isScheduleValid = useMemo(() => {
    if (!showSchedule) return !isBulkOrder; // If bulk, schedule must be shown
    if (!isTodayOrLater(scheduleDate)) return false;
    if (!isHourTimeValidForDate(scheduleDate, scheduleTime)) return false;
    return true;
  }, [showSchedule, scheduleDate, scheduleTime, isBulkOrder]);

  const isEmailValid = guest.customerEmail ? isValidEmail(guest.customerEmail) : true;
  const isPhoneValid = guest.customerPhone ? isValidPhone(guest.customerPhone) : true;

  const placeDisabled =
    !guest.customerName ||
    !guest.customerPhone ||
    !isValidPhone(guest.customerPhone) || 
    !guest.customerEmail || 
    !isValidEmail(guest.customerEmail) || 
    !guest.address ||
    deliveryFee === null || 
    (isBulkOrder && !showSchedule) || 
    (showSchedule && !isScheduleValid);

  const handlePlaceOrder = () => {
    if (placeDisabled) return;

    const payload = {
      customerName: guest.customerName,
      customerPhone: guest.customerPhone,
      customerEmail: guest.customerEmail || "",
      deliveryAddress: guest.address,
      orderNote: guest.orderNote || "",
      scheduledDateTime: showSchedule
        ? new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
        : null,

      items: cartLines.map((l) => ({
        productId: l.productId,
        productName: l.name,
        qty: l.qty,
        unitPrice: l.price,
      })),

      subtotal: pricing.rawSubtotal,
      bulkDiscount: pricing.discountTotal,
      deliveryFee: deliveryFee,
      totalAmount: total,

      paymentStatus: "PAID", 
      status: "CONFIRMED",
    };

    onPlaceOrder(payload);
  };

  return (
    <Modal open={open} title={step === 0 ? "Checkout Details" : "Scan to Pay"} onClose={onClose}>
      <div className="stack">
        {step === 0 ? (
          <>
            <Field label="Name *">
              <input
                className="input"
                type="text"
                placeholder="Full Name"
                value={guest.customerName}
                onChange={(e) => setGuest({ ...guest, customerName: e.target.value })}
              />
            </Field>
            <Field label="Phone *">
              <input
                className={`input ${!isPhoneValid && guest.customerPhone ? 'border-red-500' : ''}`}
                style={!isPhoneValid && guest.customerPhone ? { borderColor: 'red' } : {}}
                type="text"
                placeholder="081-123-4567"
                value={guest.customerPhone}
                onChange={(e) => setGuest({ ...guest, customerPhone: e.target.value })}
              />
            </Field>
            {!isPhoneValid && guest.customerPhone && (
              <div className="muted extra-small" style={{ color: "red", marginTop: -4, marginBottom: 8 }}>
                Phone must be 8-15 digits (optional '+' allowed).
              </div>
            )}

            <Field label="Email *">
              <input
                className={`input ${!isEmailValid && guest.customerEmail ? 'border-red-500' : ''}`}
                style={!isEmailValid && guest.customerEmail ? { borderColor: 'red' } : {}}
                type="email"
                placeholder="email@example.com"
                value={guest.customerEmail}
                onChange={(e) => setGuest({ ...guest, customerEmail: e.target.value })}
              />
            </Field>
            {!isEmailValid && guest.customerEmail && (
              <div className="muted extra-small" style={{ color: "red", marginTop: -4, marginBottom: 8 }}>
                Please enter a valid email address (e.g. jackson@gmail.com).
              </div>
            )}

            <Field label="Delivery Address">
              <textarea
                className="input"
                rows={3}
                placeholder="Enter full address"
                value={guest.address}
                onChange={(e) => setGuest({ ...guest, address: e.target.value })}
              />
            </Field>
            <div className="muted small" style={{ marginTop: -8, marginBottom: 8 }}>
              Delivery fee auto-calculated by zone keywords.
            </div>

            <Field label="Order Note (Optional)">
              <textarea
                className="input"
                rows={2}
                placeholder='e.g. "Hold off the spice", "No vegetables", "Less sugar"...'
                value={guest.orderNote}
                onChange={(e) => setGuest({ ...guest, orderNote: e.target.value })}
              />
            </Field>

            <div className="divider" />

            <div className="row space items-center">
              <div className="title" style={{ fontSize: 16 }}>Schedule</div>
              <button
                className="btn btn-small"
                onClick={() => setShowSchedule(!showSchedule)}
              >
                {showSchedule ? "Remove schedule" : "Set schedule"}
              </button>
            </div>

            {showSchedule && (
              <div className="stack gap-sm mt">
                <Field label="Scheduled Date">
                  <input
                    className="input"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </Field>
                <Field label="Scheduled Time">
                  <select
                    className="input"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  >
                    <option value="">Select time</option>
                    {generateHourlyTimeOptions().map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="muted small"> Available times: 09:00-20:00 (hourly) </div>
              </div>
            )}

            {isBulkOrder && !showSchedule && (
              <div className="card-error mt-sm p-sm">
                <div className="title small">Schedule Required</div>
                <div className="muted extra-small">Orders with more than 12 of a single item require a scheduled delivery (1-day head-up recommended).</div>
              </div>
            )}

            {guest.address && deliveryFee === null && (
              <div className="card-error mt-sm p-sm" style={{ borderColor: 'red', color: 'red' }}>
                <div className="title small">Out of Delivery Zone</div>
                <div className="extra-small">Sorry, your address does not match any of our delivery zones.</div>
              </div>
            )}

            <div className="divider" />

            <div className="stack gap-sm">
              <div className="title" style={{ fontSize: 18 }}>Order Summary</div>
              {pricing.items.map((item) => (
                <div key={item.id} className="stack gap-xs pb-sm" style={{ borderBottom: '1px dashed var(--border)' }}>
                  <div className="row space small">
                    <div className="title small">{item.name} × {item.qty}</div>
                    <b>฿{(item.price * item.qty).toFixed(2)}</b>
                  </div>
                  {item.discountRate > 0 && (
                    <div className="row space extra-small text-success">
                      <span>Per-item Discount ({item.discountRate}%)</span>
                      <span>-฿{item.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="row space small bold">
                    <span>Final Item Total</span>
                    <span>฿{item.finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}

              <div className="mt-sm">
                <div className="row space">
                  <div className="muted">Order Amount</div>
                  <b>฿{(pricing.rawSubtotal - pricing.dishDiscount).toFixed(2)}</b>
                </div>

                {pricing.cartDiscount > 0 && (
                  <div className="row space text-success extra-small">
                    <span>Bulk Order Discount ({getCartRate(pricing.totalQty) * 100}%)</span>
                    <span>-฿{pricing.cartDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="row space">
                  <div className="muted">Delivery Fee</div>
                  <b>{deliveryFee !== null ? `฿${deliveryFee.toFixed(2)}` : <span style={{ color: "red" }}>Out of Zone</span>}</b>
                </div>

                <div className="row space title" style={{ fontSize: 22 }}>
                  <span>Total Due</span>
                  <span className="text-primary">{deliveryFee !== null ? `฿${total.toFixed(2)}` : "-"}</span>
                </div>
              </div>
            </div>

            <div className="row space mt">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button
                className={`btn btn-primary ${placeDisabled ? "btn-disabled" : ""}`}
                disabled={placeDisabled}
                onClick={() => setStep(1)}
              >
                Place Order
              </button>
            </div>
          </>
        ) : (
          <div className="stack center items-center text-center py-md">
            <div className="title">Payment Method: PromptPay</div>
            <div className="muted small mb">Scan the QR code to pay ฿{total.toFixed(2)}</div>

            <div className="card" style={{ padding: 20, background: '#fff', border: '2px solid var(--border)' }}>
              <img src={qrImage} alt="QR Code" style={{ width: 240, height: 240, display: 'block' }} />
            </div>

            <div className="row gap-md mt-lg">
              <button className="btn" onClick={() => setStep(0)}>Back</button>
              <button className="btn btn-primary" style={{ minWidth: 160 }} onClick={handlePlaceOrder}>
                Done
              </button>
            </div>

            <div className="muted extra-small mt">
              Clicking "Done" acknowledges that you have completed the payment.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
