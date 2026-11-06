import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import FieldInput from "../components/FieldInput";
import { getResource } from "../resources";

type FormState = Record<string, unknown>;
type FormErrors = Record<string, string[]>;

/** Normalize a raw API value into form state. */
function toFormState(cfgFields: ReturnType<typeof getResource>["fields"], src: Record<string, any>): FormState {
  const state: FormState = {};
  for (const f of cfgFields) {
    const v = src[f.name];
    state[f.name] = v ?? (f.type === "checkbox" ? false : f.type === "number" || f.type === "fk" ? null : "");
  }
  return state;
}

/** Convert form state to an API payload (JSON or FormData when files exist). */
function buildPayload(cfgFields: ReturnType<typeof getResource>["fields"], state: FormState) {
  const hasFile = cfgFields.some(
    (f) => (f.type === "image" || f.type === "file") && state[f.name] instanceof File,
  );
  const out: [string, unknown][] = [];

  for (const f of cfgFields) {
    let v = state[f.name];
    if ((f.type === "image" || f.type === "file") && !(v instanceof File)) continue; // unchanged file
    if (v === "now") v = new Date().toISOString();
    if (f.type === "datetime" && typeof v === "string" && v) v = new Date(v).toISOString();
    if ((f.type === "fk" || f.type === "number" || f.type === "date" || f.type === "time" || f.type === "datetime") && v === "")
      v = null;
    out.push([f.name, v]);
  }

  if (hasFile) {
    const fd = new FormData();
    for (const [k, v] of out) {
      if (v === null || v === undefined) continue; // FormData can't represent null
      fd.append(k, v instanceof File ? v : String(v));
    }
    return fd;
  }
  return JSON.stringify(Object.fromEntries(out));
}

export default function ResourceFormPage() {
  const { resourceKey = "", id } = useParams();
  const cfg = getResource(resourceKey);
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [state, setState] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      apiFetch<Record<string, any>>(`/api/manage/${cfg.endpoint}/${id}/`).then(({ ok, data }) => {
        if (ok && data) setState(toFormState(cfg.fields, data));
        else setFormError("Could not load this item.");
      });
    } else {
      const initial: FormState = {};
      for (const f of cfg.fields) {
        initial[f.name] = f.initial ?? (f.type === "checkbox" ? false : f.type === "fk" ? null : "");
      }
      setState(initial);
    }
    setErrors({});
    setFormError(null);
  }, [cfg, id, isEdit]);

  const onChange = (name: string, value: unknown) =>
    setState((s) => (s ? { ...s, [name]: value } : s));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!state) return;

    // Client-side required check.
    const missing: FormErrors = {};
    for (const f of cfg.fields) {
      if (!f.required) continue;
      const v = state[f.name];
      if (v === "" || v === null || v === undefined) missing[f.name] = ["This field is required."];
    }
    if (Object.keys(missing).length) {
      setErrors(missing);
      setFormError("Please fill in the required fields.");
      return;
    }

    setSaving(true);
    setErrors({});
    setFormError(null);

    const body = buildPayload(cfg.fields, state);
    const url = isEdit ? `/api/manage/${cfg.endpoint}/${id}/` : `/api/manage/${cfg.endpoint}/`;
    const { ok, data } = await apiFetch<Record<string, any>>(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body as BodyInit,
    });
    setSaving(false);

    if (ok) {
      navigate(`/r/${cfg.key}`);
      return;
    }
    if (data && typeof data === "object") {
      const { non_field_errors = [], ...fieldErrors } = data as FormErrors & { non_field_errors?: string[] };
      setErrors(fieldErrors);
      setFormError(
        non_field_errors.length
          ? non_field_errors.join(" ")
          : "Please fix the highlighted fields and try again.",
      );
    } else {
      setFormError("Something went wrong while saving. Please try again.");
    }
  };

  if (!state) {
    return formError ? <div className="alert">{formError}</div> : <p className="muted pad">Loading…</p>;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>
            {isEdit ? `Edit ${cfg.singular.toLowerCase()}` : `New ${cfg.singular.toLowerCase()}`}
          </h1>
          <p className="muted">
            <Link to={`/r/${cfg.key}`}>← Back to {cfg.label.toLowerCase()}</Link>
          </p>
        </div>
      </div>

      {formError ? <div className="alert">{formError}</div> : null}

      <form className="card" onSubmit={onSubmit}>
        <div className="form-grid">
          {cfg.fields.map((f) => (
            <FieldInput key={f.name} field={f} value={state[f.name]} error={errors[f.name]} onChange={onChange} />
          ))}
        </div>
        <div className="form-actions">
          <Link to={`/r/${cfg.key}`} className="btn">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : `Create ${cfg.singular.toLowerCase()}`}
          </button>
        </div>
      </form>
    </div>
  );
}
