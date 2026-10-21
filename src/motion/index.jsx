import React from 'react';
import { motion } from 'motion/react';
import { DUR, EASE, VIEWPORT, container, rise, STAGGER } from './tokens';


/**
 * Reusable reveals. Each one animates only transform and opacity (or a clip), fires once as it
 * scrolls into view, and can be driven by a parent `Stagger` or by an explicit `animate` state
 * (the hero uses that to wait for the intro). `MotionConfig reducedMotion="user"` (see App) turns
 * the movement off for visitors who ask for less of it, leaving a plain fade.
 */

/**
 * A block that fades up into place as it scrolls into view. Pass `inherit` for a child of a `Stagger`,
 * which then takes its turn in the group instead of triggering on its own.
 */
export function Reveal({
  as = 'div',
  y = 22,
  duration = DUR.base,
  delay = 0,
  inherit = false,
  className,
  children,
  ...rest
}) {
  const Tag = motion[as];
  const trigger = inherit ? {} : { initial: 'hidden', whileInView: 'show', viewport: VIEWPORT };
  return (
    <Tag
      variants={rise(y, duration, delay)}
      className={className}
      {...trigger}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** A group whose `Reveal` children arrive one after another when the group scrolls into view. */
export function Stagger({
  as = 'div',
  stagger = STAGGER,
  delay = 0,
  className,
  children,
  animate,
  viewport = VIEWPORT,
  ...rest
}) {
  const Tag = motion[as];
  const trigger = animate === undefined ? { whileInView: 'show', viewport } : { animate };
  return (
    <Tag initial="hidden" variants={container(stagger, delay)} className={className} {...trigger} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * A heading that rises out of a clipped line. The mask is a wrapper and only the heading itself moves,
 * so gradient text (background-clip) keeps rendering correctly while it travels.
 */
export function HeadingReveal({ as = 'h2', className, children, duration = DUR.hero, ...rest }) {
  const Tag = motion[as];
  return (
    <div className="reveal-mask">
      <Tag
        variants={{
          hidden: { y: '105%', opacity: 0 },
          show: { y: 0, opacity: 1, transition: { duration, ease: EASE.out } },
        }}
        className={className}
        {...rest}
      >
        {children}
      </Tag>
    </div>
  );
}

/** A thin rule that draws itself outward from the centre. */
export function Rule({ className }) {
  return (
    <motion.span
      aria-hidden="true"
      className={className}
      variants={{
        hidden: { scaleX: 0, opacity: 0 },
        show: { scaleX: 1, opacity: 1, transition: { duration: DUR.hero, ease: EASE.out } },
      }}
    />
  );
}

/** An image that uncovers upward from a clipped frame while settling from a slight zoom. */
export function ImageReveal({ className, imgClassName, src, alt = '', ...rest }) {
  return (
    <motion.div
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: DUR.hero, ease: EASE.inOut }}
      className={className}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        initial={{ scale: 1.14 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: DUR.hero + 0.3, ease: EASE.out }}
        className={imgClassName}
        {...rest}
      />
    </motion.div>
  );
}
