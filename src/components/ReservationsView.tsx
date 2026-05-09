"use client";

import { useRef, useState } from "react";
import { useTripStore, type Reservation, type ReservationType } from "@/store/tripStore";

// ---- Config ----

const TABS: { type: ReservationType | "all"; label: string; emoji: string }[] = [
  { type: "all", label: "Todos", emoji: "📋" },
  { type: "flight", label: "Voo", emoji: "✈️" },
  { type: "hotel", label: "Hospedagem", emoji: "🏨" },
  { type: "car", label: "Carro", emoji: "🚗" },
  { type: "restaurant", label: "Restaurante", emoji: "🍽️" },
  { type: "insurance", label: "Seguro", emoji: "🛡️" },
  { type: "attachment", label: "Anexo", emoji: "📎" },
  { type: "other", label: "Outro", emoji: "📌" },
];

const TYPE_COLORS: Record<ReservationType, string> = {
  flight: "from-sky-500 to-blue-600",
  hotel: "from-violet-500 to-purple-600",
  car: "from-amber-500 to-orange-500",
  restaurant: "from-emerald-500 to-teal-600",
  insurance: "from-blue-500 to-cyan-600",
  attachment: "from-slate-500 to-slate-600",
  other: "from-rose-500 to-pink-600",
};

const EMPTY_FORM: Omit<Reservation, "id"> = {
  type: "flight",
  title: "",
  provider: "",
  confirmationCode: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  origin: "",
  destination: "",
  location: "",
  cost: undefined,
  currency: "BRL",
  notes: "",
  attachments: [],
};

// ---- Add/Edit Modal ----

function ReservationModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Omit<Reservation, "id"> & { id?: number };
  onSave: (data: Omit<Reservation, "id"> & { id?: number }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((prev) => ({
          ...prev,
          attachments: [
            ...(prev.attachments || []),
            { name: file.name, data: ev.target?.result as string },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (i: number) =>
    setForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, idx) => idx !== i),
    }));

  const label = (text: string) => (
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{text}</span>
  );

  const input = (field: string, placeholder: string, type = "text") => (
    <input
      type={type}
      placeholder={placeholder}
      value={(form as Record<string, unknown>)[field] as string ?? ""}
      onChange={(e) => set(field, e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
    />
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111827] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-white">
            {form.id ? "Editar reserva" : "Nova reserva"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Type selector */}
          <div>
            {label("Tipo")}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {TABS.filter((t) => t.type !== "all").map((t) => (
                <button
                  key={t.type}
                  onClick={() => set("type", t.type)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    form.type === t.type
                      ? "bg-violet-600/20 border-violet-500 text-violet-300"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            {label("Título / Nome")}
            {input("title", "Ex: Voo GRU → MIA, Hotel Marriott...")}
          </div>

          {/* Provider + Confirmation */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              {label("Fornecedor")}
              {input("provider", "Ex: LATAM, Hertz...")}
            </div>
            <div className="space-y-1.5">
              {label("Código de reserva")}
              {input("confirmationCode", "Ex: ABC123")}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              {label(form.type === "flight" ? "Data de partida" : "Check-in / Início")}
              {input("startDate", "", "date")}
            </div>
            <div className="space-y-1.5">
              {label(form.type === "flight" ? "Data de chegada" : "Check-out / Fim")}
              {input("endDate", "", "date")}
            </div>
          </div>

          {/* Times (flight/restaurant) */}
          {(form.type === "flight" || form.type === "restaurant") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                {label("Horário de saída")}
                {input("startTime", "", "time")}
              </div>
              <div className="space-y-1.5">
                {label("Horário de chegada")}
                {input("endTime", "", "time")}
              </div>
            </div>
          )}

          {/* Origin / Destination (flight) */}
          {form.type === "flight" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                {label("Origem")}
                {input("origin", "Ex: GRU - São Paulo")}
              </div>
              <div className="space-y-1.5">
                {label("Destino")}
                {input("destination", "Ex: MIA - Miami")}
              </div>
            </div>
          )}

          {/* Location (hotel/car/restaurant) */}
          {(form.type === "hotel" || form.type === "car" || form.type === "restaurant") && (
            <div className="space-y-1.5">
              {label(form.type === "car" ? "Local de retirada" : "Endereço")}
              {input("location", "Endereço completo")}
            </div>
          )}

          {/* Insurance fields */}
          {form.type === "insurance" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  {label("Seguradora")}
                  {input("provider", "Ex: Assist Card, AXA...")}
                </div>
                <div className="space-y-1.5">
                  {label("Número da apólice")}
                  {input("confirmationCode", "Ex: APL-123456")}
                </div>
              </div>
              <div className="space-y-1.5">
                {label("Cobertura / Plano")}
                {input("location", "Ex: Cobertura médica $30.000, cancelamento...")}
              </div>
            </>
          )}

          {/* Cost */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              {label("Custo")}
              <input
                type="number"
                placeholder="0,00"
                value={form.cost ?? ""}
                onChange={(e) => set("cost", e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              {label("Moeda")}
              <select
                value={form.currency ?? "BRL"}
                onChange={(e) => set("currency", e.target.value)}
                className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
              >
                <option>BRL</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            {label("Notas")}
            <textarea
              placeholder="Informações adicionais..."
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all resize-none"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            {label("Anexos")}
            <div className="flex flex-wrap gap-2 mt-1">
              {(form.attachments || []).map((att, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="text-slate-500 hover:text-red-400 cursor-pointer ml-1">×</button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 bg-white/5 border border-dashed border-white/20 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:border-violet-500 hover:text-violet-300 transition-all cursor-pointer"
              >
                + Adicionar arquivo
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFile} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => { if (form.title.trim()) onSave(form); }}
            disabled={!form.title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Reservation Card ----

function ReservationCard({ r, onEdit, onDelete }: { r: Reservation; onEdit: () => void; onDelete: () => void }) {
  const tab = TABS.find((t) => t.type === r.type)!;
  const color = TYPE_COLORS[r.type];

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg shrink-0 shadow-md`}>
            {tab.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r ${color} text-white`}>
                {tab.label}
              </span>
              {r.provider && <span className="text-xs text-slate-400">{r.provider}</span>}
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">{r.title}</h3>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {r.confirmationCode && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {r.confirmationCode}
                </span>
              )}
              {r.startDate && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {r.startDate}{r.endDate && r.endDate !== r.startDate ? ` → ${r.endDate}` : ""}
                  {r.startTime ? ` ${r.startTime}` : ""}
                </span>
              )}
              {r.origin && r.destination && (
                <span className="text-xs text-slate-500">{r.origin} → {r.destination}</span>
              )}
              {r.location && (
                <span className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-[200px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {r.location}
                </span>
              )}
              {r.cost != null && (
                <span className="text-xs font-semibold text-violet-400">
                  {r.currency} {r.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {r.notes && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{r.notes}</p>
            )}

            {(r.attachments?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.attachments!.map((att, i) => (
                  <a key={i} href={att.data} download={att.name}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    {att.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-400 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main View ----

export default function ReservationsView() {
  const { reservations, addReservation, updateReservation, removeReservation } = useTripStore();
  const [activeTab, setActiveTab] = useState<ReservationType | "all">("all");
  const [modalData, setModalData] = useState<(Omit<Reservation, "id"> & { id?: number }) | null>(null);

  const filtered = activeTab === "all" ? reservations : reservations.filter((r) => r.type === activeTab);

  const handleSave = (data: Omit<Reservation, "id"> & { id?: number }) => {
    if (data.id) {
      updateReservation(data.id, data);
    } else {
      addReservation({ ...data, id: Date.now() } as Reservation);
    }
    setModalData(null);
  };

  const totalCost = reservations.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-[#0b1120]">
      {/* Header */}
      <header className="shrink-0 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-8 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reservas e Anexos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {reservations.length} reserva{reservations.length !== 1 ? "s" : ""}
              {totalCost > 0 && ` · Total: R$ ${totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            </p>
          </div>
          <button
            onClick={() => setModalData({ ...EMPTY_FORM })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nova reserva
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const count = tab.type === "all" ? reservations.length : reservations.filter((r) => r.type === tab.type).length;
            const isActive = activeTab === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-4">
              {TABS.find((t) => t.type === activeTab)?.emoji ?? "📋"}
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Nenhuma reserva ainda</h3>
            <p className="text-sm text-slate-400 mb-5">Adicione voos, hotéis, carros e outros itens da sua viagem.</p>
            <button
              onClick={() => setModalData({ ...EMPTY_FORM, type: activeTab === "all" ? "flight" : activeTab })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors cursor-pointer"
            >
              + Adicionar reserva
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                r={r}
                onEdit={() => setModalData(r)}
                onDelete={() => removeReservation(r.id)}
              />
            ))}
          </div>
        )}
      </div>

      {modalData && (
        <ReservationModal
          initial={modalData}
          onSave={handleSave}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  );
}
