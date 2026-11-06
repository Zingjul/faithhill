import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatDate, type Paginated } from "../../api";

interface Subscriber {
  id: number;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

export default function NewsletterPage() {
  const [data, setData] = useState<Paginated<Subscriber> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Paginated<Subscriber>>("/api/manage/newsletter/")
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const remove = async (id: number) => {
    await apiFetch(`/api/manage/newsletter/${id}/`, { method: "DELETE" });
    load();
  };

  const copyEmails = () => {
    const emails = (data?.results ?? []).map((s) => s.email).join(", ");
    navigator.clipboard?.writeText(emails).catch(() => undefined);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Newsletter Subscribers</h1>
          <p className="muted">{data ? `${data.count} subscriber${data.count === 1 ? "" : "s"}` : ""}</p>
        </div>
        {data && data.count > 0 ? (
          <button className="btn" onClick={copyEmails}>
            Copy email list
          </button>
        ) : null}
      </div>

      <div className="card">
        {loading ? (
          <p className="muted pad">Loading…</p>
        ) : !data || data.results.length === 0 ? (
          <p className="empty">No subscribers yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Subscribed</th>
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {data.results.map((s) => (
                  <tr key={s.id}>
                    <td>{s.email}</td>
                    <td>{formatDate(s.subscribed_at)}</td>
                    <td className="row-actions">
                      <button className="btn btn-sm btn-danger" onClick={() => remove(s.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
