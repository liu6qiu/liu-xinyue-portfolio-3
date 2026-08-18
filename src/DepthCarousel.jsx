import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import "./DepthCarousel.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const normalizeItem = (item) => typeof item === "string" ? { image: item, alt: "" } : item;

export default function DepthCarousel({
  items = [], cardWidth = 300, cardHeight = 380, radius = 5,
  tint = "#05060a", depth = 220, spread = 90, tilt = 22,
  tiltDirection = "right", perspective = 1400, visibleCards = 4,
  falloff = 0.2, blur = 6, duration = 950, ease = "power3.out",
  loop = true, showControls = true, showIndicators = false, onChange,
  autoPlay = true, autoPlayDelay = 4200, className = "",
  expandIcon, collapseIcon, previousIcon, nextIcon
}) {
  const data = useMemo(() => items.map(normalizeItem), [items]);
  const rootRef = useRef(null);
  const cardRefs = useRef([]);
  const overlayRefs = useRef([]);
  const posRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef(null);
  const closeTimerRef = useRef(null);
  const scaleRef = useRef(1);
  const reducedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [transitionOrigin, setTransitionOrigin] = useState({ x: 0, y: 0, scaleX: 0.78, scaleY: 0.78 });
  const [manualReset, setManualReset] = useState(0);
  const configRef = useRef({});

  onChangeRef.current = onChange;
  configRef.current = { count: data.length, cardWidth, depth, spread, tilt, tiltDirection, visibleCards, falloff, blur, duration, ease, loop };

  const layout = useCallback((position) => {
    const config = configRef.current;
    if (!config.count) return;
    const direction = config.tiltDirection === "left" ? -1 : 1;
    for (let index = 0; index < config.count; index += 1) {
      const card = cardRefs.current[index];
      if (!card) continue;
      let distance = index - position;
      if (config.loop && config.count > 1) {
        distance = ((distance % config.count) + config.count) % config.count;
        if (distance > config.count / 2) distance -= config.count;
      }
      const absoluteDistance = Math.abs(distance);
      const shown = absoluteDistance <= config.visibleCards + 0.5;
      const translateZ = -config.depth * absoluteDistance;
      const translateX = direction * config.spread * distance;
      const rotateY = direction * config.tilt * clamp(distance, -1, 1);
      const cardScale = Math.max(0.72, 1 - absoluteDistance * 0.055);
      let opacity = Math.max(0.14, 1 - absoluteDistance * 0.14);
      if (!shown) opacity = 0;
      const brightness = Math.max(0.15, 1 - absoluteDistance * config.falloff);
      const blurValue = config.blur ? Math.min(config.blur, (absoluteDistance / Math.max(1, config.visibleCards)) * config.blur) : 0;
      card.style.transform = `translate3d(calc(-50% + ${translateX.toFixed(2)}px), -50%, ${translateZ.toFixed(2)}px) rotateY(${rotateY.toFixed(3)}deg) scale(${(scaleRef.current * cardScale).toFixed(4)})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurValue.toFixed(2)}px)`;
      card.style.zIndex = String(Math.round(2000 - absoluteDistance * 20));
      card.style.pointerEvents = shown && opacity > 0.05 ? "auto" : "none";
      const overlay = overlayRefs.current[index];
      if (overlay) overlay.style.opacity = clamp(absoluteDistance * config.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  }, []);

  const tweenTo = useCallback((target, animate = true) => {
    tweenRef.current?.kill();
    const config = configRef.current;
    const proxy = { position: posRef.current };
    tweenRef.current = gsap.to(proxy, {
      position: target,
      duration: animate && !reducedRef.current ? config.duration / 1000 : 0,
      ease: config.ease,
      onUpdate: () => { posRef.current = proxy.position; layout(proxy.position); },
      onComplete: () => {
        if (config.count) posRef.current = ((posRef.current % config.count) + config.count) % config.count;
        layout(posRef.current);
      }
    });
  }, [layout]);

  const setFocus = useCallback((rawIndex, animate = true) => {
    const config = configRef.current;
    if (!config.count) return;
    const index = config.loop ? ((rawIndex % config.count) + config.count) % config.count : clamp(rawIndex, 0, config.count - 1);
    let delta = index - posRef.current;
    if (config.loop && config.count > 1) {
      delta = ((delta % config.count) + config.count) % config.count;
      if (delta > config.count / 2) delta -= config.count;
    }
    tweenTo(posRef.current + delta, animate);
    focusRef.current = index;
    setActive(index);
    onChangeRef.current?.(index, data[index]);
  }, [data, tweenTo]);

  const navigateBy = useCallback((step, manual = false) => {
    if (expanded) return;
    if (manual) {
      tweenRef.current?.kill();
      setManualReset((value) => value + 1);
    }
    setFocus(focusRef.current + step);
  }, [expanded, setFocus]);

  const toggleExpanded = useCallback((index = focusRef.current) => {
    tweenRef.current?.kill();
    if (!expanded) {
      const card = cardRefs.current[index];
      if (card) {
        const rect = card.getBoundingClientRect();
        const targetWidth = Math.min(1280, Math.max(280, window.innerWidth - 40), Math.max(280, (window.innerHeight - 40) * 2));
        const targetHeight = targetWidth / 2;
        setTransitionOrigin({
          x: rect.left + rect.width / 2 - window.innerWidth / 2,
          y: rect.top + rect.height / 2 - window.innerHeight / 2,
          scaleX: rect.width / targetWidth,
          scaleY: rect.height / targetHeight,
        });
      }
      setFocus(index, false);
      setClosing(false);
      setExpanded(true);
    } else if (!closing) {
      const finishClose = () => {
        setExpanded(false);
        setClosing(false);
      };
      if (reducedRef.current) finishClose();
      else {
        setClosing(true);
        closeTimerRef.current = window.setTimeout(finishClose, 560);
      }
    }
    setManualReset((value) => value + 1);
  }, [closing, expanded, setFocus]);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = rootRef.current;
    if (!root) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const horizontalGutter = entry.contentRect.width <= 760 ? 40 : 32;
      const safeWidth = Math.max(entry.contentRect.width - horizontalGutter, 1);
      const safeHeight = Math.max(entry.contentRect.height - 16, 1);
      const widthScale = safeWidth / cardWidth;
      const heightScale = safeHeight / cardHeight;
      scaleRef.current = clamp(Math.min(widthScale, heightScale), 0.28, 1);
      const controlInset = entry.contentRect.width <= 760 ? 12 : 14;
      root.style.setProperty("--dc-control-inverse-scale", String(1 / scaleRef.current));
      root.style.setProperty("--dc-control-offset", `${controlInset / scaleRef.current}px`);
      layout(posRef.current);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [cardWidth, spread, layout]);

  useEffect(() => { layout(posRef.current); }, [layout, data.length, depth, spread, tilt, visibleCards, falloff, blur]);
  useEffect(() => {
    if (!autoPlay || expanded || reducedRef.current || data.length < 2) return undefined;
    const timer = window.setTimeout(() => navigateBy(1), autoPlayDelay);
    return () => window.clearTimeout(timer);
  }, [autoPlay, autoPlayDelay, active, data.length, expanded, manualReset, navigateBy]);
  useEffect(() => {
    if (!expanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => event.key === "Escape" && toggleExpanded(active);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, expanded, toggleExpanded]);
  useEffect(() => () => {
    tweenRef.current?.kill();
    window.clearTimeout(closeTimerRef.current);
  }, []);

  return <div ref={rootRef} className={`depth-carousel ${className}`.trim()} style={{ "--dc-perspective": `${perspective}px` }} role="group" aria-roledescription="carousel" aria-label="其他作品轮播">
    <div className="depth-carousel__stage">
      {data.map((item, index) => <div key={item.label || index} className={`depth-carousel__card${active === index ? " is-active" : ""}`} ref={(element) => { cardRefs.current[index] = element; }} style={{ width: cardWidth, height: cardHeight, borderRadius: radius }} aria-roledescription="slide" aria-label={`${index + 1} / ${data.length}`} aria-hidden={active !== index}>
        {item.image ? <img className="depth-carousel__img" src={item.image} alt={item.alt || ""} draggable={false} /> : <span className="depth-carousel__placeholder"><b>{String(index + 1).padStart(2, "0")}</b><small>{item.label}</small></span>}
        <span className="depth-carousel__tint" ref={(element) => { overlayRefs.current[index] = element; }} style={{ background: tint }} />
        <button type="button" className="depth-carousel__zoom" aria-label={expanded && active === index ? "缩小还原" : "放大图片"} title={expanded && active === index ? "缩小还原" : "放大图片"} onClick={(event) => { event.stopPropagation(); toggleExpanded(index); }}>
          <img src={expanded && active === index ? collapseIcon : expandIcon} alt="" aria-hidden="true" draggable={false} />
        </button>
      </div>)}
    </div>
    {showControls && data.length > 1 && !expanded && <><button type="button" className="depth-carousel__arrow depth-carousel__arrow--prev" aria-label="上一个作品" onClick={() => navigateBy(-1, true)}><img src={previousIcon} alt="" aria-hidden="true" draggable={false} /></button><button type="button" className="depth-carousel__arrow depth-carousel__arrow--next" aria-label="下一个作品" onClick={() => navigateBy(1, true)}><img src={nextIcon} alt="" aria-hidden="true" draggable={false} /></button></>}
    {showIndicators && <div className="depth-carousel__dots">{data.map((item, index) => <button key={item.label || index} type="button" aria-label={`转到作品 ${index + 1}`} className={`depth-carousel__dot${active === index ? " is-active" : ""}`} onClick={() => setFocus(index)} />)}</div>}
    {expanded && createPortal(<div className={`depth-carousel__lightbox${closing ? " is-closing" : ""}`} style={{ "--lightbox-from-x": `${transitionOrigin.x}px`, "--lightbox-from-y": `${transitionOrigin.y}px`, "--lightbox-from-scale-x": transitionOrigin.scaleX, "--lightbox-from-scale-y": transitionOrigin.scaleY }} role="dialog" aria-modal="true" aria-label={`放大查看${data[active]?.alt ? `：${data[active].alt}` : "图片"}`} onClick={(event) => event.target === event.currentTarget && toggleExpanded(active)}>
      <div className="depth-carousel__lightbox-card">
        <img className="depth-carousel__lightbox-img" src={data[active]?.image} alt={data[active]?.alt || ""} draggable={false} />
        <button type="button" className="depth-carousel__zoom depth-carousel__zoom--lightbox" aria-label="缩小还原" title="缩小还原" onClick={(event) => { event.stopPropagation(); toggleExpanded(active); }}>
          <img src={collapseIcon} alt="" aria-hidden="true" draggable={false} />
        </button>
      </div>
    </div>, document.body)}
  </div>;
}
