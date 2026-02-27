export const currency = (n) => `฿${Number(n || 0).toFixed(2)}`;

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const nowISO = () => new Date().toISOString();

export const calcDeliveryFee = (address, zones) => {
  const a = (address || "").toLowerCase();
  const match = zones.find(
    (z) =>
      z.isActive &&
      z.areaKeywords.some((k) => a.includes(String(k).toLowerCase()))
  );
  return match ? match.fee : null;
};
