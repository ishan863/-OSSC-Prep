import confetti from 'canvas-confetti';

// Confetti effects for celebrations
export const fireConfetti = {
  // Success celebration - when user answers correctly
  success: () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10B981', '#34D399', '#6EE7B7']
    });
  },

  // Big celebration - for completing tests or high scores
  celebration: () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  },

  // Stars effect - for achievements
  stars: () => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1']
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star']
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle']
      });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  },

  // Side cannons - for completing mock test
  sideCannons: () => {
    const end = Date.now() + 2000;
    const colors = ['#2563EB', '#7C3AED', '#EC4899', '#10B981'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  },

  // Emoji rain - fun celebration
  emojiRain: (emoji = '🎉') => {
    const scalar = 2;
    const confettiEmoji = confetti.shapeFromText({ text: emoji, scalar });

    const defaults = {
      spread: 360,
      ticks: 60,
      gravity: 0.8,
      decay: 0.9,
      startVelocity: 20,
      shapes: [confettiEmoji],
      scalar
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 30
      });

      confetti({
        ...defaults,
        particleCount: 5,
        flat: true
      });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 250);
  }
};

// Animation variants for Framer Motion
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 }
};

export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Spring animations
export const springBounce = {
  type: 'spring',
  damping: 10,
  stiffness: 100
};

export const springSmooth = {
  type: 'spring',
  damping: 20,
  stiffness: 300
};

// Pulse animation for important elements
export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'loop'
    }
  }
};

// Shake animation for errors
export const shakeAnimation = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }
};

// Progress bar animation
export const progressAnimation = (percentage) => ({
  initial: { width: 0 },
  animate: { 
    width: `${percentage}%`,
    transition: { duration: 1, ease: 'easeOut' }
  }
});

// Number counter animation (for scores)
export const useCountUp = (end, duration = 2000) => {
  const startTime = Date.now();
  const step = () => {
    const now = Date.now();
    const progress = Math.min((now - startTime) / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    return Math.round(end * easeOutQuart);
  };
  return step;
};

export default {
  fireConfetti,
  fadeInUp,
  fadeIn,
  scaleIn,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
  springBounce,
  springSmooth,
  pulseAnimation,
  shakeAnimation,
  progressAnimation
};
