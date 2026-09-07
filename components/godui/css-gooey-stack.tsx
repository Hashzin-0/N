"use client";

import * as React from "react";

export type CssGooeyStackProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  children?: React.ReactNode;
  collapsed?: boolean;
};

const CssGooeyStack = React.forwardRef<HTMLDivElement, CssGooeyStackProps>(
  (
    {
      children,
      collapsed = false,
      className,
      style,
      ...props
    },
    forwardedRef,
  ) => {
    const id = React.useId();
    const filterId = `gooey-stack-${id}`;
    const items = React.Children.toArray(children);

    return (
      <div
        ref={forwardedRef}
        data-slot="css-gooey-stack"
        data-collapsed={collapsed ? "true" : undefined}
        className={`relative ${className ?? ""}`}
        style={style}
        {...props}
      >
        {/* ── SVG Goo Filter Definition ──────────────────────────────── */}
        <svg
          style={{ position: "absolute", width: 0, height: 0 }}
          aria-hidden="true"
        >
          <defs>
            <filter id={filterId}>
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="10"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* ── Goo-filtered layer: absolutely positioned inputs ──────── */}
        <div
          className="relative"
          style={{
            filter: `url(#${filterId})`,
          }}
        >
          {/* Height spacer — preserves container height (absolute children don't) */}
          <div style={{ visibility: "hidden", pointerEvents: "none" }}>
            {items[0]}
          </div>

          {/* First input — centered when collapsed, left when expanded */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: collapsed ? "50%" : "0",
              transform: collapsed ? "translateX(-50%)" : "none",
              zIndex: 2,
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {items[0]}
          </div>

          {/* Second input — hidden when collapsed, right when expanded */}
          {items.length > 1 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                right: "0",
                zIndex: 1,
                opacity: collapsed ? 0 : 1,
                transform: collapsed ? "scale(0.95) translateX(20px)" : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {items[1]}
            </div>
          )}
        </div>
      </div>
    );
  },
);
CssGooeyStack.displayName = "CssGooeyStack";

export { CssGooeyStack };
