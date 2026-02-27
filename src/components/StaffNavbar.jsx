import React, { useEffect, useState } from "react";
import logo from "../assets/img/logo.png";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "zones", label: "Delivery Zones" },
  { key: "orders", label: "Orders" },
];

export default function StaffNavbar({ staff, staffPage, setStaffPage, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [staffPage]);

  return (
    <>
      <div className="navbar">
        <div className="brand">
          <img src={logo} alt="logo" className="logo" />
        </div>


        <div className="row staff-tabs staff-tabs-desktop">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${staffPage === t.key ? "tab-active" : ""}`}
              onClick={() => setStaffPage(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="row staff-right staff-text">
          <div className="muted small staff-name">Staff: {staff.name}</div>
          <button className="btn staff-logout" onClick={onLogout}>
            Logout
          </button>


          <button
            className="hamburger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            title="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="drawer-backdrop" onMouseDown={() => setMenuOpen(false)}>
          <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>
            <div className="row space">
              <div className="title">Menu</div>
              <button className="btn" onClick={() => setMenuOpen(false)}>
                Close
              </button>
            </div>

            <div className="muted small mt">Staff: {staff.name}</div>

            <div className="divider" />

            <div className="stack">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`tab tab-block ${staffPage === t.key ? "tab-active" : ""}`}
                  onClick={() => setStaffPage(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="divider" />

            <button className="btn btn-primary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
