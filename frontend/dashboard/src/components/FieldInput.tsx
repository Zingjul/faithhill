import { useEffect, useState } from "react";
import { apiFetch, mediaUrl, type Paginated } from "../api";
import type { FieldConfig } from "../types";

/** Convert an API datetime value into what <input type="datetime-local"> expects. */
export function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldConfig;
  value: unknown;
  error?: string[];
  onChange: (name: string, value: unknown) => void;
}) {
  const id = `f-${field.name}`;
  const val = value ?? (field.type === "checkbox" ? false : "");

  const input = () => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            id={id}
            rows={5}
            value={String(val)}
            placeholder={field.placeholder}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        );
      case "checkbox":
        return (
          <label className="checkbox-row" htmlFor={id}>
            <input
              id={id}
              type="checkbox"
              checked={Boolean(val)}
              onChange={(e) => onChange(field.name, e.target.checked)}
            />
            <span>{field.help ?? ""}</span>
          </label>
        );
      case "select":
        return (
          <select
            id={id}
            value={String(val)}
            onChange={(e) => {
              const v = e.target.value;
              const numeric = field.options?.some((o) => typeof o.value === "number");
              onChange(field.name, numeric ? Number(v) : v);
            }}
          >
            {field.required ? null : <option value="">—</option>}
            {field.options?.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "fk":
        return <FkSelect field={field} value={val} onChange={onChange} id={id} />;
      case "date":
        return (
          <input
            id={id}
            type="date"
            value={String(val === "now" ? new Date().toISOString().slice(0, 10) : val).slice(0, 10)}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        );
      case "time":
        return (
          <input
            id={id}
            type="time"
            value={String(val).slice(0, 5)}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        );
      case "datetime":
        return (
          <input
            id={id}
            type="datetime-local"
            value={val === "now" ? toLocalInput(new Date().toISOString()) : toLocalInput(String(val))}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        );
      case "image":
      case "file":
        return <FileInput field={field} value={val} onChange={onChange} id={id} />;
      default:
        return (
          <input
            id={id}
            type={field.type === "number" ? "number" : field.type === "url" ? "url" : field.type === "email" ? "email" : "text"}
            value={String(val)}
            placeholder={field.placeholder}
            onChange={(e) =>
              onChange(field.name, field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)
            }
          />
        );
    }
  };

  return (
    <div className={`field${field.fullWidth ? " field-full" : ""}${error ? " field-error" : ""}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required ? <span className="req">*</span> : null}
      </label>
      {input()}
      {field.help && field.type !== "checkbox" ? <p className="help">{field.help}</p> : null}
      {error?.map((e, i) => (
        <p className="error" key={i}>
          {e}
        </p>
      ))}
    </div>
  );
}

function FkSelect({
  field,
  value,
  onChange,
  id,
}: {
  field: FieldConfig;
  value: unknown;
  id: string;
  onChange: (name: string, value: unknown) => void;
}) {
  const [options, setOptions] = useState<{ id: number; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<Paginated<Record<string, any>>>(`/api/manage/${field.fkEndpoint}/?page_size=100`)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setOptions(
          data.results.map((r) => ({
            id: r.id as number,
            label: String(r[field.fkLabelField ?? "id"] ?? r.id),
          })),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [field.fkEndpoint, field.fkLabelField]);

  return (
    <select
      id={id}
      disabled={loading}
      value={value === null || value === undefined || value === "" ? "" : String(value)}
      onChange={(e) => onChange(field.name, e.target.value === "" ? null : Number(e.target.value))}
    >
      {field.required ? null : <option value="">— None —</option>}
      {value && !options.some((o) => o.id === value) ? <option value={String(value)}>…</option> : null}
      {options.map((o) => (
        <option key={o.id} value={String(o.id)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function FileInput({
  field,
  value,
  onChange,
  id,
}: {
  field: FieldConfig;
  value: unknown;
  id: string;
  onChange: (name: string, value: unknown) => void;
}) {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(value ? mediaUrl(String(value)) : "");
  }, [value]);

  const isImage = field.type === "image";
  const currentName =
    value instanceof File ? value.name : typeof value === "string" && value ? value.split("/").pop() : "";

  return (
    <div className="file-input">
      {currentName ? <p className="help">Current: {currentName}</p> : null}
      {isImage && preview ? <img src={preview} alt="" className="preview-img" /> : null}
      <input
        id={id}
        type="file"
        accept={isImage ? "image/*" : field.name === "audio_file" ? "audio/*" : undefined}
        onChange={(e) => onChange(field.name, e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
