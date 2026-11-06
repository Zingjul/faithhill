import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatDate, type Paginated } from "../../api";
import Modal from "../../components/Modal";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_replied: boolean;
  created_at: string;
}

export default function ContactMessagesPage() {
  const [data, setData] = useState<Paginated<ContactMessage> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Paginated<ContactMessage>>("/api/manage/contact-messages/")
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const patch = async (id: number, payload: Partial<ContactMessage>) => {
    await apiFetch(`/api/manage/contact-messages/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    load();
  };

  const remove = async (id: number) => {
    await apiFetch(`/api/manage/contact-messages/${id}/`, { method: "DELETE" });
    setSelected(null);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Contact Messages</h1>
          <p className="muted">Messages from the website contact form. Mark them once replied.</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p className="muted pad">Loading…</p>
        ) : !data || data.results.length === 0 ? (
          <p className="empty">Inbox zero. ✨</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Replied</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((m) => (
                  <tr key={m.id} onClick={() => setSelected(m)}>
                    <td>{m.name}</td>
                    <td>{m.subject || <span className="muted">{m.message.slice(0, 50)}…</span>}</td>
                    <td>{formatDate(m.created_at)}</td>
                    <td>{m.is_replied ? <span className="badge badge-ok">Replied ✓</span> : <span className="badge badge-new">Open</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.subject || `Message from ${selected?.name ?? ""}`}>
        {selected ? (
          <div className="detail-stack">
            <p className="detail-body">{selected.message}</p>
            <p className="muted">
              {selected.name} · <a href={`mailto:${selected.email}`}>{selected.email}</a> · {formatDate(selected.created_at)}
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => remove(selected.id)}>
                Delete
              </button>
              <a className="btn" href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your message to Faith Hill")}`}>
                Reply by email
              </a>
              <button
                className="btn btn-primary"
                onClick={() => {
                  patch(selected.id, { is_replied: !selected.is_replied });
                  setSelected({ ...selected, is_replied: !selected.is_replied });
                }}
              >
                {selected.is_replied ? "Mark as open" : "Mark as replied"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
