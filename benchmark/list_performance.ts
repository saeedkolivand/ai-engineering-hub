/**
 * Simple performance benchmark for the virtualized list component.
 *
 * It mounts a TanStack Virtual list with 1 000 000 rows and measures the time
 * required for the first render and for scrolling through 100 rows.
 *
 * Run with: `pnpm ts-node benchmark/list_performance.ts`
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Virtualizer } from '@tanstack/react-virtual';
import { PerformanceObserver, performance } from 'perf_hooks';

function VirtualList({ itemCount }: { itemCount: number }) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = Virtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // each row ~35 px
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: '400px',
        width: '100%',
        overflow: 'auto',
        border: '1px solid #ccc',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            Row #{virtualRow.index}
          </div>
        ))}
      </div>
    </div>
  );
}

// Measure first render time
performance.mark('render-start');
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<VirtualList itemCount={1_000_000} />);
performance.mark('render-end');
performance.measure('first-render', 'render-start', 'render-end');

// Scroll 100 rows and measure time
const scrollContainer = container.firstElementChild as HTMLElement;
const virtualizerInstance = (scrollContainer?.firstElementChild as any)
  ._reactRootContainer?._internalRoot?.current?.child?.stateNode?.virtualizer;

if (virtualizerInstance) {
  performance.mark('scroll-start');
  virtualizerInstance.scrollToIndex(100);
  performance.mark('scroll-end');
  performance.measure('scroll-100', 'scroll-start', 'scroll-end');
}

// Output results
const obs = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration.toFixed(2)} ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });