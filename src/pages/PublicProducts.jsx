import React, { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";

const getId = (p) => p?.id || p?._id;

export default function PublicProducts({ products, onView, onAdd }) {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const visible = useMemo(() => {
    return (products || []).filter((p) => p?.isActive !== false);
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set();
    visible.forEach(p => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [visible]);

  const filtered = useMemo(() => {
    if (activeCategory === "ALL") return visible;
    return visible.filter(p => (p.category || "").trim() === activeCategory);
  }, [visible, activeCategory]);

  return (
    <div className="page">
      <div className="row buttonsss" style={{ gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        <button
          className={`btn ${activeCategory === "ALL" ? "btn-primary" : ""}`}
          onClick={() => setActiveCategory("ALL")}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c}
            className={`btn ${activeCategory === c ? "btn-primary" : ""}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <h2>Products</h2>

      <div className="grid">
        {filtered.map((p) => {
          const id = getId(p);
          const isSoldOut = !!p.isSoldOut;

          return (
            <div key={id} className="product-wrap">
              {isSoldOut && (
                <span className="pill pill-yellow soldout-badge">SOLD OUT</span>
              )}

              <ProductCard
                p={{ ...p, isSoldOut }}
                onView={(pid) => onView(pid)}
                onAdd={(pid) => onAdd(pid)}
              />
            </div>
          );
        })}
      </div>
      <br/><br/>
      <footer className="footer2">
        <div className="footer2-inner">
          <span className="muted small">Contact</span>

          <a className="footer2-phone" href="tel:+12345678900">
            +66 8382 4 4020
          </a>

          <span className="footer2-dot">•</span>

          <span className="muted small">Support 9:00–20:00</span>
        </div>
      </footer>
      <br/>
    </div>
  );
}