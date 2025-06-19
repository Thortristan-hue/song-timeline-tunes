export const cardAnimations = {
  // Duration in milliseconds
  throwDuration: 500,
  placementDuration: 300,
  // CSS classes for animations
  throw: 'animate-card-throw',
  placement: 'animate-card-placement',
  success: 'animate-card-success',
  error: 'animate-card-error'
};

export const calculateThrowPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
) => {
  // Calculate control point for curved trajectory
  const controlX = (startX + endX) / 2;
  const controlY = Math.min(startY, endY) - 100;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
};
