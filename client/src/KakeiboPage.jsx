import React, { useMemo, useState } from "react";
import styles from "./pages/KakeiboPage.module.css"; // CSS Modules: styles.xxx are CLASS NAMES (strings)

/**
 * KakeiboPage (Page Component)
 * Purpose:
 * - Main screen that contains Step 1 (Income) + Step 2 (Funds) in one page.
 * - Holds shared state and calculations that Step 1 and Step 2 depend on.
 *
 * Future separation plan:
 * - Extract SourceCard (Step 1 card UI) into /components/SourceCard.jsx
 * - Extract FundRow (Step 2 per-fund row) into /components/FundRow.jsx
 * - Extract SummaryPanel (totals + remaining + DONE button) into /components/SummaryPanel.jsx
 * - Extract Toast into /components/Toast.jsx
 */

const peso = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number.isFinite(n) ? n : 0
  );

const clampNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function KakeiboPage() {
  /**
   * STEP 1 STATE — Income sources/cards
   * Purpose:
   * - Dynamic list of sources (BPI, GCash, etc.)
   * - Each source has: received? + amount
   *
   * Future extraction:
   * - Each item UI becomes a <SourceCard /> component
   */
  const [sources, setSources] = useState([
    { id: "bpi", name: "BPI", received: false, amount: "" },
    { id: "gcash", name: "GCash", received: false, amount: "" },
  ]);

  /**
   * STEP 2 STATE — Fund allocations
   * Purpose:
   * - Stores user input for EF/SF/Spending/Fun allocations
   * - "mode" controls whether the inputs represent Amount or Percent
   *
   * Future extraction:
   * - Each fund row becomes <FundRow />
   * - The totals + DONE area becomes <SummaryPanel />
   */
  const [mode, setMode] = useState("amount"); // "amount" | "percent"
  const [funds, setFunds] = useState({ ef: "", sf: "", spending: "", fun: "" });

  /**
   * UI-only labels (optional)
   * Purpose:
   * - Shows which “bank” bucket each fund belongs to in the UI
   */
  const fundBanks = {
    ef: "EF-bank",
    sf: "SF-bank / GSave",
    spending: "spend-bank",
    fun: "spend-bank",
  };

  /**
   * Toast message state (frontend only)
   * Purpose:
   * - Temporary feedback for user actions: save/done/errors
   *
   * Future extraction:
   * - Become a <Toast /> component
   */
  const [toast, setToast] = useState(null); // { type: "success" | "error", message: string }

  /**
   * DONE summary (frontend only)
   * Purpose:
   * - When DONE is pressed, store final computed amounts for display
   */
  const [doneSummary, setDoneSummary] = useState(null);

  // --------------------------
  // DERIVED VALUES / COMPUTATIONS
  // --------------------------

  /**
   * Total Income (from Step 1)
   * Purpose:
   * - Step 2 depends on this value
   */
  const totalIncome = useMemo(() => {
    return sources.reduce((sum, s) => {
      if (!s.received) return sum;
      const amt = clampNumber(s.amount);
      return sum + (amt > 0 ? amt : 0);
    }, 0);
  }, [sources]);

  const step1Valid = totalIncome > 0;

  /**
   * Convert Step 2 inputs to actual peso amounts
   * - If mode=amount: use direct values
   * - If mode=percent: compute percent of totalIncome
   */
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

  // --------------------------
  // VALIDATION
  // --------------------------

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

  // --------------------------
  // HANDLERS (User actions)
  // --------------------------

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

  // --------------------------
  // RENDER
  // --------------------------

  return (
    <div className={styles.page}>
      {/* HEADER (future: could become <Header /> component) */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kakeibo</h1>
          <div className={styles.subtitle}>
            Single-page: Step 1 + Step 2 (Frontend-only)
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.summaryChip}>
            <div className={styles.chipLabel}>Total Income</div>
            <div className={styles.chipValue}>{peso(totalIncome)}</div>
          </div>
          <button className={styles.ghostBtn} onClick={resetAll}>
            Reset
          </button>
        </div>
      </div>

      {/* STEP 1 SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Step 1: Money Allocation (Income)</h2>

          <div className={styles.row}>
            <button className={styles.ghostBtn} onClick={addSource}>
              + Add source
            </button>

            <button
              className={styles.primaryBtn}
              onClick={saveStep1Local}
              disabled={step1Errors.length !== 0}
              aria-disabled={step1Errors.length !== 0}
            >
              Save Step 1
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {sources.map((s) => (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardTitle}>{s.name}</div>
                  <div className={styles.cardHint}>
                    Prompt: Is {s.name} received [budget] amount?
                  </div>
                </div>

                <div className={styles.row}>
                  <label className={styles.toggleWrap}>
                    <input
                      type="checkbox"
                      checked={s.received}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateSource(s.id, {
                          received: checked,
                          amount: checked ? s.amount : "",
                        });
                      }}
                    />
                    <span className={styles.toggleText}>{s.received ? "Yes" : "No"}</span>
                  </label>

                  <button
                    title="Remove source"
                    className={styles.iconBtn}
                    onClick={() => removeSource(s.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.label}>Amount received (₱)</label>
                <input
                  className={styles.input}
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
                <div className={styles.errorText}>Amount must be greater than 0.</div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.inlineSummary}>
          <div>
            <strong>Sources received:</strong> {sources.filter((s) => s.received).length}
          </div>
          <div>
            <strong>Total income:</strong> {peso(totalIncome)}
          </div>
        </div>

        {step1Errors.length > 0 && (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>Step 1 needs attention:</div>
            <ul className={styles.errorList}>
              {step1Errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* STEP 2 SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Step 2: EF & SF Allocation</h2>

          <div className={styles.modeSwitch}>
            <button
              onClick={() => setMode("amount")}
              className={`${styles.modeBtn} ${mode === "amount" ? styles.modeBtnActive : ""}`}
            >
              Amount (₱)
            </button>
            <button
              onClick={() => setMode("percent")}
              className={`${styles.modeBtn} ${mode === "percent" ? styles.modeBtnActive : ""}`}
            >
              Percent (%)
            </button>
          </div>
        </div>

        {!step1Valid && (
          <div className={styles.lockBox}>
            Step 2 is locked. Complete Step 1 first (at least 1 received source with amount &gt; 0).
          </div>
        )}

        <div className={!step1Valid ? styles.disabledSection : ""}>
          {/* Future extraction: each block becomes <FundRow /> */}
          <div className={styles.fundGrid}>
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

          {/* Future extraction: SummaryPanel */}
          <div className={styles.summaryPanel}>
            <div className={styles.summaryRow}>
              <span>Total Income</span>
              <strong>{peso(totalIncome)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Total Allocated</span>
              <strong>{peso(allocatedTotal)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Remaining</span>
              <strong className={remaining < 0 ? styles.negative : ""}>{peso(remaining)}</strong>
            </div>

            {step2Errors.length > 0 && (
              <div className={styles.errorBox}>
                <div className={styles.errorTitle}>Step 2 needs attention:</div>
                <ul className={styles.errorList}>
                  {step2Errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <button className={styles.primaryBtn} onClick={doneStep2Local} disabled={!canDone}>
              DONE
            </button>
          </div>
        </div>

        {doneSummary && (
          <div className={styles.successBox}>
            <div className={styles.successTitle}>Yeyyy! You have now 🎉</div>
            <div className={styles.successGrid}>
              <SummaryItem label="Emergency Fund" value={peso(doneSummary.ef)} />
              <SummaryItem label="Sinking Fund" value={peso(doneSummary.sf)} />
              <SummaryItem label="Spending Fund" value={peso(doneSummary.spending)} />
              <SummaryItem label="Fun Fund" value={peso(doneSummary.fun)} />
            </div>
          </div>
        )}
      </section>

      {/* Future extraction: <Toast /> */}
      {toast && (
        <div
          className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}
        >
          {toast.message}
        </div>
      )}

      <div className={styles.footer}>
        Frontend-only version: no API, no Google Sheets yet. Next step is wiring Save/DONE to Express.
      </div>
    </div>
  );
}

/**
 * FundRow (subcomponent)
 * Purpose:
 * - UI for ONE fund input row in Step 2
 * - Shows input + computed amount
 *
 * Future separation:
 * - Move to /components/FundRow.jsx + /components/FundRow.module.css
 */
function FundRow({ label, sublabel, mode, value, onChange, computedAmount }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div>
          <div className={styles.cardTitle}>{label}</div>
          <div className={styles.cardHint}>{sublabel}</div>
        </div>
      </div>

      <div className={styles.fieldRow}>
        <label className={styles.label}>
          {mode === "amount" ? "Amount (₱)" : "Percent (%)"}
        </label>
        <input
          className={styles.input}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "amount" ? "0.00" : "0"}
        />
      </div>

      <div className={styles.miniComputed}>
        Computed: <strong>{peso(computedAmount)}</strong>
      </div>
    </div>
  );
}

/**
 * SummaryItem (subcomponent)
 * Purpose:
 * - Small display block used in the success summary (DONE message)
 *
 * Future separation:
 * - Can stay here or move into /components if reused elsewhere
 */
function SummaryItem({ label, value }) {
  return (
    <div className={styles.summaryItem}>
      <div className={styles.summaryItemLabel}>{label}</div>
      <div className={styles.summaryItemValue}>{value}</div>
    </div>
  );
}
