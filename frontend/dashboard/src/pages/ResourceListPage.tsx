import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch, type Paginated } from "../api";
import Modal from "../components/Modal";
import { getResource } from "../resources";
import type { Row } from "../types";

export default function ResourceListPage() {
  const { resourceKey = "" } = useParams();
  const cfg = getResource(resourceKey);
  const navigate = useNavigate();

  const [data, setData] = useState<Paginated<Row> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    (pageNum: number) => {
      setLoading(true);
      apiFetch<Paginated<Row>>(`/api/manage/${cfg.endpoint}/?page=${pageNum}`)
        .then(({ ok, data: d }) => {
          if (ok && d) setData(d);
          else setError("Could not load this list.");
        })
        .finally(() => setLoading(false));
    },
    [cfg.endpoint],
  );

  useEffect(() => {
    setPage(1);
    setSearch("");
    load(1);
  }, [load]);

  const rows = useMemo(() => {
    const results = data?.results ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return results;
    return results.filter((row) =>
      cfg.columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(q)),
    );
  }, [data, search, cfg.columns]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { ok } = await apiFetch(`/api/manage/${cfg.endpoint}/${toDelete.id}/`, {
      method: "DELETE",
    });
    setDeleting(false);
    setToDelete(null);
    if (ok) load(page);
    else setError("Delete failed — please try again.");
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{cfg.label}</h1>
          {cfg.intro ? <p className="muted">{cfg.intro}</p> : null}
        </div>
        {cfg.canCreate !== false ? (
          <Link to={`/r/${cfg.key}/new`} className="btn btn-primary">
            + New {cfg.singular}
          </Link>
        ) : null}
      </div>

      <div className="card">
        <div className="toolbar">
          <input
            className="search"
            placeholder="Filter this page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {data ? (
            <span className="muted">
              {data.count} {data.count === 1 ? "item" : "items"}
            </span>
          ) : null}
        </div>

        {error ? <div className="alert">{error}</div> : null}

        {!error && loading ? (
          <p className="muted pad">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="empty">
            <p>No {cfg.label.toLowerCase()} yet.</p>
            {cfg.canCreate !== false ? (
              <Link to={`/r/${cfg.key}/new`} className="btn btn-primary">
                Create the first {cfg.singular.toLowerCase()}
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {cfg.columns.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                    <th aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => cfg.canEdit !== false && navigate(`/r/${cfg.key}/${row.id}/edit`)}
                    >
                      {cfg.columns.map((c) => (
                        <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? "—")}</td>
                      ))}
                      <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                        {cfg.canEdit !== false ? (
                          <Link className="btn btn-sm" to={`/r/${cfg.key}/${row.id}/edit`}>
                            Edit
                          </Link>
                        ) : null}
                        {cfg.canDelete !== false ? (
                          <button className="btn btn-sm btn-danger" onClick={() => setToDelete(row)}>
                            Delete
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <div className="pagination">
                <button className="btn btn-sm" disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1); }}>
                  ← Prev
                </button>
                <span className="muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage(page + 1);
                    load(page + 1);
                  }}
                >
                  Next →
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title={`Delete ${cfg.singular.toLowerCase()}?`}>
        <p>
          This permanently removes{" "}
          <strong>{String(toDelete?.title ?? toDelete?.name ?? toDelete?.label ?? `item #${toDelete?.id}`)}</strong>.
          This can't be undone.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setToDelete(null)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
