const API_BASE = "http://localhost:3000/api";

async function get(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getHealth: () => get("/health"),
  getRepositories: () => get("/repositories"),
  getSessions: () => get("/sessions"),
  getTasks: () => get("/tasks"),
  getAgents: () => get("/agents"),
  getAnalytics: () => get("/analytics"),
};