import React from "react";
import Modal from "./Modal.jsx";
import { currency } from "../lib/utils.js";

export default function ProductDetailModal({ open, onClose, product, onAdd }) {
  if (!product) return null;

  const isInactive = !product?.isActive;
  const isSoldOut = !!product?.isSoldOut;

  const disableAdd = isInactive || isSoldOut;

  const addLabel = isSoldOut
    ? "Sold Out"
    : isInactive
      ? "Not available"
      : "Add to Cart";

  return (
    <Modal open={open} title={product.name} onClose={onClose}>
      <div className="stack">
        <img
          className="detail-img"
          src={product.imageUrl}
          alt={product.name}
        />

        {product.description ? (
          <div className="muted mt" style={{ lineHeight: 1.6 }}>
            {product.description}
          </div>
        ) : null}

        <div className="divider" />

        <div className="grid2">
          <div>
            <b>Price:</b> {currency(product.price)}
          </div>
          <div>
            <b>Category:</b> {product.category}
          </div>
        </div>

        {product.madeWith && product.madeWith.length > 0 ? (
          <>
            <div className="divider" />
            <div>
              <div className="title small">Made With</div>
              <div className="made-with-list">
                {product.madeWith.map((item, idx) => (
                  <span key={idx} className="ingredient-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <div className="row space mt">
          <button className="btn" onClick={onClose}>
            Close
          </button>

          <button
            className={`btn btn-primary ${disableAdd ? "btn-disabled" : ""}`}
            disabled={disableAdd}
            onClick={() => onAdd(product.id)}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
