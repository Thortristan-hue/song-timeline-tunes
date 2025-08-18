import { cn } from '@/lib/utils';

interface HostGameBackgroundProps {
  isDarkMode: boolean;
}

export function HostGameBackground({ isDarkMode }: HostGameBackgroundProps) {
  return (
    <div className={cn(
      "fixed inset-0 z-0 transition-colors",
      isDarkMode ? "bg-gray-900" : "bg-gray-100"
    )}>
      <div className="absolute inset-0 bg-grid-sm [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:[mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
        style={{ WebkitMaskImage: 'radial-gradient(ellipse at center, white, transparent)' }}></div>
      <div className="absolute inset-0 bg-noise-url bg-repeat opacity-20 dark:opacity-10"></div>
    </div>
  );
}
