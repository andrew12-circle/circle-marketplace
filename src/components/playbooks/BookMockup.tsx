import { motion } from "framer-motion";
import playbookCover from "@/assets/agent-playbook-cover.png";

export const BookMockup = () => {
  const handleClick = () => {
    const playbooksSection = document.getElementById('playbooks-section');
    if (playbooksSection) {
      playbooksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className="relative w-full max-w-[280px] mx-auto cursor-pointer"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative"
        style={{
          transformStyle: "preserve-3d",
        }}
        initial={{ rotateY: -15, rotateX: 5 }}
        animate={{
          rotateY: -15,
          rotateX: 5,
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
        className="w-full h-auto"
      />
      </motion.div>
      
      {/* Shadow */}
      <div
        className="absolute inset-0 blur-3xl bg-black/30 -z-10 rounded-full"
        style={{ transform: "translateY(80%)", opacity: 0.3 }}
      />
    </motion.div>
  );
};
