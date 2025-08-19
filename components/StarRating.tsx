import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  color?: string;
  emptyColor?: string;
}

export default function StarRating({
  rating,
  onRatingChange,
  size = 16,
  readonly = false,
  color = '#FFD700',
  emptyColor = '#E0E0E0'
}: StarRatingProps) {
  const handleStarPress = React.useCallback((starIndex: number) => {
    if (readonly || !onRatingChange) return;
    
    // If clicking the same star that's already selected, clear the rating
    const newRating = rating === starIndex ? 0 : starIndex;
    onRatingChange(newRating);
  }, [rating, readonly, onRatingChange]);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= rating;
        
        if (readonly) {
          return (
            <View key={starIndex} style={styles.starContainer}>
              <Star
                size={size}
                color={isFilled ? color : emptyColor}
                fill={isFilled ? color : 'transparent'}
              />
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={starIndex}
            style={[styles.starContainer, { marginRight: starIndex < 5 ? 2 : 0 }]}
            onPress={() => handleStarPress(starIndex)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Star
              size={size}
              color={isFilled ? color : emptyColor}
              fill={isFilled ? color : 'transparent'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
  },
});