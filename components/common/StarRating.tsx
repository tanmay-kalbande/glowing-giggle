import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  onRatingChange?: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  totalStars = 5,
  onRatingChange,
  disabled = false,
  size = 'md',
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const handleMouseEnter = (index: number) => {
    if (disabled) return;
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverRating(0);
  };

  const handleClick = (index: number) => {
    if (disabled || !onRatingChange) return;
    onRatingChange(index);
  };

  return (
    <div className={`flex items-center ${disabled ? 'cursor-default' : 'cursor-pointer'} ${starSizeClasses[size]}`}>
      {[...Array(totalStars)].map((_, index) => {
        const starIndex = index + 1;
        const isFilled = starIndex <= (hoverRating || rating);
        
        // Handle half stars for display
        const isHalf = rating > index && rating < starIndex;

        return (
          <span
            key={starIndex}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starIndex)}
            className={`transition-colors duration-200 ${isFilled ? 'text-yellow-500' : 'text-gray-300'} ${!disabled ? 'hover:text-yellow-400' : ''}`}
            style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}
          >
            {isHalf && !hoverRating ? <i className="fas fa-star-half-alt"></i> : <i className="fas fa-star"></i>}
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
