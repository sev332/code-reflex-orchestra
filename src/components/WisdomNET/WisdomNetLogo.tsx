// 🔗 CONNECT: WisdomNET Identity → Neural Aesthetics
// 🧩 INTENT: Create the most beautiful animated DNA/brain wave logo for WisdomNET
// ✅ SPEC: SVG-based with neural network aesthetics, DNA helix, and brain wave patterns

import React from 'react';

interface WisdomNetLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export const WisdomNetLogo: React.FC<WisdomNetLogoProps> = ({ 
  size = 120, 
  animated = true, 
  className = "" 
}) => {
  const animationClass = animated ? "animate-neural-pulse" : "";
  
  return (
    <div className={`relative ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${animationClass} neural-glow transition-all duration-700`}
      >
        {/* Outer Neural Ring */}
        <circle
          cx="60"
          cy="60"
          r="55"
          stroke="url(#neuralGradient)"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
          className="animate-spin"
          style={{ animationDuration: '20s' }}
        />
        
        {/* DNA Double Helix */}
        <g className="origin-center">
          {/* Left Helix Strand */}
          <path
            d="M35 20 Q40 30 35 40 Q30 50 35 60 Q40 70 35 80 Q30 90 35 100"
            stroke="url(#dnaGradient1)"
            strokeWidth="2"
            fill="none"
            className={animated ? "animate-data-flow" : ""}
            style={{ animationDelay: '0s', animationDuration: '4s' }}
          />
          
          {/* Right Helix Strand */}
          <path
            d="M85 20 Q80 30 85 40 Q90 50 85 60 Q80 70 85 80 Q90 90 85 100"
            stroke="url(#dnaGradient2)"
            strokeWidth="2"
            fill="none"
            className={animated ? "animate-data-flow" : ""}
            style={{ animationDelay: '2s', animationDuration: '4s' }}
          />
          
          {/* DNA Base Pairs */}
          {[25, 35, 45, 55, 65, 75, 85, 95].map((y, index) => (
            <line
              key={index}
              x1="35"
              y1={y}
              x2="85"
              y2={y}
              stroke="url(#baseGradient)"
              strokeWidth="1"
              opacity="0.7"
              className={animated ? "animate-neural-pulse" : ""}
              style={{ animationDelay: `${index * 0.2}s` }}
            />
          ))}
        </g>
        
        {/* Central Brain Wave Pattern */}
        <g transform="translate(60, 60)">
          {/* Core Neural Node */}
          <circle
            cx="0"
            cy="0"
            r="8"
            fill="url(#coreGradient)"
            className={animated ? "animate-neural-glow" : ""}
          />
          
          {/* Brain Wave Paths */}
          <path
            d="M-25 0 Q-20 -5 -15 0 Q-10 5 -5 0 Q0 -5 5 0 Q10 5 15 0 Q20 -5 25 0"
            stroke="url(#brainWaveGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
            className={animated ? "animate-data-flow" : ""}
            style={{ animationDelay: '1s' }}
          />
          
          <path
            d="M0 -25 Q5 -20 0 -15 Q-5 -10 0 -5 Q5 0 0 5 Q-5 10 0 15 Q5 20 0 25"
            stroke="url(#brainWaveGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
            className={animated ? "animate-data-flow" : ""}
            style={{ animationDelay: '3s' }}
          />
        </g>
        
        {/* Neural Connection Nodes */}
        {[
          { x: 20, y: 30, delay: '0.5s' },
          { x: 100, y: 25, delay: '1.2s' },
          { x: 15, y: 70, delay: '2.1s' },
          { x: 105, y: 75, delay: '0.8s' },
          { x: 30, y: 95, delay: '1.7s' },
          { x: 90, y: 100, delay: '2.4s' }
        ].map((node, index) => (
          <circle
            key={index}
            cx={node.x}
            cy={node.y}
            r="3"
            fill="url(#nodeGradient)"
            opacity="0.9"
            className={animated ? "animate-neural-pulse" : ""}
            style={{ animationDelay: node.delay }}
          />
        ))}
        
        {/* Neural Connection Lines */}
        <g opacity="0.4">
          <line x1="20" y1="30" x2="60" y2="60" stroke="url(#connectionGradient)" strokeWidth="0.5" />
          <line x1="100" y1="25" x2="60" y2="60" stroke="url(#connectionGradient)" strokeWidth="0.5" />
          <line x1="15" y1="70" x2="60" y2="60" stroke="url(#connectionGradient)" strokeWidth="0.5" />
          <line x1="105" y1="75" x2="60" y2="60" stroke="url(#connectionGradient)" strokeWidth="0.5" />
          <line x1="30" y1="95" x2="60" y2="60" stroke="url(#connectionGradient)" strokeWidth="0.5" />
          <line x1="90" y1="100" x2="60" y2="60" stroke="url(#connectionGradient)" strokeWidth="0.5" />
        </g>
        
        {/* Gradients */}
        <defs>
          <radialGradient id="neuralGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(193, 100%, 70%)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(270, 100%, 70%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(180, 100%, 65%)" stopOpacity="0.4" />
          </radialGradient>
          
          <linearGradient id="dnaGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(193, 100%, 50%)" />
            <stop offset="100%" stopColor="hsl(150, 100%, 60%)" />
          </linearGradient>
          
          <linearGradient id="dnaGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(270, 100%, 70%)" />
            <stop offset="100%" stopColor="hsl(300, 100%, 75%)" />
          </linearGradient>
          
          <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(193, 100%, 50%)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(45, 100%, 65%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(270, 100%, 70%)" stopOpacity="0.8" />
          </linearGradient>
          
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(193, 100%, 70%)" />
            <stop offset="70%" stopColor="hsl(193, 100%, 50%)" />
            <stop offset="100%" stopColor="hsl(193, 100%, 30%)" />
          </radialGradient>
          
          <linearGradient id="brainWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(180, 100%, 65%)" stopOpacity="0.9" />
            <stop offset="50%" stopColor="hsl(193, 100%, 50%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(270, 100%, 70%)" stopOpacity="0.9" />
          </linearGradient>
          
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45, 100%, 65%)" />
            <stop offset="100%" stopColor="hsl(30, 100%, 55%)" />
          </radialGradient>
          
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(193, 100%, 50%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(270, 100%, 70%)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Glow Effect Overlay */}
      {animated && (
        <div 
          className="absolute inset-0 rounded-full opacity-30 animate-neural-glow"
          style={{
            background: 'radial-gradient(circle, hsl(193, 100%, 50%) 0%, transparent 70%)',
            filter: 'blur(8px)'
          }}
        />
      )}
    </div>
  );
};

export default WisdomNetLogo;