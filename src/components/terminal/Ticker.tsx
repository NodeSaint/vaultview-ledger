"use client";

import { useEffect, useRef } from "react";

interface TickerItem {
  symbol: string;
  price: string;
  change: "up" | "down" | "flat";
}

interface TickerProps {
  items: TickerItem[];
}

export function Ticker({ items }: TickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let animationId: number;
    let position = 0;

    const scroll = () => {
      position -= 0.5;
      if (Math.abs(position) >= el.scrollWidth / 2) {
        position = 0;
      }
      el.style.transform = `translateX(${String(position)}px)`;
      animationId = requestAnimationFrame(scroll);
    };
    animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [items]);

  const changeColour = (change: TickerItem["change"]) => {
    if (change === "up") return "text-phosphor";
    if (change === "down") return "text-red";
    return "text-text-dim";
  };

  const changeArrow = (change: TickerItem["change"]) => {
    if (change === "up") return "▲";
    if (change === "down") return "▼";
    return "─";
  };

  const tickerContent = items.map((item, i) => (
    <span key={i} className="mx-4 inline-block whitespace-nowrap text-xs">
      <span className="text-amber">{item.symbol}</span>
      <span className="mx-1 text-text-dim">$</span>
      <span className={changeColour(item.change)}>{item.price}</span>
      <span className={`ml-1 ${changeColour(item.change)}`}>
        {changeArrow(item.change)}
      </span>
    </span>
  ));

  return (
    <div
      className="overflow-hidden border-y border-border py-1"
      aria-label="Price ticker"
      role="marquee"
    >
      <div ref={scrollRef} className="inline-flex">
        {tickerContent}
        {tickerContent}
      </div>
    </div>
  );
}
