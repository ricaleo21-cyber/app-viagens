"use client";

import { useState } from "react";
import { useTripStore, type Receipt } from "@/store/tripStore";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  Restaurante:    { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", emoji: "🍽️" },
  Supermercado:   { bg: "bg-blue-100 dark:bg-blue-900/30",      text: "text-blue-700 dark:text-blue-300",      emoji: "🛒" },
  Loja:           { bg: "bg-pink-100 dark:bg-pink-900/30",       text: "text-pink-700 dark:text-pink-300",       emoji: "🛍️" },
  Farmácia:       { bg: "bg-red-100 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-300",         emoji: "💊" },
  Transporte:     { bg: "bg-sky-100 dark:bg-sky-900/30",         text: "text-sky-700 dark:text-sky-300",         emoji: "🚗" },
  Hotel:          { bg: "bg-violet-100 dark:bg-violet-900/30",   text: "text-violet-700 dark:text-violet-300",   emoji: "🏨" },
  Entretenimento: { bg: "bg-amber-100 dark:bg-amber-900/30",     text: "text-amber-700 dark:text-amber-300",     emoji: "🎭" },
  Atrações:       { bg: "bg-orange-100 dark:bg-orange-900/30",   text: "text-orange-700 dark:text-orange-300",   emoji: "🎡" },
  Outro:          { bg: "bg-slate-100 dark:bg-slate-800",        text: "text-slate-600 dark:text-slate-400",     emoji: "📌" },
};

function categoryStyle(cat?: string) {
  return CATEGORY_COLORS[cat ?? ""] ?? CATEGORY_COLORS["Outro"];
}

function formatAmount(amount?: number, currency?: string) {
  if (amount == null) return "—";
  return `${currency ?? ""} ${amount.toFixed(2)}`.trim();
}

// ---- Receipt Card ----

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { removeReceipt } = useTripStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const style = categoryStyle(receipt.category);

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img src={receipt.imageData} alt="Recibo" className="w-full h-full object-cover" />
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {receipt.vendor || "Recibo sem nome"}
            </p>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0">
              {formatAmount(receipt.amount, receipt.currency)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
              {style.emoji} {receipt.category || "Outro"}
            </span>
            {receipt.description && (
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{receipt.description}</span>
            )}
          </div>
        </div>

        {/* Delete */}
        <div className="shrink-0">
          {confirmDelete ? (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Excluir?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => removeReceipt(receipt.id)}
                  className="text-xs font-bold text-red-500 hover:text-red-600 cursor-pointer"
                >Sim</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >Não</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded image */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <img src={receipt.imageData} alt="Recibo completo" className="w-full rounded-xl object-contain max-h-72 bg-slate-50 dark:bg-slate-900" />
        </div>
      )}
    </div>
  );
}

// ---- Main View ----

export default function ReceiptsView() {
  const { trip } = useTripStore();
  const receipts = trip.receipts ?? [];
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Group receipts by day
  const receiptsByDay = trip.days
    .map((day) => ({ day, receipts: receipts.filter((r) => r.dayId === day.id) }))
    .filter((g) => g.receipts.length > 0);

  // Category totals (group by category, sum amounts)
  const categoryTotals: Record<string, { total: number; count: number; currency: string }> = {};
  for (const r of receipts) {
    if (r.amount == null) continue;
    const cat = r.category || "Outro";
    const curr = r.currency || "USD";
    if (!categoryTotals[cat]) categoryTotals[cat] = { total: 0, count: 0, currency: curr };
    categoryTotals[cat].total += r.amount;
    categoryTotals[cat].count++;
  }

  const withAmount = receipts.filter((r) => r.amount != null);
  const grandTotal = withAmount.reduce((s, r) => s + (r.amount ?? 0), 0);
  const currencies = [...new Set(receipts.map((r) => r.currency).filter(Boolean))];
  const displayCurrency = currencies.length === 1 ? currencies[0] : "—";

  const handleAnalyze = async () => {
    if (receipts.length === 0 || analyzing) return;
    setAnalyzing(true);
    setAiSummary(null);
    try {
      const res = await fetch("/api/ai/spending-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipts: receipts.map((r) => ({
            vendor: r.vendor,
            amount: r.amount,
            currency: r.currency,
            category: r.category,
            description: r.description,
          })),
          tripName: trip.name,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary ?? "Não foi possível gerar análise.");
    } catch {
      setAiSummary("Erro ao conectar com a IA. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0b1120]">
      {/* Header */}
      <header className="bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-5 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xl">🧾</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recibos da Viagem</h2>
            </div>
            <p className="text-xs text-slate-400">
              {receipts.length} {receipts.length === 1 ? "recibo" : "recibos"}
              {withAmount.length > 0 && ` · Total: ${displayCurrency} ${grandTotal.toFixed(2)}`}
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || receipts.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/25 cursor-pointer shrink-0"
          >
            {analyzing ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5.06-1.38L2 22l1.38-4.94A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2z" />
                <path d="M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
            )}
            <span className="hidden sm:inline">{analyzing ? "Analisando..." : "Analisar com IA"}</span>
            <span className="sm:hidden">IA</span>
          </button>
        </div>
      </header>

      <div className="px-4 md:px-8 py-6 space-y-6 pb-20 md:pb-6">

        {/* Category summary cards */}
        {Object.keys(categoryTotals).length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Resumo por categoria</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([cat, data]) => {
                  const style = categoryStyle(cat);
                  return (
                    <div key={cat} className={`rounded-2xl p-4 border ${style.bg} border-transparent`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-base">{style.emoji}</span>
                        <span className={`text-xs font-bold ${style.text}`}>{cat}</span>
                      </div>
                      <p className={`text-lg font-bold ${style.text}`}>
                        {data.currency} {data.total.toFixed(2)}
                      </p>
                      <p className={`text-xs ${style.text} opacity-70`}>
                        {data.count} {data.count === 1 ? "recibo" : "recibos"}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* AI summary */}
        {aiSummary && (
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-5 border border-violet-200 dark:border-violet-700/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5.06-1.38L2 22l1.38-4.94A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2z"/>
                  <path d="M8 12h.01M12 12h.01M16 12h.01"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-violet-700 dark:text-violet-300">Análise de gastos — IA</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
          </div>
        )}

        {/* Empty state */}
        {receipts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-200 dark:border-amber-700/40 flex items-center justify-center text-4xl mb-5">
              🧾
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Nenhum recibo ainda</h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Escaneie seus recibos no botão <span className="text-amber-500 font-semibold">📷 Recibo</span> em cada dia do itinerário.
            </p>
          </div>
        )}

        {/* Receipts grouped by day */}
        {receiptsByDay.map(({ day, receipts: dayReceipts }) => {
          const dayTotal = dayReceipts.filter((r) => r.amount != null).reduce((s, r) => s + (r.amount ?? 0), 0);
          const dayCurrencies = [...new Set(dayReceipts.map((r) => r.currency).filter(Boolean))];
          const dayCurrency = dayCurrencies.length === 1 ? dayCurrencies[0] : "—";

          return (
            <div key={day.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {day.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {day.label} — {day.city}
                    </h3>
                    <p className="text-xs text-slate-400">{day.date}</p>
                  </div>
                </div>
                {dayTotal > 0 && (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {dayCurrency} {dayTotal.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {dayReceipts.map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
