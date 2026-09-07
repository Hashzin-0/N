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

    const mergeStyles = (
      child: React.ReactNode,
      overrides: React.CSSProperties,
    ): React.ReactNode => {
      if (!React.isValidElement(child)) return child;
      const existing = (child.props as Record<string, unknown>).style as
        | React.CSSProperties
        | undefined;
      return React.cloneElement(child, {
        style: { ...existing, ...overrides },
      } as never);
    };

    return (
      <div
        ref={forwardedRef}
        data-slot="css-gooey-stack"
        data-collapsed={collapsed ? "true" : undefined}
        className={`relative ${className ?? ""}`}
        style={style}
        {...props}
      >
        {/* ── Goo-filtered container: both inputs as direct children ── */}
        <div
          className="relative"
          style={{
            filter: `url(#${filterId})`,
          }}
        >
          {/* SVG Goo Filter Definition */}
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

          {/* Height ghost — single hidden element for container height */}
          <div style={{ visibility: "hidden", pointerEvents: "none" }}>
            {items[0]}
          </div>

          {/* Input 1 — always on the left, direct child */}
          {mergeStyles(items[0], {
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 2,
          })}

          {/* Input 2 — emerges from left, slides to right when expanded */}
          {items.length > 1
            ? mergeStyles(items[1], {
                position: "absolute",
                top: 0,
                left: collapsed ? 0 : undefined,
                right: collapsed ? undefined : 0,
                zIndex: 1,
                opacity: collapsed ? 0 : 1,
                transform: collapsed ? "scale(0.95)" : "scale(1)",
                transition:
                  "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              })
            : null}
        </div>
      </div>
    );
  },
);
CssGooeyStack.displayName = "CssGooeyStack";

export { CssGooeyStack };
