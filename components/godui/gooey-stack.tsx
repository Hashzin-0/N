"use client";

import { motion, useReducedMotion } from "motion/react";
import * as React from "react";

export type GooeyStackProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  children?: React.ReactNode;
  gap?: number;
  collapsed?: boolean;
  expandedGap?: number;
  collapsedGap?: number;
  gooeyness?: number;
  radius?: number;
};

const SPRING = {
  type: "spring",
  stiffness: 130,
  damping: 24,
  mass: 1.2,
} as const;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const GooeyStack = React.forwardRef<HTMLDivElement, GooeyStackProps>(
  (
    {
      children,
      gap,
      collapsed = false,
      expandedGap = 18,
      collapsedGap = -48,
      gooeyness = 10,
      radius = 28,
      className,
      style,
      ...props
    },
    forwardedRef,
  ) => {
    const reduce = useReducedMotion() ?? false;
    const filterId = React.useId().replace(/:/g, "");

    const items = React.Children.toArray(children);
    const n = items.length;

    const g = gap ?? (collapsed ? collapsedGap : expandedGap);

    const contentRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const [widths, setWidths] = React.useState<number[]>(() =>
      items.map(() => 0),
    );

    React.useLayoutEffect(() => {
      const measure = () => {
        setWidths(contentRefs.current.map((el) => el?.offsetWidth ?? 0));
      };
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(measure);
      for (const el of contentRefs.current) {
        if (el) ro.observe(el);
      }
      return () => ro.disconnect();
    }, [n]);

    const widthsToRight = (i: number) => {
      let d = 0;
      for (let j = i + 1; j < n; j++) d += widths[j] ?? 0;
      return d;
    };
    const cardsToRight = (i: number) => n - 1 - i;

    const expandedTotal =
      widths.reduce((s, w) => s + w, 0) + Math.max(0, n - 1) * expandedGap;

    const merge = clamp(-g / -Math.min(collapsedGap, -1), 0, 1);

    const stateOf = (i: number) => {
      const rank = cardsToRight(i);
      const rightExpanded = widthsToRight(i) + rank * expandedGap;
      const rightNow = widthsToRight(i) + rank * g;
      const x = rightExpanded - rightNow;
      if (rank === 0) {
        return { x: 0, scale: 1, opacity: 1, silOpacity: 1, blur: 0 };
      }
      return {
        x,
        scale: 1 - rank * 0.05 * merge,
        opacity: Math.max(0, 1 - rank * 1.1 * merge),
        silOpacity: Math.max(0, 1 - merge),
        blur: Math.min(16, rank * 13 * merge),
      };
    };

    const rightOf = (i: number) =>
      widthsToRight(i) + cardsToRight(i) * expandedGap;
    const transition = reduce ? { duration: 0 } : SPRING;

    return (
      <div
        ref={forwardedRef}
        data-slot="gooey-stack"
        data-collapsed={g < expandedGap ? "true" : undefined}
        className={`relative flex items-center ${className ?? ""}`}
        style={{
          height: expandedTotal || undefined,
          ...style,
        }}
        {...props}
      >
        {/* Goo filter */}
        <svg aria-hidden="true" className="pointer-events-none absolute size-0">
          <defs>
            <filter
              id={filterId}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation={gooeyness}
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 80 -40"
                result="goo"
              />
              <feFlood
                style={{ floodColor: "var(--card)" }}
                result="cardColor"
              />
              <feComposite
                in="cardColor"
                in2="goo"
                operator="in"
                result="fillLayer"
              />
              <feGaussianBlur in="goo" stdDeviation="1.1" result="edge" />
              <feColorMatrix
                in="edge"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 50 -41"
                result="eroded"
              />
              <feComposite in="goo" in2="eroded" operator="out" result="ring" />
              <feFlood
                style={{ floodColor: "var(--border)" }}
                result="borderColor"
              />
              <feComposite
                in="borderColor"
                in2="ring"
                operator="in"
                result="borderLayer"
              />
              <feMerge result="surface">
                <feMergeNode in="fillLayer" />
                <feMergeNode in="borderLayer" />
              </feMerge>
              <feGaussianBlur in="surface" stdDeviation="0.4" />
            </filter>
          </defs>
        </svg>

        {/* Reduced-motion fallback */}
        <div className="absolute inset-0" style={{ opacity: reduce ? 1 : 0 }}>
          {items.map((_, i) => {
            const s = stateOf(i);
            return (
              <motion.div
                key={i}
                className="absolute inset-y-0 border border-border bg-card"
                style={{
                  right: rightOf(i),
                  width: widths[i] || undefined,
                  borderRadius: radius,
                  zIndex: i,
                }}
                initial={false}
                animate={{ x: s.x, scale: s.scale, opacity: s.opacity }}
                transition={transition}
              />
            );
          })}
        </div>

        {/* SVG goo surface — horizontal rects */}
        <motion.svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-visible [transform:translateZ(0)]"
          width="100%"
          height="100%"
          style={{ opacity: reduce ? 0 : 1 }}
        >
          <g filter={reduce ? undefined : `url(#${filterId})`}>
            {items.map((_, i) => {
              const s = stateOf(i);
              const rightPos = rightOf(i);
              const totalW = expandedTotal || 0;
              const leftPos = totalW - rightPos - (widths[i] ?? 0);
              return (
                <motion.rect
                  key={i}
                  x={leftPos}
                  y={0}
                  width={widths[i] || 0}
                  height="100%"
                  rx={radius}
                  fill="#000"
                  initial={false}
                  animate={{ x: s.x, opacity: s.silOpacity }}
                  transition={transition}
                />
              );
            })}
          </g>
        </motion.svg>

        {/* Content layer */}
        <div className="absolute inset-0 flex items-center">
          {items.map((child, i) => {
            const s = stateOf(i);
            return (
              <motion.div
                key={i}
                ref={(el) => {
                  contentRefs.current[i] = el;
                }}
                className="absolute inset-y-0"
                style={{ right: rightOf(i), zIndex: i }}
                initial={false}
                animate={{
                  x: s.x,
                  scale: s.scale,
                  opacity: s.opacity,
                  filter: reduce ? "blur(0px)" : `blur(${s.blur}px)`,
                }}
                transition={transition}
              >
                {child}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  },
);
GooeyStack.displayName = "GooeyStack";

export { GooeyStack };
