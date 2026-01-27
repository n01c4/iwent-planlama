
import React, { useState, useEffect } from 'react';

const SLIDE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCc-3FsBMD9GfSNPj8f1yOlLiWAtvNL7WVLZX5R8r3Du1bdFfW3tuOqJ63JX59caPzgIDbziNKHwxg7vGFQ6IqMx4hi2mqTxKo3w27KRntLxFY8HvkYOmjr8l-Er0AZK8-bjMSSj7oKBDlDHnyjM_6YQ6eHXZUNR8xa6ztABbwR1FZ8dukitfU-VSEYTzjnGzCDTQUbug5dIUZOYAgB3qqn7a5aMvplEP18NhujUGsORI1WmUxhZLjqpsG2GKGTkrh08-uYxSZ85PQO',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDBPP6zcL4XQ59SwhIQ54Yc6hyNqjLPx2lgxQucmtGpS1mOs6E65ennKEoZCjJ9X-bmYHcVCRPrpsKZohMa6iTKCu2kfkCSocFRw1LoFcXe-C0_yd5M5PfbYMbEKq61ey8z1WsneQbqSvVCbsx88vkRJK0Dza1Y6vKJXUtd0wSMxb34DR1Ogy8NHcRz9wjsWk10rSDzoMyiZzTILCBPJeWWtWgh1oW0Xl6yFyXBRRLO8M49Wpo43z4RG5j5_U8I0jcE55sDvWxuSDL6',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCsw_uHXHmCP09se5jDyT43t4W_Y0Q7aZ6uqx0nKzRaRsnmO4mZf6nG9QQz3s1eEBaTcJAiHruUR98F1SE92oHSCh2B_PGtG9Mp5QbGbFM-WiS0IvzyVCaTRkZ2CzzJjsDxa4IeitmLUSbiMULW-6o3uuZsSXdm4rPBrTeK29pjeC9jVu6vDTZ8eQVy92R3mD1ejXiWo3n-zdck8cz4rMfYRpfU-KoCbZRfcqXRj-93gEwG8dX0cx2EixXpkmNghcoFGiVJ82Y9785m',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDs5DLqGeNnWis11UydifU2PewGu4qDAW5cE8rKESiqCez5auVdwiuK8GK9XOyZPhxjUv5dFCIh8OaNzTG1JpxVU7-1tCKnhN81asu7_lJ-5zRkWFXtU15H-J6FYcSqGOVLr0bf_HDCTuyCTIROf62UUjMl87iRF0z2b0zS6jPoAlYLnqk3_171O6SDoyoWu1IpLugWlgoewYVxQyN3yAVeZNZsHNOFujr5LTSyJK68sNqVKrOT1FGMQv5gqnXs1TYBr84y6Izoz6Tg'
];

export const Slideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden">
      {SLIDE_IMAGES.map((url, index) => (
        <div
          key={url}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out bg-cover bg-center ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${url}')` }}
        />
      ))}
    </div>
  );
};
