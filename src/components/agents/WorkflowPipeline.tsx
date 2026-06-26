"use client";

import { motion } from "framer-motion";
import AgentStatusNode from "./AgentStatusNode";
import { AGENTS, type AgentName } from "@/lib/constants";

interface WorkflowPipelineProps {
  activeStep?: AgentName;
  completedSteps?: AgentName[];
  runCount?: number;
  className?: string;
}

export default function WorkflowPipeline({
  activeStep,
  completedSteps = [],
  runCount,
  className = "",
}: WorkflowPipelineProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {AGENTS.map((agent, i) => {
        const status = completedSteps.includes(agent)
          ? "done"
          : agent === activeStep
          ? "running"
          : "idle";

        return (
          <div key={agent} className="flex items-center">
            <div className="relative">
              <AgentStatusNode agent={agent} status={status} isActive={agent === activeStep} />
              {agent === activeStep && runCount && (
                <span className="absolute -top-2 -right-2 bg-primary text-[9px] font-mono text-white px-1.5 py-0.5 rounded-full leading-none">
                  {runCount}
                </span>
              )}
            </div>
            {i < AGENTS.length - 1 && (
              <div className="w-10 h-[2px] mx-1 relative">
                <div className="absolute inset-0 bg-border rounded-full" />
                {status === "done" && (
                  <motion.div
                    className="absolute inset-0 bg-success rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ transformOrigin: "left" }}
                  />
                )}
                {agent === activeStep && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
                    animate={{ left: ["0%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
