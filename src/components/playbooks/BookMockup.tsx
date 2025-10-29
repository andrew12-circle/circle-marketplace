import { motion } from "framer-motion";
import playbookCover from "@/assets/playbook-cover.jpg";

export const BookMockup = () => {
  return (
    <motion.div
      className="relative w-full max-w-md mx-auto perspective-1000"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Book container with 3D transform */}
      <motion.div
        className="book-3d relative"
        whileHover={{ rotateY: -20 }}
        transition={{ duration: 0.3 }}
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateY(-15deg) rotateX(5deg)",
        }}
      >
        {/* Book Spine */}
        <div className="book-spine absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center shadow-2xl rounded-l-sm z-10">
          <span className="text-white font-bold text-xs tracking-wider vertical-text">
            AGENT PLAYBOOKS
          </span>
        </div>
        
        {/* Book Cover */}
        <div className="book-cover relative aspect-[2/3] rounded-r-lg shadow-2xl overflow-hidden ml-12">
          <img
            src={playbookCover}
            alt="Agent Playbook Cover"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Book Pages (side effect) */}
        <div className="book-pages absolute right-0 top-2 bottom-2 w-2 bg-gradient-to-b from-gray-200 via-white to-gray-200 rounded-r-sm shadow-inner" />
      </motion.div>
      
      {/* Drop shadow */}
      <div className="absolute inset-0 blur-3xl bg-black/10 -z-10 translate-y-8" />
    </motion.div>
  );
};
