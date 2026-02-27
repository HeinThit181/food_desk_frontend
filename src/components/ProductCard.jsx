import React from "react";

export default function ProductCard({ p, onView, onAdd }) {
  const isInactive = !p?.isActive;
  const isSoldOut = !!p?.isSoldOut;

  const disableAdd = isInactive || isSoldOut;

  const addLabel = isSoldOut ? "Sold Out" : isInactive ? "Not available" : "Add to Cart";

  return (
    <div className="product-card">
      <div className="product-wrap">
        {isSoldOut && (
          <div className="soldout-badge pill pill-yellow">SOLD OUT</div>
        )}
        <img className={`product-img ${isSoldOut ? "soldout-dim" : ""}`} src={p.imageUrl} alt={p.name} />
      </div>

      <div className="product-body">
        <div className="row space">
          <div className="product-name">{p.name}</div>
          <div className="product-price">฿{Number(p.price).toFixed(2)}</div>
        </div>

        {p.description ? <div className="muted small">{p.description}</div> : null}

        <div className="row space mt">
          <button className="btn" onClick={() => onView(p.id)}>
            View
          </button>

          <button
            className={`btn btn-primary ${disableAdd ? "btn-disabled" : ""}`}
            disabled={disableAdd}
            onClick={() => onAdd(p.id)}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
