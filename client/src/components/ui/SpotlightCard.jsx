import { useRef, useState } from 'react';

/**
 * SpotlightCard — React Bits inspired
 * A card that casts a radial-gradient "spotlight" that follows the cursor.
 * Works as a drop-in wrapper: <SpotlightCard className="...">children</SpotlightCard>
 */
const SpotlightCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(59, 130, 246, 0.12)',
  borderColor = 'rgba(100, 116, 139, 0.3)',
  hoverBorderColor = 'rgba(59, 130, 246, 0.4)',
}) => {
  const divRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { setOpacity(1); setIsHovered(true); }}
      onMouseLeave={() => { setOpacity(0); setIsHovered(false); }}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      style={{
        border: `1px solid ${isHovered ? hoverBorderColor : borderColor}`,
        boxShadow: isHovered ? `0 0 30px -10px ${spotlightColor.replace('0.12', '0.3')}` : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* The spotlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;
