import React from "react";
import logo from "../assets/img/logo.png";

export default function CustomerNavbar({ onOpenStaffLogin }) {
  return (
    <div className="navbar">
      <div className="brand">
        <img src={logo} alt="logo" className="logo" />
      </div>

      <div className="row">
        <button className="btn btn-primary" onClick={onOpenStaffLogin}>
          Staff Login
        </button>
      </div>
    </div>
  );
}
