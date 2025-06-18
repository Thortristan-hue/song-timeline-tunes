import React from 'react';

interface Props {
  winner: {
    name: string;
    score: number;
  };
}

const VictoryScreen: React.FC<Props> = ({ winner }) => {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-purple-900 to-black">
      {/* Celebration particles */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '10px',
            height: '10px',
            backgroundColor: '#FFD700',
            borderRadius: '50%',
            animation: `celebrate 2s ease-out infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}

      {/* Victory message */}
      <div className="text-center pt-20">
        <h1 className="text-6xl font-bold text-white mb-4">
          🎉 Victory! 🎉
        </h1>
        <h2 className="text-4xl text-yellow-400 mb-8">
          {winner.name} wins!
        </h2>
        <p className="text-2xl text-white">
          Final Score: {winner.score}
        </p>
      </div>
    </div>
  );
};

export VictoryScreen;
