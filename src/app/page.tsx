"use client";

import Link from "next/link";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useToast } from "react-toastify";


export default function SignInPage() {
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLoaded) return;
    const role = user?.publicMetadata.role;
    if (isSignedIn && role) {
      router.push(`/${role}`);
    }
  }, [userLoaded, isSignedIn, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ identifier, password });
      if (result.status === "complete") {
        toast.success("Signed in successfully!");
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .school-panel { font-family: 'DM Sans', sans-serif; }
        .school-panel h1 { font-family: 'Playfair Display', serif; }
        .bg-school {
          background-image: url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80');
          background-size: cover;
          background-position: center;
        }
        .overlay {
          background: linear-gradient(135deg, rgba(10,30,60,0.82) 0%, rgba(20,60,100,0.70) 40%, rgba(180,90,20,0.55) 100%);
        }
        .badge {
          background: rgba(251,146,60,0.20);
          border: 1px solid rgba(251,146,60,0.45);
          color: #fdba74;
          border-radius: 999px;
          padding: 4px 14px;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          display: inline-block;
          cursor: default;
        }
        .float-anim { animation: floatUp 0.7s ease both; }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .float-anim:nth-child(1) { animation-delay: 0.1s; }
        .float-anim:nth-child(2) { animation-delay: 0.25s; }
        .float-anim:nth-child(3) { animation-delay: 0.4s; }
        .float-anim:nth-child(4) { animation-delay: 0.55s; }
        .float-anim:nth-child(5) { animation-delay: 0.70s; }
        .quote-mark {
          font-family: 'Playfair Display', serif;
          font-size: 5rem;
          line-height: 1;
          color: rgba(251,146,60,0.35);
          display: block;
          margin-bottom: -1.5rem;
        }
        .sign-in-input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
          color: #111827;
          background: #f9fafb;
        }
        .sign-in-input:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
          background: #fff;
        }
        .sign-in-btn {
          width: 100%;
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 11px 0;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          font-family: 'DM Sans', sans-serif;
          margin-top: 4px;
        }
        .sign-in-btn:hover:not(:disabled) {
          background: #1f2937;
          transform: translateY(-1px);
        }
        .sign-in-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="min-h-screen flex flex-col md:flex-row">

        {/* LEFT PANEL */}
        <div className="basis-2/3 hidden md:flex relative overflow-hidden school-panel bg-school">
          <div className="absolute inset-0 overlay" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />
          <div className="relative z-10 flex flex-col justify-between w-full px-12 py-10">
            <div className="flex items-center justify-between float-anim ml-auto">
              <span className="badge">School Management System</span>
            </div>
            <div className="flex flex-col gap-6 pb-[14rem]">
              <div className="float-anim">
                <span className="quote-mark">&ldquo;</span>
                <h1 className="text-white text-4xl xl:text-5xl font-bold leading-tight">
                  Empowering <span className="text-orange-400">Every Learner,</span><br />
                  Every Day.
                </h1>
              </div>
              <p className="text-white/60 text-sm xl:text-base max-w-sm leading-relaxed float-anim">
                A unified platform for teachers, students, and administrators —
                streamlining education from classroom to graduation.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="basis-1/3 flex flex-col justify-between bg-white min-h-screen px-12 py-10 school-panel">

          {/* Top: branding — centered */}
          <div className="flex justify-center">
            <Image
              src={"/logo_a.png"}
              alt="Solux Schools Logo"
              width={150}
              height={50}
            />
          </div>

          {/* Middle: form */}
          <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-orange-400 mb-2">Welcome back</p>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sign in to your account
              </h2>
              <p className="text-gray-400 text-sm mt-1">Enter your credentials to continue.</p>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Username</label>
                <input
                  className="sign-in-input"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Password</label>
                <input
                  className="sign-in-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <button className="sign-in-btn" type="submit" disabled={loading || !isLoaded}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          {/* Bottom: footer */}
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} Solux Schools. All rights reserved.
          </p>

        </div>
      </div>
    </>
  );
}