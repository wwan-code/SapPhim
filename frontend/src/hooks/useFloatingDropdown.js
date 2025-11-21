import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  useFloating,
  autoUpdate,
  offset as offsetMiddleware,
  flip as flipMiddleware,
  shift as shiftMiddleware,
  size as sizeMiddleware,
  useTransitionStyles,
  useInteractions,
  useHover,
  useFocus,
  useClick,
  useRole,
  useDismiss,
} from '@floating-ui/react';

/**
 * 💧 LIQUID DROPDOWN POSITIONING HOOK (Enhanced)
 *
 * A reusable hook to manage the positioning and interactions of floating elements
 * like dropdowns, popovers, and tooltips, powered by @floating-ui.
 *
 * Features:
 * - Automatic placement to fit viewport (flip, shift, size).
 * - Real-time updates on scroll, resize, and DOM changes (autoUpdate).
 * - Configurable offset, margin, alignment, and interaction triggers.
 * - Dynamic transform-origin calculation based on placement.
 * - Manages accessibility (ARIA attributes).
 * - Provides spring-based transition styles for liquid glass animations.
 * - Advanced viewport clamping with custom margins.
 * - Observes trigger, header, and content mutations for recalc.
 *
 * @param {object} options - Configuration for the floating element.
 * @param {import('@floating-ui/react').Placement} [options.placement='bottom-start'] - The preferred placement.
 * @param {number|{mainAxis:number, crossAxis:number}} [options.offset=8] - Distance from trigger.
 * @param {{x:number, y:number}} [options.margin={x:16, y:16}] - Margin from viewport edges.
 * @param {boolean} [options.observe=true] - Whether to auto-update position.
 * @param {string} [options.trigger='click'] - Interaction trigger ('click', 'hover', 'focus').
 * @param {boolean} [options.isOpen] - Controlled open state.
 * @param {function} [options.onOpenChange] - Callback for state changes.
 * @param {number} [options.openDuration=500] - Animation duration for opening (ms).
 * @param {number} [options.closeDuration=180] - Animation duration for closing (ms).
 * @param {string} [options.strategy='fixed'] - Positioning strategy ('fixed' or 'absolute').
 * @returns {object} - Props and refs to be applied to the trigger and dropdown elements.
 */
export const useFloatingDropdown = ({
  placement = 'bottom-start',
  offset = 8,
  margin = { x: 16, y: 16 },
  observe = true,
  trigger = 'click',
  isOpen: controlledIsOpen,
  onOpenChange: setControlledIsOpen,
  openDuration = 500,
  closeDuration = 180,
  strategy = 'fixed',
} = {}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const rafIdRef = useRef(null);

  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;
  const setIsOpen = setControlledIsOpen ?? setUncontrolledIsOpen;

  // Parse offset config
  const offsetConfig = useMemo(() => {
    if (typeof offset === 'number') {
      return { mainAxis: offset, crossAxis: 0 };
    }
    return { mainAxis: offset.mainAxis || 8, crossAxis: offset.crossAxis || 0 };
  }, [offset]);

  // Parse margin config
  const marginConfig = useMemo(() => {
    return { x: margin.x || 16, y: margin.y || 16 };
  }, [margin]);

  const { x, y, strategy: positionStrategy, refs, context } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    strategy, // 'fixed' or 'absolute'
    whileElementsMounted: observe ? autoUpdate : undefined,
    middleware: [
      offsetMiddleware(offsetConfig),
      flipMiddleware({
        padding: marginConfig.y,
        fallbackPlacements: ['bottom-start', 'top-start', 'bottom-end', 'top-end'],
      }),
      shiftMiddleware({ 
        padding: marginConfig,
      }),
      sizeMiddleware({
        padding: marginConfig.y,
        apply({ availableHeight, elements }) {
          // Dynamically limit max height to viewport
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
          });
        },
      }),
    ],
  });

  // Animation styles for the liquid glass effect
  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: {
      open: openDuration,
      close: closeDuration,
    },
    initial: ({ side }) => ({
      opacity: 0,
      transform: side === 'bottom' ? 'scale(0.8, 0.7) translateY(-10px)' : 'scale(0.8, 0.7) translateY(10px)',
    }),
    open: {
      opacity: 1,
      transform: 'scale(1, 1) translateY(0)',
    },
    close: {
      opacity: 0,
      transform: 'scale(0.75, 0.6)',
    },
  });

  // Interaction hooks
  const click = useClick(context, { enabled: trigger === 'click' });
  const hover = useHover(context, {
    enabled: trigger === 'hover',
    handleClose: null, // Allow hovering over the dropdown
  });
  const focus = useFocus(context, { enabled: trigger === 'focus' });
  const role = useRole(context, { role: 'menu' });
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    hover,
    focus,
    role,
    dismiss,
  ]);

  // Dynamically set transform-origin based on placement
  const transformOrigin = useMemo(() => {
    const [side, align] = context.placement.split('-');
    const oppositeSide = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    }[side] || 'top';

    const alignment = {
      start: 'left',
      end: 'right',
      center: 'center',
    }[align] || 'center';

    return `${oppositeSide} ${alignment}`;
  }, [context.placement]);

  // Recalc function for manual updates (with rAF throttle)
  const recalc = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      if (refs.floating.current) {
        context.update?.();
      }
    });
  }, [context, refs.floating]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const floatingStyles = {
    position: positionStrategy,
    top: y ?? 0,
    left: x ?? 0,
    transformOrigin,
    ...transitionStyles,
  };

  return {
    isOpen,
    setIsOpen,
    isMounted,
    refs,
    floatingStyles,
    getReferenceProps,
    getFloatingProps,
    placement: context.placement,
    recalc,
  };
};
