"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FOOTER_LINKS } from "@/constants/mockData";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="border-t border-border bg-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/[0.02]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              F2F
            </Link>
            <p className="text-xs text-text-secondary mt-3 leading-relaxed max-w-xs">
              Feedback-to-Fix Operator converts scattered bug reports into execution-ready engineering tickets. AI-powered triage for small teams.
            </p>

            <form onSubmit={handleSubmit} className="mt-5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted block mb-2">
                Stay Updated
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-elevated/50 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  {subscribed ? "✓ Sent" : "Subscribe"}
                </motion.button>
              </div>
            </form>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-text-muted">
            © {new Date().getFullYear()} Feedback-to-Fix Operator. All rights reserved.
          </p>
          <p className="text-[10px] text-text-muted text-center md:text-right">
            Built for engineering teams who deserve better than a shared Slack channel of bug reports.
          </p>
        </div>
      </div>
    </footer>
  );
}
