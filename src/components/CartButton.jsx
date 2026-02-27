import React from "react";

export default function CartButton({ count, onClick }) {
  return (
    <button className="cart-fab" onClick={onClick} title="Open cart">
      <i class="fa-solid fa-cart-shopping icon"></i>
      <span className="cart-count">{count}</span>
    </button>
  );
}
