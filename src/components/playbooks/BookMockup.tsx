import { motion } from "framer-motion";
import playbookCover from "@/assets/agent-playbook-cover.png";

export const BookMockup = () => {
  return (
    <motion.div
      className="relative w-full max-w-[280px] mx-auto"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ perspective: "1000px" }}
    >
      {/* Playbook Cover with 3D rotation and floating animation */}
      <motion.div
        className="relative"
        style={{
          transformStyle: "preserve-3d",
        }}
        initial={{ rotateY: -15, rotateX: 5 }}
        animate={{
          rotateY: -15,
          rotateX: 5,
          y: [0, -15, 0],
        }}
        transition={{
          y: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        whileHover={{
          rotateY: -5,
          scale: 1.05,
          transition: { duration: 0.3 },
        }}
      >
        <img
          src={playbookCover}
          alt="The Agent Playbook - Real Stories, Real Systems, Real Results"
          className="w-full h-auto rounded-lg shadow-2xl"
          style={{
            filter: "drop-shadow(20px 20px 30px rgba(0, 0, 0, 0.3))",
          }}
        />
      </motion.div>
      
      {/* Animated shadow that moves with floating */}
      <motion.div
        className="absolute inset-0 blur-3xl bg-black/30 -z-10 rounded-full"
        animate={{
          scale: [1, 0.9, 1],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transform: "translateY(80%)" }}
      />
    </motion.div>
  );
};
