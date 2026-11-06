import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatDate, type Paginated } from "../../api";
import Modal from "../../components/Modal";

interface Testimony {
  id: number;
  name: string;
  body: string;
  is_approved: boolean;
  created_at: string;
}

const TABS = [
  { value: "0", label: "Awaiting approval" },
  { value: "1", label: "Approved" },
  { value: "", label: "All" },
];

export default function TestimoniesPage() {
  const [tab, setTab] = useState("0");
  const [data, setData] = useState<Paginated<Testimony> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimony | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const qs = tab ? `?approved=${tab}` : "";
    apiFetch<Paginated<Testimony>>(`/api/manage/testimonies/${qs}`)
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(load, [load]);

  const setApproved = async (t: Testimony, approved: boolean) => {
    await apiFetch(`/api/manage/testimonies/${t.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: approved }),
    });
    load();
  };

  const remove = async (t: Testimony) => {
    await apiFetch(`/api/manage/testimonies/${t.id}/`, { method: "DELETE" });
    load();
  };

  const openEdit = (t: Testimony) => {
    setEditing(t);
    setDraftName(t.name);
    setDraftBody(t.body);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    await apiFetch(`/api/manage/testimonies/${editing.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draftName, body: draftBody }),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Testimonies</h1>
          <p className="muted">Members submit testimonies on the website; only approved ones are shown there.</p>
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
          <p className="empty">Nothing here.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Testimony</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {data.results.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.body.length > 60 ? t.body.slice(0, 60) + "…" : t.body}</td>
                    <td>{formatDate(t.created_at)}</td>
                    <td>
                      {t.is_approved ? <span className="badge badge-ok">Live ✓</span> : <span className="badge badge-new">Pending</span>}
                    </td>
                    <td className="row-actions">
                      <button className="btn btn-sm" onClick={() => openEdit(t)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => setApproved(t, !t.is_approved)}>
                        {t.is_approved ? "Unpublish" : "Approve"}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(t)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit testimony">
        <div className="detail-stack">
          <div className="field">
            <label htmlFor="t-name">Name</label>
            <input id="t-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="t-body">Testimony</label>
            <textarea id="t-body" rows={6} value={draftBody} onChange={(e) => setDraftBody(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
