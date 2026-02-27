import React, { useMemo, useState, useEffect } from "react";
import Modal from "./Modal.jsx";

function isShopOpenFromStorage() {
  const v = localStorage.getItem("myfooddesk_shop_open");
  return v === null ? true : v === "true";
}

function closeMessageFromStorage() {
  return (
    localStorage.getItem("myfooddesk_shop_close_msg") ||
    "Sorry, the shop is closed today. Please come back tomorrow."
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

export default function CartModal({
  open,
  onClose,
  cartLines,
  subtotal, 
  onUpdateQty,
  onRemove,
  onCheckout,
  notice,
}) {
  const isEmpty = !cartLines || cartLines.length === 0;

  const shopOpen = useMemo(() => isShopOpenFromStorage(), [open]);
  const shopClosedMsg = useMemo(() => closeMessageFromStorage(), [open]);

  const [confirmOneDayAhead, setConfirmOneDayAhead] = useState(false);
  useEffect(() => {
    if (open) setConfirmOneDayAhead(false);
  }, [open]);

  const safeUpdateQty = (productId, nextQty) => {
    onUpdateQty(productId, Math.max(1, nextQty));
  };

  const pricing = useMemo(() => {
    const lines = (cartLines || []).map((l) => {
      const qty = Number(l.qty) || 0;
      const price = Number(l.price) || 0;
      const rawLineTotal = qty * price;

      const perDishRate = getPerDishRate(qty);
      const perDishDiscount = rawLineTotal * perDishRate;
      const afterPerDishTotal = rawLineTotal - perDishDiscount;

      return {
        ...l,
        qty,
        price,
        rawLineTotal,
        perDishRate,
        perDishDiscount,
        afterPerDishTotal,
        requiresHeadUp: qty > 12,
      };
    });

    const totalQty = lines.reduce((s, l) => s + l.qty, 0);
    const rawSubtotal = lines.reduce((s, l) => s + l.rawLineTotal, 0);

    const perDishDiscountTotal = lines.reduce((s, l) => s + l.perDishDiscount, 0);
    const subtotalAfterPerDish = rawSubtotal - perDishDiscountTotal;

    const cartRate = getCartRate(totalQty);
    const cartDiscountTotal = subtotalAfterPerDish * cartRate;

    const discountTotal = perDishDiscountTotal + cartDiscountTotal;
    const finalSubtotal = rawSubtotal - discountTotal;

    const needsHeadUpConfirm = lines.some((l) => l.requiresHeadUp);

    return {
      lines,
      totalQty,
      rawSubtotal,
      perDishDiscountTotal,
      cartRate,
      cartDiscountTotal,
      discountTotal,
      finalSubtotal,
      needsHeadUpConfirm,
    };
  }, [cartLines]);

  const checkoutDisabled =
    isEmpty ||
    !shopOpen ||
    (pricing.needsHeadUpConfirm && !confirmOneDayAhead);

  return (
    <Modal open={open} title="Your Cart" onClose={onClose}>
      <div className="stack">
        {notice ? <div className="notice">{notice}</div> : null}

        {!shopOpen ? (
          <div className="notice">
            <b>Shop is closed.</b>
            <div className="small mt">{shopClosedMsg}</div>
          </div>
        ) : null}

        {isEmpty ? (
          <div className="muted">Your cart is empty.</div>
        ) : (
          <div className="stack">
            {pricing.lines.map((l) => {
              const atMin = l.qty <= 1;
              const pct = Math.round(l.perDishRate * 100);

              return (
                <div key={l.productId} className="cart-line">
                  <img className="cart-img" src={l.imageUrl} alt={l.name} />
                  <div className="cart-info">
                    <div className="row space">
                      <div>
                        <b>{l.name}</b>
                        <div className="muted small">
                          ฿{Number(l.price).toFixed(2)} each
                        </div>

                        {l.perDishRate > 0 ? (
                          <div className="notice small mt">
                            <b>Bulk discount:</b> {pct}%{" "}
                            <span className="muted">
                              (qty {l.qty} • 1-day head up)
                            </span>
                          </div>
                        ) : (
                          <div className="muted small mt">
                            Bulk discount per dish (1-day advance notice required): Order more than 12 of the same dish and get 15% off; order more than 20 and get 25% off.
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        {l.perDishRate > 0 ? (
                          <>
                            <b>฿{Number(l.afterPerDishTotal).toFixed(2)}</b>
                            <div className="muted small">
                              <s>฿{Number(l.rawLineTotal).toFixed(2)}</s>{" "}
                              (−฿{Number(l.perDishDiscount).toFixed(2)})
                            </div>
                          </>
                        ) : (
                          <b>฿{Number(l.rawLineTotal).toFixed(2)}</b>
                        )}
                      </div>
                    </div>

                    <div className="row space mt">
                      <div className="row">
                        <button
                          className={`btn ${atMin ? "btn-disabled" : ""}`}
                          disabled={atMin}
                          onClick={() => safeUpdateQty(l.productId, l.qty - 1)}
                        >
                          -
                        </button>

                        <div className="qty-box">{l.qty}</div>

                        <button
                          className="btn"
                          onClick={() => safeUpdateQty(l.productId, l.qty + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button className="btn" onClick={() => onRemove(l.productId)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="notice">
              <b>Total Order Discount</b>
              <div className="small mt">
                Total items in cart: <b>{pricing.totalQty}</b>
              </div>

              {pricing.cartRate > 0 ? (
                <div className="small mt">
                  Applied: <b>{Math.round(pricing.cartRate * 100)}%</b>{" "}
                  (−฿{Number(pricing.cartDiscountTotal).toFixed(2)})
                </div>
              ) : (
                <div className="small mt">
                  Total order discount: Get 5% off when you order more than 10 items, and 10% off when you order more than 15 items.
                </div>
              )}

              {pricing.perDishDiscountTotal > 0 ? (
                <div className="small mt">
                  Per-dish discounts total: <b>−฿{Number(pricing.perDishDiscountTotal).toFixed(2)}</b>
                </div>
              ) : null}
            </div>

            {pricing.needsHeadUpConfirm ? (
              <div className="notice">
                <b>Head-up required</b>
                <div className="small mt">
                  A dish quantity is more than <b>12</b>. Please confirm the order is scheduled for <b>tomorrow or later</b>.
                </div>

                <label className="row mt" style={{ gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={confirmOneDayAhead}
                    onChange={(e) => setConfirmOneDayAhead(e.target.checked)}
                  />
                  <span className="small">
                    I confirm this order is scheduled for <b>tomorrow or later</b>.
                  </span>
                </label>
              </div>
            ) : null}
          </div>
        )}

        <div className="divider" />

        <div className="row space">
          <div className="title">Subtotal</div>
          <div className="title">฿{Number(pricing.rawSubtotal).toFixed(2)}</div>
        </div>

        {pricing.discountTotal > 0 ? (
          <div className="row space mt">
            <div className="title">Discount</div>
            <div className="title">−฿{Number(pricing.discountTotal).toFixed(2)}</div>
          </div>
        ) : null}

        <div className="row space mt">
          <div className="title">Total</div>
          <div className="title">฿{Number(pricing.finalSubtotal).toFixed(2)}</div>
        </div>

        <div className="row space mt">
          <button className="btn" onClick={onClose}>
            Close
          </button>

          <button
            className={`btn btn-primary ${checkoutDisabled ? "btn-disabled" : ""}`}
            disabled={checkoutDisabled}
            onClick={() =>
              onCheckout?.({
                totalQty: pricing.totalQty,
                cartRate: pricing.cartRate,
                cartDiscountTotal: pricing.cartDiscountTotal,
                perDishDiscountTotal: pricing.perDishDiscountTotal,
                discountTotal: pricing.discountTotal,
                finalSubtotal: pricing.finalSubtotal,
                confirmOneDayAhead,
              })
            }
          >
            Checkout
          </button>
        </div>
      </div>
    </Modal>
  );
}
