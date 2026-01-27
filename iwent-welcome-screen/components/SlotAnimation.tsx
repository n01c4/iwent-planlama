
import React from 'react';
import { Language } from '../App';

interface SlotAnimationProps {
  language: Language;
}

export const SlotAnimation: React.FC<SlotAnimationProps> = ({ language }) => {
  return (
    <div className="slot-container">
      <div className="slot-words-wrapper animate-slot text-left">
        <span className="slot-word">{language === 'TR' ? 'Yaşa' : 'Moments'}</span>
        <span className="slot-word">{language === 'TR' ? 'Biriktir' : 'Memories'}</span>
      </div>
    </div>
  );
};
