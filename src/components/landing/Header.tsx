"use client";

import { motion } from "framer-motion";
import Navbar from "./Navbar";

export default function LandingHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Navbar />
    </motion.header>
  );
}
