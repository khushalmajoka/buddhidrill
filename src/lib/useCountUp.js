import { useEffect, useState, useRef } from "react";

/* ============================================================
   useCountUp — animates a displayed integer from 0 up to `target`
   over `duration` ms whenever `target` changes (and `active` is
   true). Used on results screens so the score doesn't just pop in.
   ============================================================ */
export default function useCountUp(target, active = true, duration = 700) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) {
      const t = setTimeout(() => setValue(target), 0);
      return () => clearTimeout(t);
    }
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, active, duration]);

  return value;
}
