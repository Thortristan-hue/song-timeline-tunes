
import React from 'react';

export function HostGameBackground() {
  return (
    <>
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      <div className="absolute top-1/2 left-20 w-24 h-24 bg-purple-400/8 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}} />
    </>
  );
}
