
import React, { useState, useEffect } from 'react';

export const StatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pt-4 px-6 flex justify-between items-center text-white/90 text-[13px] font-semibold tracking-wide">
      <span>{time}</span>
      <div className="flex space-x-2 items-center">
        <span className="material-icons-round text-[16px]">signal_cellular_alt</span>
        <span className="material-icons-round text-[16px]">wifi</span>
        <span className="material-icons-round text-[16px] -rotate-90">battery_full</span>
      </div>
    </div>
  );
};
