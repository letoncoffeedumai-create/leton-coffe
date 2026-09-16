import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading?: boolean;
  onFinishedLoading?: () => void;
  onFinish?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading = false,
  onFinishedLoading,
  onFinish
}) => {
  const [progress, setProgress] = useState(15);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Increment progress bar smoothly
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (prev < 60 ? 15 : 8);
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // When progress hits 100% and data finished loading, initiate fade out
    if (progress >= 100 && !isLoading) {
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 150);

      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinishedLoading) onFinishedLoading();
        if (onFinish) onFinish();
      }, 650);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [progress, isLoading, onFinishedLoading, onFinish]);

  // Safety fallback: Never keep screen stuck longer than 1.5 seconds
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onFinishedLoading) onFinishedLoading();
        if (onFinish) onFinish();
      }, 400);
    }, 1500);

    return () => clearTimeout(safetyTimer);
  }, [onFinishedLoading, onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Ambient Glow */}
        <div className="absolute w-48 h-48 rounded-full bg-primary-container/20 blur-2xl animate-pulse"></div>

        {/* Logo and Brewing Animation */}
        <div className="relative flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-lowest shadow-lg flex items-center justify-center text-primary-container border border-surface-container">
            <span className="material-symbols-outlined text-[32px] animate-bounce">
              local_cafe
            </span>
          </div>

          <div className="text-center space-y-1">
            <h1 className="font-headline-md text-on-surface font-bold tracking-tight">
              LETON COFFEE
            </h1>
            <p className="font-body-sm text-primary font-medium tracking-wide">
              Bridging your desire of coffee.
            </p>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-40 h-1 bg-surface-container rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-150 ease-out origin-left"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
