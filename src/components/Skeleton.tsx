"use client";

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton = ({ className = "", count = 1 }: SkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className={`bg-surface border border-border animate-pulse ${className}`}
        />
      ))}
    </>
  );
};

export const CategorySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Skeleton className="h-48 rounded-2xl" count={6} />
  </div>
);

export const QuestionSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-40 rounded-2xl" count={5} />
  </div>
);
