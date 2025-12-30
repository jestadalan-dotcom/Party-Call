import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date;
  onComplete: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(interval);
        if (!isComplete) {
            setIsComplete(true);
            onComplete();
        }
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete, isComplete]);

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center animate-bounce py-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 neon-text">
          2026
        </h1>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-start gap-2 md:gap-3">
      <TimeUnit value={timeLeft.days} label="DAYS" />
      <div className="text-2xl font-bold text-purple-500 pt-1 opacity-60">:</div>
      <TimeUnit value={timeLeft.hours} label="HRS" />
      <div className="text-2xl font-bold text-purple-500 pt-1 opacity-60">:</div>
      <TimeUnit value={timeLeft.minutes} label="MIN" />
      <div className="text-2xl font-bold text-purple-500 pt-1 opacity-60">:</div>
      <TimeUnit value={timeLeft.seconds} label="SEC" urgent={timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds <= 10} />
    </div>
  );
};

const TimeUnit = ({ value, label, urgent }: { value: number, label: string, urgent?: boolean }) => (
  <div className="flex flex-col items-center flex-1">
    <div className={`text-3xl md:text-4xl font-display font-bold leading-none mb-1 tabular-nums tracking-tight ${urgent ? 'text-red-500 animate-pulse' : 'text-white'}`}>
      {value.toString().padStart(2, '0')}
    </div>
    <span className="text-[10px] text-gray-400 font-semibold tracking-widest">{label}</span>
  </div>
);

export default Countdown;