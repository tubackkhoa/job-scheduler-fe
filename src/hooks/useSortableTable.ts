import { useEffect, useRef } from 'react';

export const useSortableTable = () => {
  const ref = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const table = ref.current;
    if (!table) return;

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    const headers = Array.from(thead.querySelectorAll('th'));

    headers.forEach((th, columnIndex) => {
      let direction: 'asc' | 'desc' = 'asc';
      th.setAttribute('aria-sort', 'none');

      th.onclick = () => {
        const rows = Array.from(tbody.querySelectorAll('tr'));

        const sorted = rows.sort((a, b) => {
          const aText = a.children[columnIndex]?.textContent?.trim() ?? '';
          const bText = b.children[columnIndex]?.textContent?.trim() ?? '';

          const aNum = Number(aText);
          const bNum = Number(bText);
          const numeric = !Number.isNaN(aNum) && !Number.isNaN(bNum);

          if (numeric) {
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
          }

          return direction === 'asc'
            ? aText.localeCompare(bText)
            : bText.localeCompare(aText);
        });

        headers.forEach((h) => h.setAttribute('aria-sort', 'none'));

        direction = direction === 'asc' ? 'desc' : 'asc';
        th.setAttribute('aria-sort', direction);

        sorted.forEach((tr) => tbody.appendChild(tr));
      };
    });
  }, []);

  return ref;
};
