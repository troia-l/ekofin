import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import './JuryDemoTour.css';

const JuryDemoTour = ({ steps, onFinish, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [cardHeight, setCardHeight] = useState(0);
  const cardRef = useRef(null);
  const activeStep = steps[stepIndex];

  const updateTarget = useCallback(() => {
    const element = activeStep?.target ? document.querySelector(activeStep.target) : null;
    if (!element) {
      setTargetRect(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    const padding = 10;
    const nextRect = {
      top: Math.max(8, rect.top - padding),
      left: Math.max(8, rect.left - padding),
      right: Math.min(window.innerWidth - 8, rect.right + padding),
      bottom: Math.min(window.innerHeight - 8, rect.bottom + padding),
      width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
      height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
    };
    setTargetRect(previous => {
      if (previous && Object.keys(nextRect).every(key => Math.abs(previous[key] - nextRect[key]) < 0.5)) return previous;
      return nextRect;
    });
  }, [activeStep?.target]);

  useLayoutEffect(() => {
    const element = activeStep?.target ? document.querySelector(activeStep.target) : null;
    let frame = 0;
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.top < 24 || rect.bottom > window.innerHeight - 24) {
        element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
      }
    }
    let previousRect = null;
    let stableFrames = 0;
    let measuredFrames = 0;
    const followTarget = () => {
      updateTarget();
      const currentElement = activeStep?.target ? document.querySelector(activeStep.target) : null;
      if (!currentElement) return;
      const rect = currentElement.getBoundingClientRect();
      const values = [rect.top, rect.left, rect.width, rect.height];
      const unchanged = previousRect && values.every((value, index) => Math.abs(value - previousRect[index]) < 0.35);
      stableFrames = unchanged ? stableFrames + 1 : 0;
      previousRect = values;
      measuredFrames += 1;
      if (stableFrames < 5 && measuredFrames < 90) frame = window.requestAnimationFrame(followTarget);
    };
    frame = window.requestAnimationFrame(followTarget);
    return () => window.cancelAnimationFrame(frame);
  }, [activeStep?.target, updateTarget]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    const measure = () => setCardHeight(card.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [stepIndex, targetRect]);

  useEffect(() => {
    const update = () => updateTarget();
    const escape = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('keydown', escape);
    };
  }, [onClose, updateTarget]);

  if (!activeStep || !targetRect) return null;

  const total = steps.length;
  const finalStep = stepIndex === total - 1;
  const { top, left, right, bottom, width, height } = targetRect;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = Math.min(370, viewportWidth - 32);
  const leftPlacementFits = activeStep.placement === 'left' && left >= cardWidth + 34;
  const rightPlacementFits = activeStep.placement === 'right' && viewportWidth - right >= cardWidth + 34;
  const placeBeside = leftPlacementFits || rightPlacementFits;
  const cardLeft = leftPlacementFits
    ? Math.max(16, left - cardWidth - 18)
    : rightPlacementFits
      ? Math.min(viewportWidth - cardWidth - 16, right + 18)
      : Math.max(16, Math.min(left, viewportWidth - cardWidth - 16));
  const aboveFits = top - cardHeight - 18 >= 16;
  const belowFits = bottom + cardHeight + 18 <= viewportHeight - 16;
  const placeAbove = !placeBeside && (aboveFits || (!belowFits && finalStep));
  const cardTop = placeBeside
    ? Math.max(16, Math.min(top + (height - cardHeight) / 2, viewportHeight - cardHeight - 16))
    : placeAbove
      ? Math.max(16, top - cardHeight - 18)
      : Math.min(viewportHeight - cardHeight - 16, bottom + 18);
  const blocker = { position: 'fixed', zIndex: 1400, background: 'rgba(7, 18, 29, 0.54)', backdropFilter: 'blur(0.5px)', pointerEvents: 'auto' };

  const advance = () => {
    if (finalStep) onFinish?.();
    else setStepIndex((index) => index + 1);
  };

  return (
    <AnimatePresence>
      <motion.div className="jury-portal-tour-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'fixed', inset: 0, zIndex: 1400, pointerEvents: 'none' }}>
        <div className="jury-portal-tour-inset" aria-hidden="true" />
        <motion.div aria-hidden="true" onClick={onClose} style={{ ...blocker, top: 0, left: 0, right: 0, height: top }} />
        <motion.div aria-hidden="true" onClick={onClose} style={{ ...blocker, top: bottom, left: 0, right: 0, bottom: 0 }} />
        <motion.div aria-hidden="true" onClick={onClose} style={{ ...blocker, top, left: 0, width: left, height }} />
        <motion.div aria-hidden="true" onClick={onClose} style={{ ...blocker, top, left: right, right: 0, height }} />
        <motion.div className="jury-portal-tour-frame" aria-hidden="true" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 330, damping: 28 }} style={{ top, left, width, height }} />
        <motion.section ref={cardRef} className="jury-portal-tour-card" layout role="dialog" aria-modal="true" aria-labelledby="jury-portal-tour-title" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 27, layout: { type: 'spring', stiffness: 320, damping: 32 } }} style={{ top: cardTop, left: cardLeft, width: cardWidth }}>
          <div className="jury-portal-tour-kicker">
            <span><Sparkles size={14} /> YEŞİL TEKSTİL DEMOSU</span>
            <button type="button" onClick={onClose} aria-label="Rehberi kapat"><X size={16} /></button>
          </div>
          <div className="jury-portal-tour-count">ADIM {stepIndex + 1} / {total}</div>
          <h2 id="jury-portal-tour-title">{activeStep.title}</h2>
          <p>{activeStep.description}</p>
          <div className="jury-portal-tour-progress" aria-hidden="true"><span style={{ width: `${((stepIndex + 1) / total) * 100}%` }} /></div>
          <div className="jury-portal-tour-actions">
            <button type="button" className="jury-portal-tour-skip" onClick={onClose}>Rehberi kapat</button>
            <button type="button" className="jury-portal-tour-next" onClick={activeStep.onAction || advance}>
              {activeStep.actionLabel || (finalStep ? 'Tamamla' : 'Sonraki')}
              {finalStep && !activeStep.actionLabel ? <Check size={15} /> : <ArrowRight size={15} />}
            </button>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
};

export default JuryDemoTour;
