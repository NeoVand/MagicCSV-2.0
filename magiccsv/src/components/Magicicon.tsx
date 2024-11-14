import React from 'react';

interface MagicIconProps {
  size?: number;
  className?: string;
}

const MagicIcon: React.FC<MagicIconProps> = ({ size = 24, className }) => {
  return (
    <img 
      src="svgicon.svg" 
      alt="Magic CSV Icon" 
      style={{ 
        width: size, 
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
      className={className}
    />
  );
};

export default MagicIcon;