import { createContext, useContext } from "react";
import type { ServiceTime } from "./api";

/** Service times load once for the whole site (hero headline + footer).
 * Kept in its own module so pages don't import from App.tsx (avoids a
 * module cycle that misbehaves in dev-mode ESM). */
export const ServiceTimesContext = createContext<ServiceTime[]>([]);

export function useServiceTimes() {
  return useContext(ServiceTimesContext);
}
