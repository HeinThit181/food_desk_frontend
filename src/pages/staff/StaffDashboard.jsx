import React, { useMemo, useState } from "react";
import { currency } from "../../lib/utils.js";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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

function weekOfMonthKey(dateISO) {
  const d = new Date(dateISO);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const day = d.getDate();
  const offset = first.getDay();
  const week = Math.floor((day + offset - 1) / 7) + 1;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-W${week}`;
}

function groupKey(dateISO, groupBy) {
  const d = new Date(dateISO);

  if (groupBy === "today" || groupBy === "daily") {
    const hour = String(d.getHours()).padStart(2, "0");
    return `${d.toISOString().slice(0, 10)} ${hour}:00`;
  }
  if (groupBy === "weekly") {
    return d.toISOString().slice(0, 10);
  }
  if (groupBy === "monthly") {
    return weekOfMonthKey(dateISO);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function calcOrderCost(order) {
  return order.items.reduce((s, it) => s + it.unitCostAtSale * it.qty, 0);
}

function inferCategory(productName) {
  const n = (productName || "").toLowerCase();
  if (n.includes("tea") || n.includes("drink")) return "Drinks";
  if (n.includes("rice")) return "Rice";
  if (n.includes("brownie") || n.includes("dessert")) return "Dessert";
  return "Other";
}

export default function StaffDashboard({ orders, zones, products }) {
  const [groupBy, setGroupBy] = useState("today");
  const [zoneId, setZoneId] = useState("ALL");
  const [productId, setProductId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const resetFilters = () => {
    setGroupBy("today");
    setZoneId("ALL");
    setProductId("ALL");
    setFrom("");
    setTo("");
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

  const completedBase = useMemo(() => orders.filter((o) => o.status === "COMPLETED"), [orders]);

  const filtered = useMemo(() => {
    let arr = [...completedBase];

    if (groupBy === "today") {
      const todayStr = new Date().toISOString().slice(0, 10);
      arr = arr.filter((o) => o.createdAt >= startOfDayISO(todayStr) && o.createdAt <= endOfDayISO(todayStr));
    }

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

    if (groupBy !== "today") {
      if (from) arr = arr.filter((o) => o.createdAt >= startOfDayISO(from));
      if (to) arr = arr.filter((o) => o.createdAt <= endOfDayISO(to));
    }

    return arr;
  }, [completedBase, zones, zoneId, productId, from, to, groupBy]);

  const hideBestSeller = productId !== "ALL";
  const hideSalesByCategory = productId !== "ALL";

  const kpis = useMemo(() => {
    const totalOrders = filtered.length;
    const totalSales = filtered.reduce((s, o) => s + o.totalAmount, 0);

    let totalCost = 0;
    filtered.forEach((o) => {
      (o.items || []).forEach((it) => {
        const prod = (products || []).find(p => (p.id || p._id) === it.productId);
        const costToMake = prod ? Number(prod.costToMake || 0) : 0;
        totalCost += costToMake * it.qty;
      });
    });

    const totalRevenue = totalSales - totalCost;

    const qtyByProduct = new Map();
    filtered.forEach((o) => {
      (o.items || []).forEach((it) => {
        qtyByProduct.set(it.productName, (qtyByProduct.get(it.productName) || 0) + it.qty);
      });
    });

    let bestSeller = "-";
    let bestQty = -1;
    qtyByProduct.forEach((q, name) => {
      if (q > bestQty) {
        bestQty = q;
        bestSeller = name;
      }
    });

    return { totalOrders, totalSales, totalCost, totalRevenue, bestSeller };
  }, [filtered]);

  const salesTrend = useMemo(() => {
    const m = new Map();
    filtered.forEach((o) => {
      const k = groupKey(o.createdAt, groupBy);
      m.set(k, (m.get(k) || 0) + o.totalAmount);
    });

    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ k, v }));
  }, [filtered, groupBy]);

  const salesByCategory = useMemo(() => {
    const m = new Map();
    filtered.forEach((o) => {
      (o.items || []).forEach((it) => {
        const prod = (products || []).find(p => (p.id || p._id) === it.productId);
        const cat = prod && prod.category ? prod.category : inferCategory(it.productName);
        const line = it.unitPrice * it.qty;
        m.set(cat, (m.get(cat) || 0) + line);
      });
    });

    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => ({ name, val }));
  }, [filtered, products]);

  const COLORS = ["#ec6425", "#561316", "#2D3748", "#718096", "#dbdada", "#eeddcd"];

  return (
    <div className="page">
      <h2>Dashboard</h2>

      <div className="card">
        <div className="title">Filters</div>

        <div className="grid filters-grid mt">
          <label className="field">
            <div className="label">Grouping</div>
            <select className="input" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
              <option value="today">Today's Sell</option>
              <option value="daily">Daily (by hour)</option>
              <option value="weekly">Weekly (by day)</option>
              <option value="monthly">Monthly (by week)</option>
              <option value="yearly">Yearly (by month)</option>
            </select>
          </label>

          <label className="field">
            <div className="label">Delivery Zone</div>
            <select className="input" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              <option value="ALL">All</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zoneName}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <div className="label">Product</div>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="ALL">All</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <div className="label">From</div>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>

          <label className="field">
            <div className="label">To</div>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>

        <div className="row end mt">
          <button className="btn btn-small" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>

      <div className="grid kpi-row mt">
        <div className="card">
          <div className="title">Total Sales</div>
          <div className="big">{currency(kpis.totalSales)}</div>
        </div>

        <div className="card">
          <div className="title">Total Orders</div>
          <div className="big">{kpis.totalOrders}</div>
        </div>

        {!hideBestSeller ? (
          <div className="card">
            <div className="title">Best Seller</div>
            <div className="big">{kpis.bestSeller}</div>
          </div>
        ) : (
          <div className="card kpi-muted">
            <div className="title">Best Seller</div>
            <div className="muted small mt">Hidden when Product filter is active</div>
          </div>
        )}

        <div className="card">
          <div className="title">Total Cost</div>
          <div className="big">{currency(kpis.totalCost)}</div>
        </div>

        <div className="card">
          <div className="title">Total Revenue</div>
          <div className="big">{currency(kpis.totalRevenue)}</div>
        </div>
      </div>

      <div className="card mt">
        <div className="row space">
          <div className="title">Sales Trend</div>
          <div className="muted small">Line graph</div>
        </div>

        <div className="divider" />

        {salesTrend.length === 0 ? (
          <div className="muted">No data with current filters.</div>
        ) : (
          <div style={{ width: '100%', height: 300, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbdada" />
                <XAxis
                  dataKey="k"
                  tickFormatter={(val) => val.length > 10 ? val.slice(5) : val}
                  tick={{ fill: '#718096', fontSize: 12 }}
                  axisLine={{ stroke: '#dbdada' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `฿${val}`}
                  tick={{ fill: '#718096', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  formatter={(value) => [`฿${value.toFixed(2)}`, 'Sales']}
                  labelStyle={{ color: '#2D3748', fontWeight: 'bold', marginBottom: 4 }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #dbdada', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#ec6425"
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: '#ec6425', stroke: '#fff', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#ec6425', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {!hideSalesByCategory ? (
        <div className="card mt">
          <div className="row space">
            <div className="title">Sales by Category</div>
            <div className="muted small">Pie chart</div>
          </div>

          <div className="divider" />

          {salesByCategory.length === 0 ? (
            <div className="muted">No data with current filters.</div>
          ) : (
            <div style={{ width: '100%', height: 350, display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <RechartsTooltip
                    formatter={(value) => [`฿${value.toFixed(2)}`, 'Sales']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #dbdada', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                  />
                  <Pie
                    data={salesByCategory}
                    dataKey="val"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="card mt kpi-muted">
          <div className="row space">
            <div className="title">Sales by Category</div>
            <div className="muted small">Hidden when Product filter is active</div>
          </div>
        </div>
      )}
    </div>
  );
}
