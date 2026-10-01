import { useLayoutEffect, useState } from 'react';

// Reserve space for the mobile guide, then keep its target above the dock.
export default function useMobileTourLayout(selector, cardRef, ready = true) {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.visualViewport?.height || window.innerHeight, top: window.visualViewport?.offsetTop || 0 }));
  const mobile = viewport.width <= 760 || viewport.height <= 500;

  useLayoutEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.visualViewport?.height || window.innerHeight, top: window.visualViewport?.offsetTop || 0 });
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  useLayoutEffect(() => {
    if (!mobile || !selector || !ready) return undefined;
    const target = document.querySelector(selector);
    const card = cardRef.current;
    if (!target || !card) return undefined;
    let scroller = target.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    scroller ||= document.scrollingElement;
    const oldTourState = document.body.getAttribute('data-mobile-tour');
    document.body.setAttribute('data-mobile-tour', 'active');
    const oldPadding = scroller.style.paddingBottom;
    const basePadding = parseFloat(getComputedStyle(scroller).paddingBottom) || 0;
    let frame;
    const position = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cardHeight = card.offsetHeight;
        scroller.style.paddingBottom = `${basePadding + cardHeight + 32}px`;
        const bounds = scroller === document.scrollingElement ? { top: viewport.top } : scroller.getBoundingClientRect();
        const visibleTop = Math.max(viewport.top + 16, bounds.top + 16);
        const visibleBottom = card.getBoundingClientRect().top - 20;
        const rect = target.getBoundingClientRect();
        const desiredTop = visibleTop + Math.max(0, (visibleBottom - visibleTop - rect.height) / 2);
        scroller.scrollBy({ top: rect.top - desiredTop, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      });
    };
    const observer = new ResizeObserver(position);
    observer.observe(card);
    observer.observe(target);
    position();
    const settleTimers = [120, 650].map(delay => window.setTimeout(position, delay));
    return () => {
      settleTimers.forEach(window.clearTimeout);
      if (oldTourState === null) document.body.removeAttribute('data-mobile-tour');
      else document.body.setAttribute('data-mobile-tour', oldTourState);
      cancelAnimationFrame(frame);
      observer.disconnect();
      scroller.style.paddingBottom = oldPadding;
    };
  }, [selector, mobile, viewport.width, viewport.height, viewport.top, cardRef, ready]);

  return mobile ? {
    top: 'auto', bottom: `calc(${Math.max(0, window.innerHeight - viewport.top - viewport.height) + 12}px + env(safe-area-inset-bottom, 0px))`,
    left: 12, width: viewport.width - 24, maxHeight: Math.floor(viewport.height * 0.44),
    overflowY: 'auto', pointerEvents: 'auto',
  } : null;
}
