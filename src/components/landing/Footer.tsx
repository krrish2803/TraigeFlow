"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const FOOTER_SECTIONS = {
  Product: ["Features", "Pricing", "Integrations", "Changelog"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Resources: ["Docs", "API Reference", "Status", "GitHub"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: -10, scale: 1.05 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/25"
              >
                S2
              </motion.div>
              <span className="text-lg font-display font-bold text-text-primary group-hover:text-primary transition-colors">
                Signal2Fix
              </span>
            </Link>
            <p className="text-xs text-text-secondary mt-4 leading-relaxed max-w-xs">
              AI-powered feedback-to-fix pipeline. Ingest, triage, and ship fixes faster.
            </p>

            <div className="flex items-center gap-3 mt-6">
              {["GH", "X", "LI", "D"].map((social) => (
                <motion.a
                  key={social}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-elevated/50 border border-border/60 flex items-center justify-center text-[10px] font-mono font-bold text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  {social}
                </motion.a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_SECTIONS).map(([category, links], sectionIdx) => (
            <div key={category}>
              <motion.h4
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIdx * 0.05 }}
                className="text-xs font-semibold uppercase tracking-wider text-text-primary mb-5"
              >
                {category}
              </motion.h4>
              <ul className="space-y-3">
                {links.map((link, linkIdx) => (
                  <motion.li
                    key={link}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: sectionIdx * 0.05 + linkIdx * 0.03 }}
                  >
                    <a
                      href="#"
                      className="text-xs text-text-secondary hover:text-text-primary transition-colors relative group inline-block"
                    >
                      {link}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-200 group-hover:w-full" />
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <p className="text-[10px] text-text-muted">
              © {new Date().getFullYear()} Signal2Fix. All rights reserved.
            </p>
            <span className="text-[10px] text-text-muted">|</span>
            <p className="text-[10px] text-text-muted">
              Made for teams who ship
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-text-muted">v2.0.0</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5 text-[10px] text-success">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-success"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              All systems operational
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
