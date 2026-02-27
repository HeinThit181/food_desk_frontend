import React, { useEffect, useMemo, useState } from "react";

import CustomerNavbar from "./components/CustomerNavbar.jsx";
import StaffNavbar from "./components/StaffNavbar.jsx";
import StaffLoginModal from "./components/StaffLoginModal.jsx";

import CartButton from "./components/CartButton.jsx";
import CartModal from "./components/CartModal.jsx";
import CheckoutModal from "./components/CheckoutModal.jsx";
import ProductDetailModal from "./components/ProductDetailModal.jsx";
import PublicProducts from "./pages/PublicProducts.jsx";

import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import StaffProducts from "./pages/staff/StaffProducts.jsx";
import StaffZones from "./pages/staff/StaffZones.jsx";
import StaffOrders from "./pages/staff/StaffOrders.jsx";

import Modal from "./components/Modal.jsx";
import { api } from "./services/api.js";

function todayKey() {
  return new Date().toISOString().slice(0, 10); 
}
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

export default function App() {
  const [products, setProducts] = useState([]);
  const [zones, setZones] = useState([]);
  const [orders, setOrders] = useState([]);

  const [staff, setStaff] = useState({ isLoggedIn: false, name: "" });
  const [staffLoginOpen, setStaffLoginOpen] = useState(false);
  const [staffPage, setStaffPage] = useState("dashboard");

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const [cartNotice, setCartNotice] = useState("");

  const detailProduct = detailId ? products.find((p) => p.id === detailId) : null;

  const [guest, setGuest] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    customerNote: "",
  });

  const [closedPopupOpen, setClosedPopupOpen] = useState(false);
  const [closedPopupMsg, setClosedPopupMsg] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, z, o] = await Promise.all([
          api.getProducts(),
          api.getZones(),
          api.getOrders(),
        ]);
        setProducts(p);
        setZones(z);
        setOrders(o);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setCart((prev) => {
      const next = prev.filter((c) => {
        const p = products.find((x) => x.id === c.productId);
        return p && p.isActive && !p.isSoldOut;
      });

      if (next.length !== prev.length) {
        setCartNotice("Some items were removed because they are unavailable.");
        window.clearTimeout(window.__cartNoticeTimer);
        window.__cartNoticeTimer = window.setTimeout(() => setCartNotice(""), 3000);
      }

      return next;
    });
  }, [products]);

  useEffect(() => {
    if (staff.isLoggedIn) return; 

    const open = isShopOpenFromStorage();
    if (open) {
      setClosedPopupOpen(false);
      return;
    }

    const shownKey = `myfooddesk_closed_popup_shown_${todayKey()}`;
    if (localStorage.getItem(shownKey) === "true") return;

    const msg = closeMessageFromStorage();
    setClosedPopupMsg(msg);
    setClosedPopupOpen(true);

    localStorage.setItem(shownKey, "true");
  }, [staff.isLoggedIn]);

  const cartLines = useMemo(() => {
    return cart
      .map((c) => {
        const p = products.find((x) => x.id === c.productId);
        if (!p) return null;

        if (!p.isActive) return null;

        return {
          productId: c.productId,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          qty: c.qty,
          lineTotal: p.price * c.qty,
        };
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartCount = useMemo(() => cartLines.reduce((s, l) => s + l.qty, 0), [cartLines]);
  const subtotal = useMemo(() => cartLines.reduce((s, l) => s + l.lineTotal, 0), [cartLines]);

  const addToCart = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    if (!p.isActive || p.isSoldOut) return;

    setCart((prev) => {
      const found = prev.find((x) => x.productId === productId);
      if (found) {
        return prev.map((x) => (x.productId === productId ? { ...x, qty: x.qty + 1 } : x));
      }
      return [...prev, { productId, qty: 1 }];
    });
  };


  const updateQty = (productId, qty) => {
    const p = products.find((x) => x.id === productId);
    if (!p || !p.isActive || p.isSoldOut) {
      setCart((prev) => prev.filter((x) => x.productId !== productId));
      return;
    }

    const safeQty = Number.isFinite(qty) ? qty : 0;
    setCart((prev) =>
      prev
        .map((x) => (x.productId === productId ? { ...x, qty: safeQty } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const removeItem = (productId) => {
    setCart((prev) => prev.filter((x) => x.productId !== productId));
  };

  const openCheckoutFromCart = () => {
    const v = localStorage.getItem("myfooddesk_shop_open");
    const shopOpen = v === null ? true : v === "true";
    if (!shopOpen) return;

    if (cartLines.length === 0) return;
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const placeOrder = async (orderPayload) => {
    try {
      await api.createOrder(orderPayload);
      alert("Order placed successfully!");
      setCart([]);
      setCheckoutOpen(false);
      const freshOrders = await api.getOrders();
      setOrders(freshOrders);
    } catch (err) {
      alert("Failed to place order: " + err.message);
    }
  };

  const handleStaffLogin = async (email, password) => {
    try {
      const user = await api.login(email, password);
      setStaff({ isLoggedIn: true, name: user.name, role: user.role });
      setStaffLoginOpen(false);
      setStaffPage("dashboard");
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  const logoutStaff = () => {
    setStaff({ isLoggedIn: false, name: "" });
    setStaffPage("dashboard");
    setStaffLoginOpen(false);
  };

  const renderStaffPage = () => {
    switch (staffPage) {
      case "products":
        return <StaffProducts products={products} setProducts={setProducts} refresh={() => api.getProducts().then(setProducts)} />;
      case "zones":
        return <StaffZones zones={zones} setZones={setZones} refresh={() => api.getZones().then(setZones)} />;
      case "orders":
        return <StaffOrders orders={orders} setOrders={setOrders} zones={zones} refresh={() => api.getOrders().then(setOrders)} />;
      case "dashboard":
      default:
        return <StaffDashboard orders={orders} zones={zones} products={products} />;
    }
  };

  return (
    <div className="app">
      {staff.isLoggedIn ? (
        <StaffNavbar
          staff={staff}
          staffPage={staffPage}
          setStaffPage={setStaffPage}
          onLogout={logoutStaff}
        />
      ) : (
        <CustomerNavbar onOpenStaffLogin={() => setStaffLoginOpen(true)} />
      )}

      <div className="container">
        {staff.isLoggedIn ? (
          renderStaffPage()
        ) : (
          <PublicProducts
            products={products.filter((p) => p.isActive)} 
            onView={setDetailId}
            onAdd={addToCart}
          />
        )}
      </div>

      {!staff.isLoggedIn && (
        <Modal open={closedPopupOpen} title="Shop Closed" onClose={() => setClosedPopupOpen(false)}>
          <div className="stack" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}><i class="fa-solid fa-calendar-xmark"></i></div>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Shop Closed Today</div>
            <div className="muted" style={{ lineHeight: 1.6 }}>
              {closedPopupMsg}
            </div>
            <div className="row end mt">
              <button className="btn btn-primary" onClick={() => setClosedPopupOpen(false)}>
                OK
              </button>
            </div>
          </div>
        </Modal>
      )}

      {!staff.isLoggedIn && (
        <>
          <CartButton count={cartCount} onClick={() => setCartOpen(true)} />

          <CartModal
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            cartLines={cartLines}
            subtotal={subtotal}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            onCheckout={openCheckoutFromCart}
            notice={cartNotice}
          />

          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            cartLines={cartLines}
            zones={zones.filter((z) => z.isActive)}
            guest={guest}
            setGuest={setGuest}
            subtotal={subtotal}
            onPlaceOrder={placeOrder}
          />

          <ProductDetailModal
            open={!!detailProduct}
            onClose={() => setDetailId(null)}
            product={detailProduct}
            onAdd={addToCart}
          />
        </>
      )}

      <StaffLoginModal
        open={staffLoginOpen}
        onClose={() => setStaffLoginOpen(false)}
        onLogin={handleStaffLogin}
      />
    </div>
  );
}
