"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTimeTheme } from "@/hooks/useTimeTheme";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timeTheme = useTimeTheme();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
        router.push("/dashboard");
      
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-root *, .login-root *::before, .login-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          flex: 0 0 50%;
          background: #0d1b3e;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(30, 58, 138, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(14, 44, 99, 0.8) 0%, transparent 50%),
            linear-gradient(135deg, #0a1628 0%, #0d2152 50%, #0a1628 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 56px;
          position: relative;
          overflow: hidden;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .left-logo {
          position: absolute;
          top: 32px;
          left: 40px;
          opacity: 0.85;
        }

        .left-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 420px;
        }

        .left-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2.2rem;
          font-weight: 400;
          color: #ffffff;
          line-height: 1.3;
          margin-bottom: 24px;
        }

        .left-title strong {
          font-weight: 400;
        }

        .left-desc {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.72);
          line-height: 1.75;
          margin-bottom: 48px;
        }

        .left-desc .highlight {
          color: #4da6ff;
          font-weight: 600;
        }

        .left-stats {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .stat-card {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 16px 24px;
          text-align: center;
          backdrop-filter: blur(8px);
          min-width: 100px;
        }

        .stat-value {
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 6px;
        }

        .stat-label {
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
        }

        /* ── RIGHT PANEL ── */
        .right-panel {
          flex: 0 0 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 72px;
          transition: background 1.2s ease;
        }

        .right-inner {
          width: 100%;
          max-width: 400px;
        }

        .right-logo {
          margin-bottom: 28px;
        }

        .secure-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0f4ff;
          border: 1px solid #d0daf5;
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #3b5998;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .secure-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }

        .form-heading {
          font-family: 'DM Serif Display', serif;
          font-size: 1.9rem;
          font-weight: 400;
          color: #111827;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .form-heading span {
          color: #1e3a8a;
          display: block;
        }

        .heading-rule {
          width: 40px;
          height: 3px;
          background: #1e3a8a;
          border-radius: 2px;
          margin: 14px 0 16px;
        }

        .form-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .field-group {
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #374151;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .field-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .field-input {
          width: 100%;
          padding: 13px 16px 13px 42px;
          background: #f3f6fd;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #111827;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .field-input:focus {
          border-color: #1e3a8a;
          background: #f8faff;
        }

        .field-input::placeholder {
          color: #9ca3af;
        }

        .toggle-pw {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }

        .toggle-pw:hover { color: #374151; }

        .error-msg {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.83rem;
          color: #dc2626;
          margin-bottom: 20px;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 4px;
        }

        .submit-btn:hover:not(:disabled) {
          background: #1e3a8a;
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .form-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 18px;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .left-panel { display: none; }
          .right-panel { flex: 1; padding: 40px 28px; }
        }
      `}</style>

      <div className="login-root">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="left-logo">
            <img src="https://ifdainstitute.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.1e16a6e7.png&w=256&q=75" alt="IFDA" width={90} height={36} style={{ filter: "brightness(0) invert(1)", opacity: 0.7 }} />
          </div>

          <div className="left-content">
            <h1 className="left-title">
              Delhi's Best Computer Training Institute for Professional Computer Courses
            </h1>
            <p className="left-desc">
              IFDA Institute is known for its{" "}
              <span className="highlight">125+ AI-Integrated Skill Development Programs</span>,
              professional computer courses, and practical industry-focused training. With thousands of
              successful students and years of trust, we help learners build{" "}
              <span className="highlight">real skills for modern careers.</span> 🚀
            </p>

            <div className="left-stats">
              <div className="stat-card">
                <div className="stat-value">500+</div>
                <div className="stat-label">Students</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">24</div>
                <div className="stat-label">Courses</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">98%</div>
                <div className="stat-label">Placement</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel" style={{ background: timeTheme.cardBackground }}>
          <div className="right-inner">
            <div className="right-logo">
              <img src="https://tse2.mm.bing.net/th/id/OIP.NlNOpdTzHb0YVEGsahv1WAHaCN?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" alt="IFDA Institute" width={220} height={72} style={{ objectFit: "contain" }} />
            </div>

            <div className="secure-badge" style={{ background: `${timeTheme.accentColor}18`, borderColor: `${timeTheme.accentColor}44`, color: timeTheme.accentColor }}>
              <span className="secure-dot" style={{ background: timeTheme.accentColor }} />
              Secure Portal
            </div>

            {/* Time-based greeting */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: timeTheme.accentColor,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              transition: "color 0.6s ease",
            }}>
              <span style={{ fontSize: "1.1rem" }}>{timeTheme.icon}</span>
              {timeTheme.greeting}
            </div>

            <h2 className="form-heading" style={{ color: timeTheme.textColor }}>
              Task Management
              <span style={{ color: timeTheme.accentColor }}>System Portal</span>
            </h2>
            <div className="heading-rule" style={{ background: timeTheme.accentColor }} />
            <p className="form-subtitle" style={{ color: timeTheme.mutedTextColor }}>
              Sign in with your admin credentials to access the dashboard.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="field-group">
                <label className="field-label" htmlFor="email" style={{ color: timeTheme.subTextColor }}>Email Address</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    style={{ background: timeTheme.inputBackground, borderColor: timeTheme.inputBorder, color: timeTheme.textColor }}
                    placeholder="admin@ifdadigitalai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field-group">
                <label className="field-label" htmlFor="password" style={{ color: timeTheme.subTextColor }}>Password</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="field-input"
                    style={{ background: timeTheme.inputBackground, borderColor: timeTheme.inputBorder, color: timeTheme.textColor }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" className="submit-btn" style={{ background: timeTheme.accentColor }} disabled={loading}>
                {loading ? "Signing in…" : "Sign In to Dashboard"}
              </button>
            </form>

            <div className="form-footer" style={{ color: timeTheme.mutedTextColor }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Secured by 256-bit encryption
            </div>
          </div>
        </div>
      </div>
    </>
  );
}