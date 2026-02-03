import React, { useMemo, useState } from "react";

const peso = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number.isFinite(n) ? n : 0
  );

const clampNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function KakeiboPage() {
  const [sources, setSources] = useState([
    { id: "bpi", name: "BPI", received: false, amount: "" },
    { id: "gcash", name: "GCash", received: false, amount: "" },
  ]);

  const [mode, setMode] = useState("amount"); // "amount" | "percent"
  const [funds, setFunds] = useState({ ef: "", sf: "", spending: "", fun: "" });

  const fundBanks = {
    ef: "EF-bank",
    sf: "SF-bank / GSave",
    spending: "spend-bank",
    fun: "spend-bank",
  };

  const [toast, setToast] = useState(null);
  const [doneSummary, setDoneSummary] = useState(null);

  const totalIncome = useMemo(() => {
    return sources.reduce((sum, s) => {
      if (!s.received) return sum;
      const amt = clampNumber(s.amount);
      return sum + (amt > 0 ? amt : 0);
    }, 0);
  }, [sources]);

  const step1Valid = totalIncome > 0;

  const fundsAsAmount = useMemo(() => {
    if (mode === "amount") {
      return {
        ef: clampNumber(funds.ef),
        sf: clampNumber(funds.sf),
        spending: clampNumber(funds.spending),
        fun: clampNumber(funds.fun),
      };
    }
    const toAmt = (p) => (totalIncome * clampNumber(p)) / 100;
    return {
      ef: toAmt(funds.ef),
      sf: toAmt(funds.sf),
      spending: toAmt(funds.spending),
      fun: toAmt(funds.fun),
    };
  }, [funds, mode, totalIncome]);

  const allocatedTotal = useMemo(() => {
    return (
      fundsAsAmount.ef +
      fundsAsAmount.sf +
      fundsAsAmount.spending +
      fundsAsAmount.fun
    );
  }, [fundsAsAmount]);

  const remaining = useMemo(() => totalIncome - allocatedTotal, [
    totalIncome,
    allocatedTotal,
  ]);

  const step1Errors = useMemo(() => {
    const errs = [];
    if (!sources.some((s) => s.received && clampNumber(s.amount) > 0)) {
      errs.push("At least 1 source must be marked received with an amount > 0.");
    }
    for (const s of sources) {
      if (s.received && clampNumber(s.amount) <= 0) {
        errs.push(`${s.name}: amount must be > 0 if received is ON.`);
      }
    }
    return errs;
  }, [sources]);

  const step2Errors = useMemo(() => {
    const errs = [];
    if (!step1Valid) {
      errs.push("Step 2 is locked until Step 1 has a valid total income.");
      return errs;
    }

    if (mode === "amount" && allocatedTotal > totalIncome + 0.0001) {
      errs.push("Allocated total cannot exceed total income.");
    }

    if (mode === "percent") {
      const pctTotal =
        clampNumber(funds.ef) +
        clampNumber(funds.sf) +
        clampNumber(funds.spending) +
        clampNumber(funds.fun);
      if (pctTotal > 100.0001) errs.push("Total percent cannot exceed 100%.");
    }

    return errs;
  }, [step1Valid, mode, funds, allocatedTotal, totalIncome]);

  const canDone = step2Errors.length === 0;

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2500);
  };

  const updateSource = (id, patch) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSource = () => {
    const name = prompt("Enter new source name (e.g., Maya, UnionBank):");
    if (!name) return;
    const id = `${name}`.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setSources((prev) => [...prev, { id, name, received: false, amount: "" }]);
    showToast("success", `Added source: ${name}`);
  };

  const removeSource = (id) => {
    const src = sources.find((s) => s.id === id);
    if (!src) return;
    if (!confirm(`Remove source "${src.name}"?`)) return;
    setSources((prev) => prev.filter((s) => s.id !== id));
    showToast("success", `Removed source: ${src.name}`);
  };

  const saveStep1Local = () => {
    if (step1Errors.length) {
      showToast("error", "Fix Step 1 errors first.");
      return;
    }
    setDoneSummary(null);
    showToast("success", "Step 1 saved (local only) ✅");
  };

  const doneStep2Local = () => {
    if (!canDone) {
      showToast("error", "Fix Step 2 errors first.");
      return;
    }
    setDoneSummary({ ...fundsAsAmount });
    showToast("success", "DONE! (local only) 🎉");
  };

  const resetAll = () => {
    setSources((prev) => prev.map((s) => ({ ...s, received: false, amount: "" })));
    setFunds({ ef: "", sf: "", spending: "", fun: "" });
    setMode("amount");
    setDoneSummary(null);
    showToast("success", "Reset complete");
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Kakeibo</h1>
          <div style={styles.subtitle}>Single-page: Step 1 + Step 2 (Frontend-only)</div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.summaryChip}>
            <div style={styles.chipLabel}>Total Income</div>
            <div style={styles.chipValue}>{peso(totalIncome)}</div>
          </div>
          <button style={styles.ghostBtn} onClick={resetAll}>
            Reset
          </button>
        </div>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Step 1: Money Allocation (Income)</h2>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.ghostBtn} onClick={addSource}>
              + Add source
            </button>

            <button
              style={{
                ...styles.primaryBtn,
                opacity: step1Errors.length === 0 ? 1 : 0.5,
                cursor: step1Errors.length === 0 ? "pointer" : "not-allowed",
              }}
              onClick={saveStep1Local}
              disabled={step1Errors.length !== 0}
            >
              Save Step 1
            </button>
          </div>
        </div>

        <div style={styles.grid}>
          {sources.map((s) => (
            <div key={s.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.cardTitle}>{s.name}</div>
                  <div style={styles.cardHint}>
                    Prompt: Is {s.name} received [budget] amount?
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={styles.toggleWrap}>
                    <input
                      type="checkbox"
                      checked={s.received}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateSource(s.id, { received: checked, amount: checked ? s.amount : "" });
                      }}
                    />
                    <span style={{ marginLeft: 8 }}>{s.received ? "Yes" : "No"}</span>
                  </label>

                  <button
                    title="Remove source"
                    style={styles.iconBtn}
                    onClick={() => removeSource(s.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div style={styles.fieldRow}>
                <label style={styles.label}>Amount received (₱)</label>
                <input
                  style={{
                    ...styles.input,
                    backgroundColor: s.received ? "white" : "#f3f4f6",
                  }}
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!s.received}
                  value={s.amount}
                  onChange={(e) => updateSource(s.id, { amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {s.received && clampNumber(s.amount) <= 0 && (
                <div style={styles.errorText}>Amount must be greater than 0.</div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.inlineSummary}>
          <div>
            <strong>Sources received:</strong> {sources.filter((s) => s.received).length}
          </div>
          <div>
            <strong>Total income:</strong> {peso(totalIncome)}
          </div>
        </div>

        {step1Errors.length > 0 && (
          <div style={styles.errorBox}>
            <div style={styles.errorTitle}>Step 1 needs attention:</div>
            <ul style={{ margin: "8px 0 0 18px" }}>
              {step1Errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>Step 2: EF & SF Allocation</h2>

          <div style={styles.modeSwitch}>
            <button
              onClick={() => setMode("amount")}
              style={{ ...styles.modeBtn, ...(mode === "amount" ? styles.modeBtnActive : null) }}
            >
              Amount (₱)
            </button>
            <button
              onClick={() => setMode("percent")}
              style={{ ...styles.modeBtn, ...(mode === "percent" ? styles.modeBtnActive : null) }}
            >
              Percent (%)
            </button>
          </div>
        </div>

        {!step1Valid && (
          <div style={styles.lockBox}>
            Step 2 is locked. Complete Step 1 first (at least 1 received source with amount &gt; 0).
          </div>
        )}

        <div
          style={{
            opacity: step1Valid ? 1 : 0.5,
            pointerEvents: step1Valid ? "auto" : "none",
          }}
        >
          <div style={styles.fundGrid}>
            <FundRow
              label="Emergency Fund"
              sublabel={fundBanks.ef}
              mode={mode}
              value={funds.ef}
              onChange={(v) => setFunds((p) => ({ ...p, ef: v }))}
              computedAmount={fundsAsAmount.ef}
            />
            <FundRow
              label="Sinking Fund"
              sublabel={fundBanks.sf}
              mode={mode}
              value={funds.sf}
              onChange={(v) => setFunds((p) => ({ ...p, sf: v }))}
              computedAmount={fundsAsAmount.sf}
            />
            <FundRow
              label="Spending Fund"
              sublabel={fundBanks.spending}
              mode={mode}
              value={funds.spending}
              onChange={(v) => setFunds((p) => ({ ...p, spending: v }))}
              computedAmount={fundsAsAmount.spending}
            />
            <FundRow
              label="Fun Fund"
              sublabel={fundBanks.fun}
              mode={mode}
              value={funds.fun}
              onChange={(v) => setFunds((p) => ({ ...p, fun: v }))}
              computedAmount={fundsAsAmount.fun}
            />
          </div>

          <div style={styles.summaryPanel}>
            <div style={styles.summaryRow}>
              <span>Total Income</span>
              <strong>{peso(totalIncome)}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Total Allocated</span>
              <strong>{peso(allocatedTotal)}</strong>
            </div>
            <div style={styles.summaryRow}>
              <span>Remaining</span>
              <strong style={{ color: remaining < 0 ? "#b91c1c" : "inherit" }}>
                {peso(remaining)}
              </strong>
            </div>

            {step2Errors.length > 0 && (
              <div style={styles.errorBox}>
                <div style={styles.errorTitle}>Step 2 needs attention:</div>
                <ul style={{ margin: "8px 0 0 18px" }}>
                  {step2Errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              style={{
                ...styles.primaryBtn,
                width: "100%",
                marginTop: 12,
                opacity: canDone ? 1 : 0.5,
                cursor: canDone ? "pointer" : "not-allowed",
              }}
              onClick={doneStep2Local}
              disabled={!canDone}
            >
              DONE
            </button>
          </div>
        </div>

        {doneSummary && (
          <div style={styles.successBox}>
            <div style={styles.successTitle}>Yeyyy! You have now 🎉</div>
            <div style={styles.successGrid}>
              <SummaryItem label="Emergency Fund" value={peso(doneSummary.ef)} />
              <SummaryItem label="Sinking Fund" value={peso(doneSummary.sf)} />
              <SummaryItem label="Spending Fund" value={peso(doneSummary.spending)} />
              <SummaryItem label="Fun Fund" value={peso(doneSummary.fun)} />
            </div>
          </div>
        )}
      </section>

      {toast && (
        <div
          style={{
            ...styles.toast,
            borderColor: toast.type === "error" ? "#ef4444" : "#22c55e",
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={styles.footer}>
        Frontend-only version: no API, no Google Sheets yet. Next step is wiring Save/DONE to Express.
      </div>
    </div>
  );
}









function FundRow({ label, sublabel, mode, value, onChange, computedAmount }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div>
          <div style={styles.cardTitle}>{label}</div>
          <div style={styles.cardHint}>{sublabel}</div>
        </div>
      </div>

      <div style={styles.fieldRow}>
        <label style={styles.label}>
          {mode === "amount" ? "Amount (₱)" : "Percent (%)"}
        </label>
        <input
          style={styles.input}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "amount" ? "0.00" : "0"}
        />
      </div>

      <div style={styles.miniComputed}>
        Computed: <strong>{peso(computedAmount)}</strong>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={styles.summaryItem}>
      <div style={styles.summaryItemLabel}>{label}</div>
      <div style={styles.summaryItemValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 980,
    margin: "24px auto",
    padding: "0 16px 40px",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111827",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  title: { margin: 0, fontSize: 32, lineHeight: 1.1 },
  subtitle: { marginTop: 6, color: "#6b7280" },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  summaryChip: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "10px 12px",
    minWidth: 170,
    background: "#fff",
  },
  chipLabel: { fontSize: 12, color: "#6b7280" },
  chipValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  ghostBtn: {
    border: "1px solid #e5e7eb",
    background: "white",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
  },
  iconBtn: {
    border: "1px solid #e5e7eb",
    background: "white",
    borderRadius: 10,
    padding: "6px 9px",
    cursor: "pointer",
    fontWeight: 800,
  },
  section: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: { margin: 0, fontSize: 18 },
  primaryBtn: {
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },
  fundGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
    alignItems: "start",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: { fontWeight: 800, fontSize: 15 },
  cardHint: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  toggleWrap: {
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    userSelect: "none",
  },
  fieldRow: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "#374151" },
  input: {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  color: "#111827",          // ✅ text color (dark)
  backgroundColor: "white",  // ✅ ensure contrast
},

  errorText: { marginTop: 8, color: "#b91c1c", fontSize: 12 },
  inlineSummary: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #f3f4f6",
    color: "#374151",
  },
  summaryPanel: {
    marginTop: 12,
    borderTop: "1px solid #f3f4f6",
    paddingTop: 12,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
  },
  errorBox: {
    marginTop: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    borderRadius: 14,
    padding: 12,
    color: "#7f1d1d",
  },
  errorTitle: { fontWeight: 800 },
  lockBox: {
    marginBottom: 12,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    borderRadius: 14,
    padding: 12,
    color: "#374151",
  },
  successBox: {
    marginTop: 14,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    borderRadius: 18,
    padding: 16,
  },
  successTitle: { fontWeight: 900, fontSize: 16, marginBottom: 10 },
  successGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 10,
  },
  summaryItem: {
    border: "1px solid #dcfce7",
    background: "white",
    borderRadius: 14,
    padding: 12,
  },
  summaryItemLabel: { fontSize: 12, color: "#166534" },
  summaryItemValue: { fontSize: 16, fontWeight: 900, marginTop: 4 },
  modeSwitch: { display: "flex", gap: 8 },
  modeBtn: {
    border: "1px solid #e5e7eb",
    background: "white",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    color: "#111827",
  },
  modeBtnActive: {
    background: "#111827",
    color: "white",
    borderColor: "#111827",
  },
  miniComputed: { marginTop: 10, fontSize: 12, color: "#6b7280" },
  toast: {
    position: "fixed",
    bottom: 18,
    right: 18,
    background: "white",
    border: "2px solid #22c55e",
    borderRadius: 14,
    padding: "12px 14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    maxWidth: 360,
    zIndex: 9999,
    fontWeight: 700,
  },
  footer: {
    marginTop: 14,
    color: "#6b7280",
    fontSize: 12,
  },
};
