import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatDate, type Paginated } from "../../api";
import Modal from "../../components/Modal";

interface PrayerRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  request: string;
  status: "new" | "in_progress" | "closed";
  staff_notes: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "Praying over it",
  closed: "Closed",
};

const TABS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "Praying over it" },
  { value: "closed", label: "Closed" },
];

export default function PrayerRequestsPage() {
  const [tab, setTab] = useState("new");
  const [data, setData] = useState<Paginated<PrayerRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PrayerRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState<PrayerRequest["status"]>("new");
  const [draftNotes, setDraftNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const qs = tab ? `?status=${tab}` : "";
    apiFetch<Paginated<PrayerRequest>>(`/api/manage/prayer-requests/${qs}`)
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(load, [load]);

  const open = (r: PrayerRequest) => {
    setSelected(r);
    setDraftStatus(r.status);
    setDraftNotes(r.staff_notes ?? "");
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    await apiFetch(`/api/manage/prayer-requests/${selected.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: draftStatus, staff_notes: draftNotes }),
    });
    setSaving(false);
    setSelected(null);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Prayer Requests</h1>
          <p className="muted">Every request submitted on the website. Pray, then update the status.</p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.value} className={`tab${tab === t.value ? " active" : ""}`} onClick={() => setTab(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <p className="muted pad">Loading…</p>
        ) : !data || data.results.length === 0 ? (
          <p className="empty">No requests here. 🙏</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Request</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r.id} onClick={() => open(r)}>
                    <td>{r.name}</td>
                    <td>{r.request.length > 60 ? r.request.slice(0, 60) + "…" : r.request}</td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      <span className={`badge badge-${r.status}`}>{STATUS_LABELS[r.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Prayer request — ${selected?.name ?? ""}`}>
        {selected ? (
          <div className="detail-stack">
            <p className="detail-body">{selected.request}</p>
            <p className="muted">
              Submitted {formatDate(selected.created_at)}
              {selected.email ? ` · ${selected.email}` : ""}
              {selected.phone ? ` · ${selected.phone}` : ""}
            </p>
            <div className="field">
              <label htmlFor="pr-status">Status</label>
              <select id="pr-status" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value as PrayerRequest["status"])}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pr-notes">Staff notes (private)</label>
              <textarea id="pr-notes" rows={4} value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setSelected(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
