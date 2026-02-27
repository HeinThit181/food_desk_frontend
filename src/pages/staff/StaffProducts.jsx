import React, { useMemo, useState } from "react";
import Modal from "../../components/Modal.jsx";
import { api } from "../../services/api";

function parseMadeWith(text) {
  if (!text) return [];
  return String(text).split(',').map(s => s.trim()).filter(Boolean);
}

function emptyProduct() {
  return {
    name: "",
    description: "",
    price: 0,
    costToMake: 0,
    category: "",
    isActive: true,
    isSoldOut: false,
    imageUrl: "",
    madeWith: [],
  };
}

export default function StaffProducts({ products, setProducts, refresh }) {
  // ...
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct());

  const [madeWithText, setMadeWithText] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [categoryMode, setCategoryMode] = useState("existing"); 
  const [newCategory, setNewCategory] = useState("");

  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category && String(p.category).trim()) set.add(String(p.category).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return products.filter((p) => {
      const matchesSearch = !s
        ? true
        : [p.name, p.category, p.description].some((x) =>
          String(x || "").toLowerCase().includes(s)
        );

      const matchesCategory =
        categoryFilter === "ALL"
          ? true
          : String(p.category || "").toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, q, categoryFilter]);

  const startAdd = () => {
    setEditing(null);

    const next = emptyProduct();
    setForm(next);

    setMadeWithText("");
    setImagePreview("");
    setImageError("");

    if (categories.length > 0) {
      setCategoryMode("existing");
      setNewCategory("");
    } else {
      setCategoryMode("new");
      setNewCategory("");
    }

    setOpen(true);
  };

  const startEdit = (p) => {
    setEditing(p);

    const mw = Array.isArray(p.madeWith) ? p.madeWith : [];
    setMadeWithText(mw.join(", "));

    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      costToMake: p.costToMake,
      category: p.category || "",
      isActive: p.isActive !== undefined ? p.isActive : true,
      isSoldOut: !!p.isSoldOut,
      imageUrl: p.imageUrl || "",
      madeWith: mw,
    });

    setImagePreview(p.imageUrl || "");
    setImageError("");

    const hasCat = (p.category || "").trim();
    if (hasCat && categories.some((c) => c.toLowerCase() === hasCat.toLowerCase())) {
      setCategoryMode("existing");
      setNewCategory("");
    } else {
      setCategoryMode("new");
      setNewCategory(hasCat);
    }

    setOpen(true);
  };

  const finalizeCategory = () => {
    if (categoryMode === "existing") return (form.category || "").trim();
    return (newCategory || "").trim();
  };

  const deleteCategory = async (catName) => {
    if (!catName) return;
    if (!window.confirm(`Are you sure you want to delete the "${catName}" category? All products using it will be uncategorized.`)) return;

    const affected = products.filter(p => (p.category || "").trim() === catName);
    try {
      await Promise.all(affected.map(p => api.updateProduct(p.id || p._id, { category: "Other" }))); // Fallback to 'Other' or blank
      if (form.category === catName) setForm({ ...form, category: "" });
      refresh();
    } catch (err) {
      alert("Failed to delete category: " + err.message);
    }
  };

  const onPickImage = (file) => {
    setImageError("");
    if (!file) return;

    const maxBytes = 2 * 1024 * 1024;
    if (!file.type.startsWith("image/")) {
      setImageError("Please upload an image file (jpg/png/webp).");
      return;
    }
    if (file.size > maxBytes) {
      setImageError("Image is too large. Please use an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setImagePreview(dataUrl);
      setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.onerror = () => setImageError("Failed to read the image file.");
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview("");
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const save = async () => {
    const name = (form.name || "").trim();
    if (!name) return;

    const finalCategory = finalizeCategory();
    if (!finalCategory) return;

    if (!form.imageUrl) {
      setImageError("Please upload a product image.");
      return;
    }

    const finalMadeWith = parseMadeWith(madeWithText);

    const payload = {
      name,
      description: form.description,
      price: Number(form.price) || 0,
      costToMake: Number(form.costToMake) || 0,
      category: finalCategory,
      isActive: !!form.isActive,
      isSoldOut: !!form.isSoldOut,
      imageUrl: form.imageUrl,
      madeWith: finalMadeWith,
    };

    try {
      if (editing) {
        await api.updateProduct(editing.id, payload);
      } else {
        await api.createProduct(payload);
      }
      setOpen(false);
      refresh(); 
    } catch (err) {
      alert("Failed to save product: " + err.message);
    }
  };

  const toggleActive = async (id) => {
    const p = products.find(p => p.id === id || p._id === id);
    if (!p) return;
    await api.updateProduct(id, { isActive: !p.isActive });
    refresh();
  };

  const toggleSoldOut = async (id) => {
    const p = products.find(p => p.id === id || p._id === id);
    if (!p) return;
    await api.updateProduct(id, { isSoldOut: !p.isSoldOut });
    refresh();
  };

  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      if (editing?.id === id) {
        setOpen(false);
        setEditing(null);
      }
      refresh();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const categoryFilterLabel =
    categoryFilter === "ALL" ? "Filter: All Categories" : `Filter: ${categoryFilter}`;

  return (
    <div className="page">
      <h2>Products</h2>

      <div className="card">
        <div className="row space">
          <div className="title">Product Management</div>
          <div className="row">
            <button className="btn" onClick={() => setFilterOpen(true)}>
              {categoryFilterLabel}
            </button>
            <button className="btn btn-primary" onClick={startAdd}>
              + Add Product
            </button>
          </div>
        </div>

        <div className="mt">
          <input
            className="input"
            placeholder="Search by name, category, description..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="divider" />

        <div className="grid staff-grid mt">
          {filtered.map((p) => (
            <div key={p.id} className="card stack p-0 overflow-hidden">
              <img
                src={p.imageUrl}
                alt={p.name}
                style={{ width: '100%', height: 180, objectFit: 'cover' }}
              />
              <div className="stack p-md gap-sm">
                <div className="row space items-center">
                  <div className="title" style={{ fontSize: 18 }}>{p.name}</div>
                  <span className={`pill ${p.isActive ? "pill-green" : "pill-gray"}`}>
                    {p.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="muted small">
                  {p.category}
                </div>
                {p.isSoldOut && (
                  <div className="pill pill-yellow" style={{ alignSelf: 'flex-start', fontSize: 10 }}>SOLD OUT</div>
                )}
                <div className="muted small" style={{ minHeight: 40 }}>
                  {p.description || "No description"}
                </div>

                <div className="muted extra-small">
                  <b>Made with:</b> {Array.isArray(p.madeWith) ? p.madeWith.join(", ") : p.madeWith || "None"}
                </div>

                <div className="divider" />

                <div className="row space small">
                  <div className="muted">Price</div>
                  <b>฿{Number(p.price).toFixed(2)}</b>
                </div>
                <div className="row space small">
                  <div className="muted">Cost</div>
                  <b>฿{Number(p.costToMake).toFixed(2)}</b>
                </div>

                <div className="row gap-xs mt-sm flex-wrap buttonsss">
                  <button className="btn" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn" onClick={() => toggleActive(p.id || p._id)}>
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn" onClick={() => toggleSoldOut(p.id || p._id)}>
                    Mark {p.isSoldOut ? "Available" : "Sold Out"}
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteProduct(p.id || p._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={filterOpen} title="Filter by Category" onClose={() => setFilterOpen(false)}>
        <div className="stack">
          <label className="field">
            <div className="label">Category</div>
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="row space mt">
            <button
              className="btn"
              onClick={() => {
                setCategoryFilter("ALL");
                setFilterOpen(false);
              }}
            >
              Clear
            </button>
            <button className="btn btn-primary" onClick={() => setFilterOpen(false)}>
              Apply
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={open}
        title={editing ? `Edit Product (${editing.id})` : "Add Product"}
        onClose={() => setOpen(false)}
      >
        <div className="stack">
          <label className="field">
            <div className="label">Name</div>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="field">
            <div className="label">Description (optional)</div>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="field">
            <div className="label">Made With (comma separated)</div>
            <input
              className="input"
              value={madeWithText}
              onChange={(e) => setMadeWithText(e.target.value)}
              placeholder="e.g., Chicken, Chili Sauce, Garlic"
            />
            <div className="muted small mt">
              These will appear on the customer product detail page.
            </div>
          </label>

          <div className="card" style={{ borderStyle: "dashed" }}>
            <div className="title">Category</div>
            <div className="muted small mt">Select an existing category or create a new one.</div>

            <div className="row mt">
              <button
                className={`btn ${categoryMode === "existing" ? "btn-primary" : ""}`}
                onClick={() => setCategoryMode("existing")}
                type="button"
              >
                Use Existing
              </button>
              <button
                className={`btn ${categoryMode === "new" ? "btn-primary" : ""}`}
                onClick={() => setCategoryMode("new")}
                type="button"
              >
                Create New
              </button>
            </div>

            {categoryMode === "existing" ? (
              <label className="field mt">
                <div className="label">Existing Category</div>
                <div className="row">
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select...</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {form.category && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => deleteCategory(form.category)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </label>
            ) : (
              <label className="field mt">
                <div className="label">New Category Name</div>
                <input
                  className="input"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Noodles"
                />
              </label>
            )}
          </div>

          <div className="grid2">
            <label className="field">
              <div className="label">Selling price</div>
              <input
                className="input"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </label>

            <label className="field">
              <div className="label">Cost of making</div>
              <input
                className="input"
                type="number"
                value={form.costToMake}
                onChange={(e) => setForm({ ...form, costToMake: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="card" style={{ borderStyle: "dashed" }}>
            <div className="title">Product Image</div>
            <div className="muted small mt">Upload an image from your device (max 2MB).</div>

            <div
              className="upload-box mt"
              onClick={() => document.getElementById("productImageInput").click()}
            >
              <input
                id="productImageInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />

              {!imagePreview ? (
                <div className="upload-content">
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">
                    <b>Click to upload image</b>
                    <div className="muted small mt">JPG, PNG, WEBP — Max 2MB</div>
                  </div>
                </div>
              ) : (
                <div className="upload-preview-wrap">
                  <img src={imagePreview} alt="Preview" className="upload-preview" />
                  <div className="upload-overlay">
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {imageError ? <div className="error mt">{imageError}</div> : null}
          </div>

          <div className="grid2">
            <label className="field">
              <div className="label">Status</div>
              <select
                className="input"
                value={form.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === "ACTIVE" })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>

            <label className="field">
              <div className="label">Sold Out</div>
              <select
                className="input"
                value={form.isSoldOut ? "YES" : "NO"}
                onChange={(e) => setForm({ ...form, isSoldOut: e.target.value === "YES" })}
              >
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
            </label>
          </div>

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
