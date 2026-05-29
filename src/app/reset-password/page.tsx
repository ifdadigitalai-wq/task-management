"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSent(true);
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

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rp-root {
          min-height: 100vh;
          background: #f3f6fd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
        }

        .rp-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 48px 44px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
        }

        .rp-logo {
          margin-bottom: 32px;
        }

        .rp-logo img {
          height: 52px;
          width: auto;
          object-fit: contain;
        }

        .rp-icon-wrap {
          width: 48px;
          height: 48px;
          background: #eef2ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: #1e3a8a;
        }

        .rp-heading {
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          font-weight: 400;
          color: #111827;
          margin-bottom: 8px;
        }

        .rp-heading span {
          color: #1e3a8a;
        }

        .heading-rule {
          width: 36px;
          height: 3px;
          background: #1e3a8a;
          border-radius: 2px;
          margin: 12px 0 14px;
        }

        .rp-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 28px;
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
          margin-bottom: 20px;
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

        .field-input::placeholder { color: #9ca3af; }

        .error-msg {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.83rem;
          color: #dc2626;
          margin-bottom: 16px;
        }

        .success-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .success-icon {
          color: #16a34a;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .success-text {
          font-size: 0.875rem;
          color: #15803d;
          line-height: 1.5;
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
        }

        .submit-btn:hover:not(:disabled) { background: #1e3a8a; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 20px;
          font-size: 0.83rem;
          color: #6b7280;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }

        .back-link:hover { color: #1e3a8a; }
      `}</style>

      <div className="rp-root">
        <div className="rp-card">

          <div className="rp-logo">
            <img src="https://tse2.mm.bing.net/th/id/OIP.NlNOpdTzHb0YVEGsahv1WAHaCN?r=0&rs=1&pid=ImgDetMain&o=7&rm=3" alt="IFDA Institute" />
          </div>

          <div className="rp-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h2 className="rp-heading">
            Reset your <span>Password</span>
          </h2>
          <div className="heading-rule" />
          <p className="rp-subtitle">
            Enter your registered email address or phone number and we'll send you a reset link.
          </p>

          {sent ? (
            <>
              <div className="success-box">
                <span className="success-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </span>
                <p className="success-text">
                  Reset link sent! Check your email or phone for further instructions.
                </p>
              </div>
              <button className="submit-btn" onClick={() => router.push("/login")}>
                Back to Sign In
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="identifier">
                Email or Phone Number
              </label>
              <div className="field-wrap">
                <span className="field-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  id="identifier"
                  type="text"
                  className="field-input"
                  placeholder="email@ifdadigitalai.com or 9XXXXXXXXX"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Sending…" : "Get Reset Link"}
              </button>
            </form>
          )}

          <button className="back-link" onClick={() => router.push("/login")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Sign In
          </button>

        </div>
      </div>
    </>
  );
}