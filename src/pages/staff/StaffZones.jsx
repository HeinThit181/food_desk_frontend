import React, { useMemo, useState } from "react";
import Modal from "../../components/Modal.jsx";
import { api } from "../../services/api";

function emptyZone() {
  return { zoneName: "", fee: 0, isActive: true, areaKeywords: [] };
}

export default function StaffZones({ zones, setZones, refresh }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyZone());
  const [keywordsText, setKeywordsText] = useState("");

  const [q, setQ] = useState("");

  const startAdd = () => {
    setEditing(null);
    setForm(emptyZone());
    setKeywordsText("");
    setOpen(true);
  };

  const startEdit = (z) => {
    setEditing(z);
    setForm({
      zoneName: z.zoneName,
      fee: z.fee,
      isActive: z.isActive,
      areaKeywords: z.areaKeywords || [],
    });
    setKeywordsText((z.areaKeywords || []).join(", "));
    setOpen(true);
  };

  const filteredZones = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return zones;

    return zones.filter((z) => {
      const haystack = [
        z.zoneName,
        ...(z.areaKeywords || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(s);
    });
  }, [zones, q]);

  const save = async () => {
    if (!form.zoneName.trim()) return;

    const areaKeywords = keywordsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      areaKeywords,
      fee: Number(form.fee) || 0,
      zoneName: form.zoneName.trim(),
      isActive: !!form.isActive,
    };

    try {
      if (editing) {
        await api.updateZone(editing.id, payload);
      } else {
        await api.createZone(payload);
      }
      setOpen(false);
      refresh();
    } catch (err) {
      alert("Failed to save zone: " + err.message);
    }
  };

  const toggleActive = async (id) => {
    const z = zones.find(z => z.id === id);
    if (!z) return;
    await api.updateZone(id, { isActive: !z.isActive });
    refresh();
  };

  const deleteZone = async (id) => {
    if (!confirm("Delete this zone?")) return;
    try {
      await api.deleteZone(id);
      if (editing?.id === id) {
        setOpen(false);
        setEditing(null);
        setForm(emptyZone());
        setKeywordsText("");
      }
      refresh();
    } catch (err) {
      alert("Failed to delete zone: " + err.message);
    }
  };

  return (
    <div className="page">
      <h2>Delivery Zones</h2>

      <div className="card">
        <div className="row space items-center">
          <div className="title">Zone Management</div>
          <button className="btn btn-primary" onClick={startAdd}>
            + Add Zone
          </button>
        </div>

        <div className="mt">
          <input
            className="input"
            placeholder="Search by zone name or area keyword..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="divider" />

        <div className="grid staff-grid mt">
          {filteredZones.map((z) => (
            <div key={z.id} className="card stack">
              <div className="row space items-center">
                <div className="title" style={{ fontSize: 18 }}>{z.zoneName}</div>
                <span className={`pill ${z.isActive ? "pill-green" : "pill-gray"}`}>
                  {z.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="stack gap-xs">
                <div className="row gap-sm">
                  <div className="muted small">Fee:</div>
                  <b>฿{Number(z.fee).toFixed(2)}</b>
                </div>
                <div className="row gap-sm">
                  <div className="muted small">Keywords:</div>
                  <div className="small">{(z.areaKeywords || []).join(", ") || "None"}</div>
                </div>
              </div>

              <div className="divider mt-auto" />

              <div className="row gap-sm buttonsss">
                <button className="btn" onClick={() => startEdit(z)}>
                  Edit
                </button>
                <button className="btn" onClick={() => toggleActive(z.id)}>
                  {z.isActive ? "Deactivate" : "Activate"}
                </button>
                <button className="btn btn-danger" onClick={() => deleteZone(z.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={open}
        title={editing ? `Edit Zone (${editing.id})` : "Add Zone"}
        onClose={() => setOpen(false)}
      >
        <div className="stack">
          <label className="field">
            <div className="label">Zone name</div>
            <input
              className="input"
              value={form.zoneName}
              onChange={(e) =>
                setForm({ ...form, zoneName: e.target.value })
              }
            />
          </label>

          <label className="field">
            <div className="label">Delivery fee</div>
            <input
              className="input"
              type="number"
              value={form.fee}
              onChange={(e) =>
                setForm({ ...form, fee: Number(e.target.value) })
              }
            />
          </label>

          <label className="field">
            <div className="label">
              Area keywords (comma separated)
            </div>
            <input
              className="input"
              value={keywordsText}
              onChange={(e) =>
                setKeywordsText(e.target.value)
              }
              placeholder="e.g., Bangna, Sukhumvit"
            />
          </label>

          <label className="field">
            <div className="label">Status</div>
            <select
              className="input"
              value={form.isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(e) =>
                setForm({
                  ...form,
                  isActive: e.target.value === "ACTIVE",
                })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          <div className="row space mt">
            <button className="btn" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
