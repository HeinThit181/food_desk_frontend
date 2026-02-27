import React, { useState } from "react";
import Modal from "./Modal.jsx";

function Field({ label, children }) {
  return (
    <label className="field">
      <div className="label">{label}</div>
      {children}
    </label>
  );
}

export default function StaffLoginModal({ open, onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) return;
    onLogin(email, password);
  };

  return (
    <Modal open={open} title="Staff Login" onClose={onClose}>
      <div className="stack">
        <Field label="Email">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Password">
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <div className="row space mt">
          <button className="btn" onClick={() => { setEmail(""); setPassword(""); }}>
            Clear
          </button>
          <button className="btn btn-primary" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    </Modal>
  );
}
