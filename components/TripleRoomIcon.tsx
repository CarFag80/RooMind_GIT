import React from 'react';
import { View } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';

interface TripleRoomIconProps {
  size?: number;
  color?: string;
}

export default function TripleRoomIcon({ size = 24, color = '#6750A4' }: TripleRoomIconProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* First person (left) */}
        <Circle cx="6" cy="6" r="2.5" fill={color} opacity={0.9} />
        <Path 
          d="M2 20v-2c0-1.5 1.5-3 4-3s4 1.5 4 3v2" 
          stroke={color} 
          strokeWidth="1.5" 
          fill="none"
          opacity={0.9}
        />
        
        {/* Second person (center) */}
        <Circle cx="12" cy="5" r="3" fill={color} />
        <Path 
          d="M7 20v-2.5c0-2 2-4 5-4s5 2 5 4V20" 
          stroke={color} 
          strokeWidth="1.8" 
          fill="none"
        />
        
        {/* Third person (right) */}
        <Circle cx="18" cy="6" r="2.5" fill={color} opacity={0.9} />
        <Path 
          d="M14 20v-2c0-1.5 1.5-3 4-3s4 1.5 4 3v2" 
          stroke={color} 
          strokeWidth="1.5" 
          fill="none"
          opacity={0.9}
        />
      </Svg>
    </View>
  );
}