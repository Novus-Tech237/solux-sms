"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .school-panel {
          font-family: 'DM Sans', sans-serif;
        }

        .school-panel h1 {
          font-family: 'Playfair Display', serif;
        }

        .bg-school {
          background-image: url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80');
          background-size: cover;
          background-position: center;
        }

        .overlay {
          background: linear-gradient(
            135deg,
            rgba(10, 30, 60, 0.82) 0%,
            rgba(20, 60, 100, 0.70) 40%,
            rgba(180, 90, 20, 0.55) 100%
          );
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.13);
        }

        .badge {
          background: rgba(251, 146, 60, 0.20);
          border: 1px solid rgba(251, 146, 60, 0.45);
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

        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
        }

        .float-anim {
          animation: floatUp 0.7s ease both;
        }

        @keyframes floatUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .float-anim:nth-child(1) { animation-delay: 0.1s; }
        .float-anim:nth-child(2) { animation-delay: 0.25s; }
        .float-anim:nth-child(3) { animation-delay: 0.4s; }
        .float-anim:nth-child(4) { animation-delay: 0.55s; }
        .float-anim:nth-child(5) { animation-delay: 0.70s; }

        .back-link {
          color: rgba(255,255,255,0.65);
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
          text-decoration: none;
        }
        .back-link:hover { color: #fdba74; }

        .quote-mark {
          font-family: 'Playfair Display', serif;
          font-size: 5rem;
          line-height: 1;
          color: rgba(251,146,60,0.35);
          display: block;
          margin-bottom: -1.5rem;
        }
      `}</style>

      <div className="min-h-screen flex flex-col md:flex-row">

        {/* ── LEFT PANEL (2/3) ── */}
        <div className="basis-2/3 hidden md:flex relative overflow-hidden school-panel bg-school">

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 overlay" />

          {/* Subtle noise texture */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between w-full px-12 py-10">

            {/* Top bar */}
            <div className="flex items-center justify-between float-anim ml-auto">
              <span className="badge">School Management System</span>
            </div>

            {/* Center hero text */}
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

        {/* ── RIGHT PANEL (1/3) ── */}
        <div className="basis-1/3 flex items-center justify-center bg-white dark:bg-slate-950 min-h-screen">
          <SignIn />
        </div>

      </div>
    </>
  );
}