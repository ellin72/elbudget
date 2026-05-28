// Minimal declaration to satisfy TypeScript when framer-motion types are not resolved
// framer-motion v11 ships with its own types, but they may not resolve correctly.
declare module "framer-motion" {
  import type * as React from "react";

  type MotionStyle = React.CSSProperties & Record<string, any>;
  type MotionProps = {
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileInView?: any;
    layout?: any;
    layoutId?: string;
    style?: MotionStyle;
    className?: string;
    onClick?: React.MouseEventHandler<any>;
    onHoverStart?: () => void;
    onHoverEnd?: () => void;
    children?: React.ReactNode;
    key?: React.Key;
    [key: string]: any;
  };

  type MotionComponent<T extends keyof JSX.IntrinsicElements> = React.ForwardRefExoticComponent<
    MotionProps & JSX.IntrinsicElements[T] & React.RefAttributes<any>
  >;

  type Motion = {
    [K in keyof JSX.IntrinsicElements]: MotionComponent<K>;
  } & {
    custom: (component: any) => React.ComponentType<MotionProps & any>;
  };

  export const motion: Motion;

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
    mode?: "sync" | "wait" | "popLayout";
    custom?: any;
    presenceAffectsLayout?: boolean;
  }
  export const AnimatePresence: React.FC<AnimatePresenceProps>;

  export function useAnimation(): any;
  export function useMotionValue<T>(initial: T): any;
  export function useTransform(value: any, ...args: any[]): any;
  export function useSpring(value: any, config?: any): any;
  export function useScroll(options?: any): any;
  export function useInView(ref: any, options?: any): boolean;
  export function animate(value: any, target: any, options?: any): any;

  export type Variants = Record<string, any>;
  export type Transition = Record<string, any>;
}
