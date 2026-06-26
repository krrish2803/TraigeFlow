"use client";

import { motion } from "framer-motion";
import Link from "next/link";
export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-base" />

      <motion.div
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[150px]"
        animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[120px]"
        animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(108,99,255,0.03)_0%,transparent_50%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-8 backdrop-blur-sm"
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            AI-Powered Triage for Engineering Teams
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[1.05] mb-6"
        >
          <span className="text-text-primary">Turn Noise into</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/70 to-primary/30">
            Execution-Ready Work
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Signal2Fix ingests bug reports from Slack, Gmail, GitHub, and Jira,
          runs them through a multi-agent AI pipeline, and outputs clean
          engineering tickets ready to ship.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-base font-semibold overflow-hidden shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
            >
              <span className="relative z-10">Get Started Free</span>
              <motion.span
                className="relative z-10 inline-block"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6 }}
              />
            </Link>
          </motion.div>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#features"
            className="inline-flex px-8 py-3.5 rounded-xl border border-border text-text-secondary text-base font-medium hover:border-primary/30 hover:text-text-primary hover:bg-primary/5 transition-all duration-300"
          >
            See How It Works
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#features"
            className="inline-flex px-8 py-3.5 rounded-xl border border-border text-text-secondary text-base font-medium hover:border-primary/30 hover:text-text-primary hover:bg-primary/5 transition-all duration-300"
          >
            See How It Works
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
        >
          {[
            { value: "4", label: "Sources", desc: "Slack, Gmail, GitHub, Jira" },
            { value: "12s", label: "Avg. Triage", desc: "From signal to draft" },
            { value: "94%", label: "Accuracy", desc: "Classification confidence" },
            { value: "87%", label: "Duplicates", desc: "Auto-merged" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.1 }}
              className="relative p-4 rounded-xl bg-surface/40 border border-border/50 backdrop-blur-sm hover:bg-surface/60 hover:border-primary/20 transition-all duration-300 group"
            >
              <motion.p
                className="text-3xl font-mono font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1, type: "spring", stiffness: 200 }}
              >
                {stat.value}
              </motion.p>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mt-1.5">
                {stat.label}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{stat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
