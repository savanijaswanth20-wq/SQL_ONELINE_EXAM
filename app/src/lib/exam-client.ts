import { getSupabase } from "./supabase";

export async function api<T>(body?: unknown, id?: string): Promise<T> {
  const url = "/api/exam" + (id ? "?id=" + encodeURIComponent(id) : "");
  const headers: Record<string, string> = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Ignore auth resolution errors for unauthenticated users
  }

  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not connect. Please try again.");
  return data as T;
}
export function attemptUrl(id:string,status:string){return (status==="active"?"/exam":"/reports")+"?id="+encodeURIComponent(id)}
export function dateLabel(ms:number){return new Date(ms).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
export function durationLabel(start:number,end:number){const n=Math.max(0,Math.round((end-start)/60000));return n+" min"}
