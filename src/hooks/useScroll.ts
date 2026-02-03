import { useEffect, useRef, useState } from 'react';

export function useScroll(maxOffset: number) {
  const [offset, setOffset] = useState(0);

  const lastScrollY = useRef(0);
  const currentOffset = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY.current;

      currentOffset.current = Math.min(
        maxOffset,
        Math.max(0, currentOffset.current + delta),
      );

      setOffset(currentOffset.current);
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [maxOffset]);

  return offset;
}
