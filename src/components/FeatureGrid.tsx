"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/constants/mockData";

export default function FeatureGrid() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3">
            From Chaos to Clarity
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm">
            Every feature closes the gap between a user complaining in Slack and an engineer shipping a fix.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative p-6 rounded-xl border border-border bg-surface overflow-hidden"
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <motion.div
                  className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-lg mb-4"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                >
                  {feature.icon}
                </motion.div>

                <h3 className="text-base font-display font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {feature.description}
                </p>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 border border-primary/10"
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[10px] font-mono font-medium text-primary">{feature.stat}</span>
                </motion.div>
              </div>

              <motion.div
                className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/5 blur-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
