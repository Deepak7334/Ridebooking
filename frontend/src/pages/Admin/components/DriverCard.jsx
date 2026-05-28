import React from "react";

/**
 * Admin dashboard-compatible DriverCard.
 *
 * Notes:
 * - This component is intentionally defensive: fields/actions are optional.
 * - It won't break compilation if the parent does not pass certain props.
 */
export default function DriverCard({
  driver,
  expanded,
  onToggleExpand,
  busy,
  onApprove,
  onReject,
  onDelete,
}) {
  if (!driver) return null;

  const {
    _id,
    name,
    phone,
    email,
    vehicleType,
    vehicleNumber,
    docsVerified,
    isActive,
    isOnline,
    averageRating,
    totalRatings,
    createdAt,
    documents,
    walletBalance,
    userId,
  } = driver;

  const showPending = !docsVerified && isActive !== false;
  const showSuspended = isActive === false;
  const isVerified = !!docsVerified;

  const badgeStyle = (() => {
    if (isVerified) {
      return {
        background: "rgba(74,222,128,.15)",
        color: "#4ade80",
        border: "1px solid rgba(74,222,128,.3)",
      };
    }
    if (showSuspended) {
      return {
        background: "rgba(248,113,113,.12)",
        color: "#f87171",
        border: "1px solid rgba(248,113,113,.25)",
      };
    }
    return {
      background: "rgba(251,191,36,.12)",
      color: "#fbbf24",
      border: "1px solid rgba(251,191,36,.25)",
    };
  })();

  const badgeText = isVerified ? "✅ Verified" : showSuspended ? "🚫 Suspended" : "⏳ Pending";

  const busyKey = (k) => (busy && _id ? busy[_id] === k : false);

  const canApprove = typeof onApprove === "function" && !isVerified && isActive !== false;
  const canSuspend = typeof onReject === "function" && isVerified && isActive !== false;
  const canReinstate = typeof onApprove === "function" && isActive === false;
  const canReject = typeof onReject === "function" && !isVerified && isActive !== false;
  const canDelete = typeof onDelete === "function";

  const hero = (() => {
    if (vehicleType === "car") return "🚗";
    if (vehicleType === "bike") return "🏍️";
    if (vehicleType === "bike/scooter") return "🛵";
    if (vehicleType === "bike" || vehicleType === "scooter") return "🛵";
    if (vehicleType === "auto") return "🚕";
    if (vehicleType === "van") return "🚐";
    return "🚙";
  })();

  const heroBg = isVerified ? "rgba(74,222,128,.1)" : showSuspended ? "rgba(248,113,113,.08)" : "rgba(251,191,36,.1)";

  const handleToggle = () => {
    if (typeof onToggleExpand === "function") onToggleExpand(_id);
  };

  const docList = Array.isArray(documents) ? documents : [];

  return (
    <div className="card fade-up" style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: 16 }}>
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: heroBg }}
          aria-hidden="true"
        >
          {hero}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-white font-semibold text-[15px] truncate">{name || "—"}</p>
            <span className="badge shrink-0" style={badgeStyle}>
              {badgeText}
            </span>
            {isOnline && (
              <span
                className="badge shrink-0"
                style={{ background: "rgba(74,222,128,.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,.2)" }}
              >
                💻 Online
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-white/35 text-xs flex-wrap">
            {phone && (
              <span className="flex items-center gap-1">📞 {phone}</span>
            )}
            {vehicleNumber && (
              <span>📌 {String(vehicleNumber).toUpperCase()}</span>
            )}
            {vehicleType && <span>🚘 {vehicleType}</span>}
            {averageRating > 0 && (
              <span>
                ⭐ {averageRating} ({totalRatings || 0})
              </span>
            )}
            <span className="text-white/20">Joined {createdAt ? new Date(createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
          </div>

          {expanded === _id && (
            <div className="mt-3 pt-3 border-t border-white/[.06] space-y-3 fade-up">
              {docList.length > 0 && (
                <div>
                  <p className="text-white/30 text-[10px] uppercase font-semibold tracking-widest mb-2">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {docList.map((doc, idx) => {
                      const docType = doc?.docType || doc?.type || "DOC";
                      const url = doc?.url || doc?.path;
                      // Backend uses uploads with absolute URLs. Keep it flexible.
                      const href = url && url.startsWith("http") ? url : url ? `http://localhost:5001${url}` : null;
                      return href ? (
                        <a
                          key={idx}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-white/10"
                          style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)" }}
                        >
                          👁️ {String(docType).toUpperCase()}
                        </a>
                      ) : (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", color: "rgba(255,255,255,.4)" }}
                        >
                          🗂️ {String(docType).toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "Email", value: email || "—" },
                  { label: "Wallet", value: walletBalance != null ? `₹${walletBalance}` : "₹0" },
                  { label: "Ratings", value: `${totalRatings || 0} total` },
                  { label: "UserId", value: userId || _id || "—" },
                ]
                  .slice(0, 3)
                  .map((f) => (
                    <div key={f.label} className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,.03)" }}>
                      <p className="text-white/25 text-[10px] uppercase">{f.label}</p>
                      <p className="text-white/70 text-xs font-medium mt-0.5 truncate">{f.value}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleToggle}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
          style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}
          aria-label={expanded === _id ? "Collapse" : "Expand"}
          type="button"
        >
          <span style={{ display: "inline-block", transform: expanded === _id ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s ease", color: "rgba(255,255,255,.65)" }}>
            ›
          </span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {canApprove && (
          <button
            onClick={() => onApprove(_id)}
            disabled={!!busyKey("approve")}
            className="flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            style={{ background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80" }}
            type="button"
          >
            {busyKey("approve") ? "..." : "✅ Approve"}
          </button>
        )}

        {canSuspend && (
          <button
            onClick={() => onReject(_id)}
            disabled={!!busyKey("reject")}
            className="flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            style={{ background: "rgba(251,146,60,.1)", border: "1px solid rgba(251,146,60,.25)", color: "#fb923c" }}
            type="button"
          >
            {busyKey("reject") ? "..." : "🚫 Suspend"}
          </button>
        )}

        {canReinstate && (
          <button
            onClick={() => onApprove(_id)}
            disabled={!!busyKey("approve")}
            className="flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            style={{ background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80" }}
            type="button"
          >
            {busyKey("approve") ? "..." : "♻️ Reinstate"}
          </button>
        )}

        {canReject && (
          <button
            onClick={() => onReject(_id)}
            disabled={!!busyKey("reject")}
            className="flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.22)", color: "#f87171" }}
            type="button"
          >
            {busyKey("reject") ? "..." : "❌ Reject"}
          </button>
        )}

        {canDelete && (
          <button
            onClick={() => onDelete(_id)}
            disabled={!!busyKey("delete")}
            title="Delete permanently"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 hover:bg-red-900/30"
            style={{ background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.15)", color: "rgba(248,113,113,.6)" }}
            type="button"
          >
            {busyKey("delete") ? "..." : "🗑️"}
          </button>
        )}
      </div>
    </div>
  );
}

