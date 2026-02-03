import { useEffect, useRef, useState } from 'react';

export function useScroll(maxOffset: number) {
  const [offset, setOffset] = useState(0);

  const lastScrollY = useRef(0);
  const currentOffset = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;

      ticking.current = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;

        // ✅ HARD RESET at top (mobile fix)
        if (scrollY <= 0) {
          if (currentOffset.current !== 0) {
            currentOffset.current = 0;
            setOffset(0);
          }
          lastScrollY.current = 0;
          ticking.current = false;
          return;
        }

        const delta = scrollY - lastScrollY.current;
        lastScrollY.current = scrollY;

        const nextOffset = Math.min(
          maxOffset,
          Math.max(0, currentOffset.current + delta),
        );

        // ✅ avoid unnecessary re-renders
        if (nextOffset !== currentOffset.current) {
          currentOffset.current = nextOffset;
          setOffset(nextOffset);
        }

        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [maxOffset]);

  return offset;
}
