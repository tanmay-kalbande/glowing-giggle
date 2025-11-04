import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  onRatingChange?: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  totalStars = 5,
  onRatingChange,
  disabled = false,
  size = 'md',
  showLabel = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const starSpacingClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-2',
  };

  const handleMouseEnter = (index: number) => {
    if (disabled || !onRatingChange) return;
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (disabled || !onRatingChange) return;
    setHoverRating(0);
  };

  const handleClick = (index: number) => {
    if (disabled || !onRatingChange) return;
    onRatingChange(index);
  };

  const displayRating = hoverRating || rating;
  const isInteractive = !disabled && onRatingChange;

  // Rating labels for hover effect
  const ratingLabels = ['खराब', 'साधारण', 'चांगले', 'उत्तम', 'अप्रतिम'];

  return (
    <div className="flex flex-col items-center">
      <div className={`flex items-center ${starSpacingClasses[size]} ${isInteractive ? 'cursor-pointer' : 'cursor-default'} ${starSizeClasses[size]}`}>
        {[...Array(totalStars)].map((_, index) => {
          const starIndex = index + 1;
          const isFilled = starIndex <= displayRating;
          
          // Handle half stars for display (only when not interactive)
          const isHalf = !hoverRating && rating > index && rating < starIndex;
          
          // Determine star color based on rating
          let starColor = 'text-gray-300';
          if (isFilled) {
            if (displayRating <= 2) starColor = 'text-orange-400';
            else if (displayRating <= 3) starColor = 'text-yellow-400';
            else starColor = 'text-yellow-500';
          }

          return (
            <span
              key={starIndex}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(starIndex)}
              className={`transition-all duration-200 ${starColor} ${
                isInteractive ? 'hover:scale-110 active:scale-95' : ''
              }`}
              style={{ 
                textShadow: isFilled ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                filter: isFilled ? 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.3))' : 'none'
              }}
            >
              {isHalf && !hoverRating ? (
                <i className="fas fa-star-half-alt"></i>
              ) : (
                <i className={isFilled ? 'fas fa-star' : 'far fa-star'}></i>
              )}
            </span>
          );
        })}
      </div>
      
      {/* Show rating label on hover (only for interactive ratings) */}
      {showLabel && isInteractive && hoverRating > 0 && (
        <p className="text-sm font-semibold text-primary mt-2 animate-fadeInUp">
          {ratingLabels[hoverRating - 1]}
        </p>
      )}
      
      {/* Show current rating value when not hovering */}
      {showLabel && !isInteractive && rating > 0 && (
        <p className="text-sm text-text-secondary mt-1">
          {rating.toFixed(1)} / 5
        </p>
      )}
    </div>
  );
};

export default StarRating;
