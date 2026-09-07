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
        {/* ── CSS Gooey filter layer ─────────────────────────────── */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            filter: collapsed ? "blur(10px) contrast(30)" : "none",
            transition: "filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Background matching card color for seamless effect */}
          <div
            className="absolute inset-0 bg-card"
            style={{
              opacity: collapsed ? 1 : 0,
              transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {/* Blob elements that merge when collapsed */}
          {items.map((_, i) => (
            <div
              key={i}
              className="absolute inset-y-0 bg-card rounded-2xl border border-border"
              style={{
                right: collapsed ? `${i * 2}px` : `${i * 12}px`,
                width: "100%",
                opacity: collapsed ? Math.max(0, 1 - i * 0.5) : 1,
                transform: collapsed ? `scale(${1 - i * 0.05})` : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          ))}
        </div>

        {/* ── Content layer: children, never filtered ────────────── */}
        <div className="relative flex items-center">
          {items.map((child, i) => (
            <div
              key={i}
              className="relative"
              style={{
                marginRight: collapsed && i < items.length - 1 ? "-48px" : "0px",
                zIndex: items.length - i,
                opacity: collapsed && i > 0 ? 0 : 1,
                transform: collapsed && i > 0 ? "scale(0.95)" : "scale(1)",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
CssGooeyStack.displayName = "CssGooeyStack";

export { CssGooeyStack };
