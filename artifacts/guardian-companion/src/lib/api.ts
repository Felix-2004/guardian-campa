const BASE = "/api";

function getToken() {
  return localStorage.getItem("guardian_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

export const api = {
  auth: {
    requestOtp: (phone: string) =>
      request<{ success: boolean; message: string; expiresIn: number }>("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      }),
    verifyOtp: (phone: string, otp: string) =>
      request<{ token: string; user: any }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      }),
    googleSignIn: (credential: string) =>
      request<{ token: string; user: any }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      }),
  },
  users: {
    me: () => request<any>("/users/me"),
    update: (data: any) => request<any>("/users/me", { method: "PUT", body: JSON.stringify(data) }),
    setup: (data: any) => request<any>("/users/setup", { method: "POST", body: JSON.stringify(data) }),
  },
  contacts: {
    list: () => request<any[]>("/contacts"),
    create: (data: any) => request<any>("/contacts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/contacts/${id}`, { method: "DELETE" }),
  },
  locations: {
    list: () => request<any[]>("/locations"),
    create: (data: any) => request<any>("/locations", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/locations/${id}`, { method: "DELETE" }),
  },
  alerts: {
    list: () => request<any[]>("/alerts"),
    triggerSos: (data: { lat: number; lng: number; message?: string }) =>
      request<any>("/alerts", { method: "POST", body: JSON.stringify(data) }),
    resolve: (id: number) => request<any>(`/alerts/${id}/resolve`, { method: "POST" }),
  },
  tracking: {
    get: (sessionId: string) => request<any>(`/tracking/${sessionId}`),
    update: (sessionId: string, lat: number, lng: number) =>
      request<any>(`/tracking/${sessionId}/update`, {
        method: "POST",
        body: JSON.stringify({ lat, lng }),
      }),
  },
  safety: {
    score: () => request<any>("/safety/score"),
    recommendations: () => request<any[]>("/safety/recommendations"),
  },
  family: {
    dashboard: (token: string) => request<any>(`/family/dashboard?token=${token}`),
  },
};
