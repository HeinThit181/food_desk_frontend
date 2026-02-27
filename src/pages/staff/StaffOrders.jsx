import React, { useMemo, useState } from "react";
import { fmtDateTime, currency } from "../../lib/utils.js";
import Modal from "../../components/Modal.jsx";
import { api } from "../../services/api";

function calcTotalCost(order) {
  return order.items.reduce((s, it) => s + it.unitCostAtSale * it.qty, 0);
}
function calcRevenue(order) {
  return order.totalAmount - calcTotalCost(order);
}

function startOfDayISO(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function endOfDayISO(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); 
}

const ORDER_FLOW = ["CONFIRMED", "COOKING", "READY", "COMPLETED"];

function orderHasSchedule(order) {
  if (order.scheduledDateTime) return true;
  if (order.schedule?.date) return true;
  return false;
}

function fmtSchedule(order) {
  if (order.scheduledDateTime) {
    const d = new Date(order.scheduledDateTime);
    return `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  if (order.schedule?.date && order.schedule?.time) {
    return `${order.schedule.date} ${order.schedule.time}`;
  }
  return "ASAP";
}

function orderHasBulkPerDish(order) {
  return (order.items || []).some((it) => Number(it.qty) > 12);
}

function getScheduleDateKey(order) {
  if (order.scheduledDateTime) {
    return new Date(order.scheduledDateTime).toISOString().slice(0, 10);
  }
  if (order.schedule?.date) return order.schedule.date;
  return null;
}

function isScheduledForToday(order) {
  const d = getScheduleDateKey(order);
  if (!d) return false;
  return d === todayKey();
}

function isDueToday(order) {
  if (order.status === "COMPLETED" || order.status === "CANCELLED") return false;

  if (isScheduledForToday(order)) return true;

  if (!orderHasSchedule(order)) {
    const createdKey = new Date(order.createdAt).toISOString().slice(0, 10);
    return createdKey === todayKey();
  }
  return false;
}

function isScheduledQuickFilter(order) {
  if (order.status === "COMPLETED" || order.status === "CANCELLED") return false;
  return orderHasSchedule(order);
}

function isBulkQuickFilter(order) {
  if (order.status === "COMPLETED" || order.status === "CANCELLED") return false;
  return orderHasBulkPerDish(order);
}

function statusPillClass(status) {
  switch (status) {
    case "CONFIRMED":
      return "pill pill-blue";
    case "COOKING":
      return "pill pill-warn";
    case "READY":
      return "pill pill-green";
    case "COMPLETED":
      return "pill pill-gray";
    default:
      return "pill pill-gray";
  }
}


export default function StaffOrders({ orders, setOrders, zones, refresh }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("NEWEST");
  const [status, setStatus] = useState("ALL");
  const [zoneId, setZoneId] = useState("ALL");
  const [productId, setProductId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [shopOpen, setShopOpen] = useState(true);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeMsg, setCloseMsg] = useState("");

  const [expanded, setExpanded] = useState(new Set());
  const [quickFilter, setQuickFilter] = useState("NONE");

  React.useEffect(() => {
    const v = localStorage.getItem("myfooddesk_shop_open");
    if (v !== null) setShopOpen(v === "true");
    const m = localStorage.getItem("myfooddesk_shop_close_msg");
    if (m) setCloseMsg(m);
  }, []);

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const productOptions = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      (o.items || []).forEach((it) => {
        map.set(it.productId, it.productName);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  const filtered = useMemo(() => {
    let arr = [...orders];

    if (quickFilter === "TODAY") arr = arr.filter(isDueToday);
    if (quickFilter === "SCHEDULED") arr = arr.filter(isScheduledQuickFilter);
    if (quickFilter === "BULK") arr = arr.filter(isBulkQuickFilter);
    if (quickFilter === "COMPLETED") arr = arr.filter((o) => o.status === "COMPLETED");

    if (status !== "ALL") arr = arr.filter((o) => o.status === status);
    if (zoneId !== "ALL") {
      const zone = zones.find(z => z.id === zoneId);
      if (zone) {
        arr = arr.filter(o =>
          zone.areaKeywords.some(k => (o.deliveryAddress || "").toLowerCase().includes(k.toLowerCase()))
        );
      }
    }
    if (productId !== "ALL") {
      arr = arr.filter((o) => (o.items || []).some((it) => it.productId === productId));
    }
    if (from) arr = arr.filter((o) => o.createdAt >= startOfDayISO(from));
    if (to) arr = arr.filter((o) => o.createdAt <= endOfDayISO(to));

    if (q) {
      const low = q.toLowerCase();
      arr = arr.filter((o) => {
        const sid = String(o.id || o._id).toLowerCase();
        const cname = (o.customerName || "").toLowerCase();
        const items = (o.items || []).map((it) => it.productName.toLowerCase()).join(" ");
        return sid.includes(low) || cname.includes(low) || items.includes(low);
      });
    }

    arr.sort((a, b) => {
      const da = new Date(a.createdAt);
      const db = new Date(b.createdAt);
      return sort === "NEWEST" ? db - da : da - db;
    });

    const unfinished = arr.filter((o) => o.status !== "COMPLETED");
    const finished = arr.filter((o) => o.status === "COMPLETED");
    return [...unfinished, ...finished];
  }, [orders, zones, quickFilter, status, zoneId, productId, from, to, q, sort]);

  const nextStatus = (cur) => {
    const idx = ORDER_FLOW.indexOf(cur);
    if (idx < 0 || idx === ORDER_FLOW.length - 1) return cur;
    return ORDER_FLOW[idx + 1];
  };

  const advance = async (orderId) => {
    const order = orders.find((o) => o.id === orderId || o._id === orderId);
    if (!order) return;

    const nxt = nextStatus(order.status);
    if (nxt === order.status) return;

    try {
      await api.updateOrder(orderId, { status: nxt });
      refresh();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to permanently cancel and delete this order (and its payment)?")) return;
    try {
      await api.deleteOrder(orderId);
      refresh();
    } catch (err) {
      alert("Failed to cancel order: " + err.message);
    }
  };

  const toggleShop = () => {
    if (shopOpen) setCloseModalOpen(true);
    else {
      setShopOpen(true);
      localStorage.setItem("myfooddesk_shop_open", "true");
    }
  };

  const confirmCloseShop = () => {
    setShopOpen(false);
    localStorage.setItem("myfooddesk_shop_open", "false");
    localStorage.setItem("myfooddesk_shop_close_msg", closeMsg);
    const k = `myfooddesk_closed_popup_shown_${todayKey()}`;
    localStorage.removeItem(k);
    setCloseModalOpen(false);
  };

  const qbtn = (id) => `btn ${quickFilter === id ? "btn-primary" : ""}`;
  const clearQuickFilter = () => setQuickFilter("NONE");

  return (
    <div className="page">
      <h2>Orders</h2>

      <div className="card">
        <div className="row space">
          <div className="title">Order List</div>

          <button
            className={`btn ${shopOpen ? "btn-primary" : "btn-danger"}`}
            onClick={toggleShop}
            title={shopOpen ? "Shop is OPEN (click to close)" : "Shop is CLOSED (click to open)"}
          >
            {shopOpen ? "Shop: OPEN" : "Shop: CLOSED"}
          </button>
        </div>

        <div className="row mt" style={{ gap: 8, flexWrap: "wrap" }}>
          <button className={qbtn("TODAY")} onClick={() => setQuickFilter("TODAY")}>
            Today
          </button>
          <button className={qbtn("SCHEDULED")} onClick={() => setQuickFilter("SCHEDULED")}>
            Scheduled
          </button>
          <button className={qbtn("BULK")} onClick={() => setQuickFilter("BULK")}>
            Bulk
          </button>
          <button className={qbtn("COMPLETED")} onClick={() => setQuickFilter("COMPLETED")}>
            Completed
          </button>
          <button className="btn" onClick={clearQuickFilter}>
            Clear
          </button>
        </div>

        <div className="mt stack">
          <input
            className="input"
            placeholder="Search orders..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
          </select>
        </div>

        <div className="divider" />

        <div className="grid filters-grid">
          <label className="field">
            <div className="label">Status</div>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All</option>
              {ORDER_FLOW.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <div className="label">Delivery Zone</div>
            <select className="input" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              <option value="ALL">All</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.zoneName}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <div className="label">Product</div>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="ALL">All</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="divider" />

        <div className="table">
          <div className="trow thead">
            <div>Order</div>
            <div>Status</div>
            <div>Schedule</div>
            <div>Customer</div>
            <div>Note</div>
            <div>Zone/Fee</div>
            <div>Totals</div>
            <div>Actions</div>
          </div>

          {filtered.map((o) => {
            const nxt = nextStatus(o.status);
            const isOpen = expanded.has(o.id || o._id);
            const scheduled = !!o.scheduledDateTime;

            const bulk = orderHasBulkPerDish(o);
            const schedLabel = scheduled
              ? (fmtDateTime(o.scheduledDateTime).slice(0, 10) === todayKey() ? "Scheduled (today)" : "Scheduled (future)")
              : "No schedule";

            return (
              <div
                className="trow"
                key={o.id || o._id}
                style={{
                  borderRadius: 12,
                  border: "1px solid #eee",
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div className="mono">
                    <b>{String(o.id || o._id).slice(-6)}</b>
                  </div>
                  <div className="muted small">Created: {fmtDateTime(o.createdAt)}</div>
                </div>

                <div>
                  <span className={statusPillClass(o.status)}>{o.status}</span>
                </div>

                <div>
                  <div>
                    <b>{scheduled ? fmtDateTime(o.scheduledDateTime) : "ASAP"}</b>
                  </div>
                  <div className="muted small mt">
                    {schedLabel}
                    {bulk && <span className="pill pill-warn" style={{ marginLeft: 8 }}>BULK</span>}
                  </div>
                </div>

                <div>
                  <div>
                    <b>{o.customerName}</b>
                  </div>
                  <div className="muted small">{o.customerPhone}</div>
                  <div className="muted small">{o.deliveryAddress}</div>
                </div>

                <div>
                  <div className="muted small">{o.orderNote || o.note || "-"}</div>
                </div>

                <div>
                  <div className="muted small">Fee: {currency(o.deliveryFee)}</div>
                </div>

                <div>
                  <div className="muted small">
                    Total: <b>{currency(o.totalAmount)}</b>
                  </div>
                  <div className="muted small">
                    Items: <b>{o.items?.length || 0}</b>
                  </div>
                </div>

                <div className="row" style={{ gap: 8, flexDirection: "column", alignItems: "flex-start" }}>
                  <button className="btn btn-small btn-danger" onClick={() => cancelOrder(o.id || o._id)}>
                    Cancel
                  </button>
                  <button className="btn btn-small" onClick={() => toggleExpanded(o.id || o._id)}>
                    {isOpen ? "Hide items" : "View items"}
                  </button>
                  <button
                    className={`btn btn-small ${nxt === o.status ? "btn-disabled" : "btn-primary"}`}
                    disabled={nxt === o.status}
                    onClick={() => advance(o.id || o._id)}
                  >
                    {nxt === o.status ? "Done" : `→ ${nxt}`}
                  </button>
                </div>

                {isOpen && (
                  <div className="trow-sub" style={{ gridColumn: "1 / -1", marginTop: 10, background: "#f9f9f9", padding: 8, borderRadius: 8 }}>
                    <div className="muted small">
                      <b>Order Items:</b>
                      <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                        {(o.items || []).map((it, idx) => (
                          <li key={idx}>
                            {it.productName} × {it.qty} ({currency(it.unitPrice)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={closeModalOpen} title="Close Shop" onClose={() => setCloseModalOpen(false)}>
        <div className="stack">
          <label className="field">
            <div className="label">Closure Message</div>
            <textarea
              className="input"
              rows={3}
              value={closeMsg}
              onChange={(e) => setCloseMsg(e.target.value)}
              placeholder="e.g. Closed for the holidays..."
            />
          </label>
          <div className="row end mt">
            <button className="btn" onClick={() => setCloseModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmCloseShop}>Confirm Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
