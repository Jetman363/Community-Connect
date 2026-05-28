const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/v1";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8061/v1/ws";
export const CAD_BASE = DEMO_MODE
  ? (process.env.NEXT_PUBLIC_CAD_URL ?? "http://localhost:8070/v1")
  : `${API_BASE}/cad`;
export const AI_PARSER_BASE = DEMO_MODE
  ? (process.env.NEXT_PUBLIC_AI_PARSER_URL ?? "http://localhost:8080/v1")
  : `${API_BASE}/ai/calls`;
export const AGENCY_ID = process.env.NEXT_PUBLIC_AGENCY_ID ?? "agency-demo-001";
export const IS_DEMO_MODE = DEMO_MODE;
