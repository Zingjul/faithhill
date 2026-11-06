import type { ReactNode } from "react";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "date"
  | "time"
  | "datetime"
  | "url"
  | "email"
  | "select"
  | "image"
  | "file"
  | "fk";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: SelectOption[];
  /** For "fk": manage endpoint (relative, e.g. "sermon-series") to load options from. */
  fkEndpoint?: string;
  /** For "fk": field on each option object used as the label. */
  fkLabelField?: string;
  /** Default value used on the create form. */
  initial?: unknown;
  /** Take the full row width in the form grid. */
  fullWidth?: boolean;
}

export interface ColumnConfig {
  key: string;
  label: string;
  render?: (row: Record<string, any>) => ReactNode;
}

export interface ResourceConfig {
  key: string;
  label: string;
  /** Path under /api/manage/ */
  endpoint: string;
  singular: string;
  section: "content" | "site" | "inbox";
  fields: FieldConfig[];
  columns: ColumnConfig[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  intro?: string;
}

export type Row = Record<string, any> & { id: number };
