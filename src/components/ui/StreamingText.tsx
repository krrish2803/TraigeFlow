"use client";

import { useState, useEffect } from "react";

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  speed?: number;
  className?: string;
}

export default function StreamingText({
  text,
  isStreaming = false,
  speed = 20,
  className = "",
}: StreamingTextProps) {
  const [displayed, setDisplayed] = useState(isStreaming ? "" : text);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, isStreaming, speed]);

  return (
    <span className={className}>
      {displayed}
      {isStreaming && displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}
