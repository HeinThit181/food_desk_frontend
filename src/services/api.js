const API_BASE = "/api";

// Safely parse JSON — if the server returns an HTML error page, give a readable message
async function safeJson(res) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        // Server returned HTML (e.g. 413 Payload Too Large, 500 error page)
        const status = res.status;
        throw new Error(`Server error (${status}): Response was not JSON. The image may be too large, or the server encountered an error.`);
    }
}

const mapId = (item) => {
    if (!item) return item;
    if (Array.isArray(item)) return item.map(mapId);
    if (item._id && !item.id) {
        return { ...item, id: item._id };
    }
    return item;
};

export const api = {
    getProducts: async () => {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch");
        return mapId(data);
    },
    createProduct: async (product) => {
        const res = await fetch(`${API_BASE}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.error || "Failed to create product");
        return mapId(data);
    },
    updateProduct: async (id, updates) => {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.error || "Failed to update product");
        return mapId(data);
    },
    deleteProduct: async (id) => {
        const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to delete product");
        }
    },

    getZones: async () => {
        const res = await fetch(`${API_BASE}/delivery-zones`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch zones");
        return mapId(data);
    },
    createZone: async (zone) => {
        const res = await fetch(`${API_BASE}/delivery-zones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(zone),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create zone");
        return mapId(data);
    },
    updateZone: async (id, updates) => {
        const res = await fetch(`${API_BASE}/delivery-zones/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update zone");
        return mapId(data);
    },
    deleteZone: async (id) => {
        const res = await fetch(`${API_BASE}/delivery-zones/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to delete zone");
        }
    },

    getOrders: async () => {
        const res = await fetch(`${API_BASE}/orders`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch orders");
        return mapId(data);
    },
    createOrder: async (order) => {
        const res = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create order");
        return mapId(data);
    },
    updateOrder: async (id, updates) => {
        const res = await fetch(`${API_BASE}/orders/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update order");
        return mapId(data);
    },
    deleteOrder: async (id) => {
        const res = await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to delete order");
        }
    },

    getStaffUsers: async () => {
        const res = await fetch(`${API_BASE}/staff-users`);
        return mapId(await res.json());
    },
    login: async (email, password) => {
        const users = await api.getStaffUsers();
        const user = users.find(u => u.email === email && u.password === password);
        return user ? mapId(user) : null;
    }
};
