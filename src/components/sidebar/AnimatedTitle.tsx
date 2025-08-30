import React, { useState, useEffect } from "react";

interface AnimatedTitleProps {
  title: string;
  onAnimationComplete: () => void;
}

export default function AnimatedTitle({
  title,
  onAnimationComplete,
}: AnimatedTitleProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < title.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + title[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 50); // Adjust typing speed here (milliseconds per character)
      return () => clearTimeout(timeout);
    } else {
      onAnimationComplete();
    }
  }, [currentIndex, title, onAnimationComplete]);

  return <span>{displayedText}</span>;
}
