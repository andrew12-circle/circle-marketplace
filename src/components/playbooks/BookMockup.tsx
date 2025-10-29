import { motion } from "framer-motion";
import playbookCover from "@/assets/agent-playbook-cover.png";

export const BookMockup = () => {
  return (
    <motion.div
      className="relative w-full max-w-[280px] mx-auto"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Playbook Cover with hover effect */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <img
          src={playbookCover}
          alt="The Agent Playbook - Real Stories, Real Systems, Real Results"
          className="w-full h-auto rounded-lg shadow-2xl"
        />
      </motion.div>
      
      {/* Drop shadow */}
      <div className="absolute inset-0 blur-3xl bg-black/20 -z-10 translate-y-8" />
    </motion.div>
  );
};
