import { motion } from "framer-motion";

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

export const slideUp = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

export const scaleButton = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.97, transition: { duration: 0.1 } }
};

export const shakeInput = {
  error: { x: [0, -8, 8, -8, 8, 0], transition: { duration: 0.4 } }
};

export const skeletonPulse = {
  rest: { opacity: 0.7 },
  animate: { opacity: [0.7, 1, 0.7], transition: { duration: 1.2, repeat: Infinity } }
};

// Usage example:
// <motion.div variants={fadeIn} initial="hidden" animate="visible">...</motion.div>
// <motion.button variants={scaleButton} initial="rest" whileHover="hover" whileTap="tap">...</motion.button>
// <motion.input variants={shakeInput} animate={hasError ? "error" : undefined} />
