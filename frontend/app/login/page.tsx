"use client";

import { useState } from "react";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, enterDemoMode } = useAuth();
  const [username, setUsername] = useState("admin@sapd.gov");
  const [password, setPassword] = useState("AdminPass1234!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await login(username, password);
    if (!ok) {
      setError(
        "Login failed. Run ./scripts/seed-demo-user.sh to create test users, or check gateway (:8000) and auth (:8001) are running."
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0d1321] items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, rgba(6,182,212,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(59,130,246,0.3) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-md px-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">BlueCore</h1>
              <p className="text-sm text-slate-500">Unified Operations Platform</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            CJIS-compliant command center with real-time alert streaming, CAD integration, AI report writing,
            and cross-agency intelligence.
          </p>
          <div className="space-y-3">
            {["Real-Time Alert Engine", "WebSocket Live Feed", "Threat Prioritization", "Immutable Audit Logging"].map(
              (f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-1 h-1 rounded-full bg-cyan-500" />
                  {f}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span className="text-lg font-semibold text-white">BlueCore</span>
          </div>

          <h2 className="text-xl font-semibold text-white mb-1">Secure Sign In</h2>
          <p className="text-sm text-slate-500 mb-6">Authenticate via BlueCore API Gateway</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="admin@sapd.gov"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {loading ? "Authenticating…" : "Sign In"}
            </button>
          </form>

          <button
            type="button"
            onClick={enterDemoMode}
            className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 py-2"
          >
            Continue in read-only demo mode (no database writes)
          </button>

          <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800 rounded-md space-y-2">
            <p className="text-[10px] text-slate-400">
              <span className="text-cyan-400 font-medium">Test admin:</span> admin@sapd.gov / AdminPass1234!
            </p>
            <p className="text-[10px] text-slate-500">
              Seed users: <code className="text-slate-400">./scripts/seed-demo-user.sh</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
