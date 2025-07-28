import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Volume2, VolumeX, Vibrate, Settings, Music, Gamepad2, Trophy, Bell } from 'lucide-react';
import { useEnhancedAudio, AudioSettings } from '@/lib/EnhancedAudioManager';
import { cn } from '@/lib/utils';

interface AudioSettingsDialogProps {
  children?: React.ReactNode;
  className?: string;
}

export function AudioSettingsDialog({ children, className }: AudioSettingsDialogProps) {
  const {
    settings,
    updateSettings,
    toggleSound,
    toggleHaptic,
    setMasterVolume,
    playUISound,
    playGameSound,
    playSuccessSound,
    playNotificationSound
  } = useEnhancedAudio();

  const [localSettings, setLocalSettings] = useState<AudioSettings>(settings);
  const [isOpen, setIsOpen] = useState(false);

  // Sync local settings with global settings
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleMasterVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setLocalSettings(prev => ({ ...prev, masterVolume: newVolume }));
    setMasterVolume(newVolume);
  };

  const handleSoundVolumeChange = (category: keyof AudioSettings['soundVolumes'], value: number[]) => {
    const newVolume = value[0] / 100;
    setLocalSettings(prev => ({
      ...prev,
      soundVolumes: {
        ...prev.soundVolumes,
        [category]: newVolume
      }
    }));
    updateSettings({
      soundVolumes: {
        ...localSettings.soundVolumes,
        [category]: newVolume
      }
    });
  };

  const handleSoundToggle = () => {
    toggleSound();
    setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleHapticToggle = () => {
    toggleHaptic();
    setLocalSettings(prev => ({ ...prev, hapticEnabled: !prev.hapticEnabled }));
  };

  const testSound = async (category: string) => {
    switch (category) {
      case 'ui':
        await playUISound('buttonClick');
        break;
      case 'game':
        await playGameSound('cardPlace');
        break;
      case 'success':
        await playSuccessSound('correct');
        break;
      case 'ambient':
        await playNotificationSound();
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "bg-white/10 hover:bg-white/20 border-white/30 text-white",
              className
            )}
          >
            <Settings className="w-4 h-4 mr-2" />
            Audio
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-gray-900/95 backdrop-blur-xl border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Volume2 className="w-5 h-5" />
            Audio & Haptic Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Master Controls */}
          <Card className="bg-white/5 border-white/20 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {localSettings.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-red-400" />
                  )}
                  <Label className="text-white font-medium">Sound Effects</Label>
                </div>
                <Switch
                  checked={localSettings.soundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-5 h-5 text-blue-400" />
                  <Label className="text-white font-medium">Haptic Feedback</Label>
                </div>
                <Switch
                  checked={localSettings.hapticEnabled}
                  onCheckedChange={handleHapticToggle}
                />
              </div>
            </div>
          </Card>

          {/* Master Volume */}
          <Card className="bg-white/5 border-white/20 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white font-medium">Master Volume</Label>
                <span className="text-sm text-white/70">
                  {Math.round(localSettings.masterVolume * 100)}%
                </span>
              </div>
              <Slider
                value={[localSettings.masterVolume * 100]}
                onValueChange={handleMasterVolumeChange}
                max={100}
                step={5}
                disabled={!localSettings.soundEnabled}
                className="w-full"
              />
            </div>
          </Card>

          {/* Individual Sound Categories */}
          <div className="space-y-4">
            <Label className="text-white font-semibold text-base">Sound Categories</Label>
            
            {/* UI Sounds */}
            <Card className="bg-white/5 border-white/20 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-400" />
                    <Label className="text-white">UI Sounds</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70 min-w-[3rem] text-right">
                      {Math.round(localSettings.soundVolumes.ui * 100)}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSound('ui')}
                      disabled={!localSettings.soundEnabled}
                      className="bg-white/10 hover:bg-white/20 border-white/30 text-white h-8 px-3"
                    >
                      Test
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[localSettings.soundVolumes.ui * 100]}
                  onValueChange={(value) => handleSoundVolumeChange('ui', value)}
                  max={100}
                  step={5}
                  disabled={!localSettings.soundEnabled}
                  className="w-full"
                />
                <p className="text-xs text-white/60">Button clicks, navigation, toggles</p>
              </div>
            </Card>

            {/* Game Sounds */}
            <Card className="bg-white/5 border-white/20 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                    <Label className="text-white">Game Sounds</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70 min-w-[3rem] text-right">
                      {Math.round(localSettings.soundVolumes.game * 100)}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSound('game')}
                      disabled={!localSettings.soundEnabled}
                      className="bg-white/10 hover:bg-white/20 border-white/30 text-white h-8 px-3"
                    >
                      Test
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[localSettings.soundVolumes.game * 100]}
                  onValueChange={(value) => handleSoundVolumeChange('game', value)}
                  max={100}
                  step={5}
                  disabled={!localSettings.soundEnabled}
                  className="w-full"
                />
                <p className="text-xs text-white/60">Card placement, turn transitions</p>
              </div>
            </Card>

            {/* Success Sounds */}
            <Card className="bg-white/5 border-white/20 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <Label className="text-white">Success Sounds</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70 min-w-[3rem] text-right">
                      {Math.round(localSettings.soundVolumes.success * 100)}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSound('success')}
                      disabled={!localSettings.soundEnabled}
                      className="bg-white/10 hover:bg-white/20 border-white/30 text-white h-8 px-3"
                    >
                      Test
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[localSettings.soundVolumes.success * 100]}
                  onValueChange={(value) => handleSoundVolumeChange('success', value)}
                  max={100}
                  step={5}
                  disabled={!localSettings.soundEnabled}
                  className="w-full"
                />
                <p className="text-xs text-white/60">Correct answers, victories, achievements</p>
              </div>
            </Card>

            {/* Ambient Sounds */}
            <Card className="bg-white/5 border-white/20 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-green-400" />
                    <Label className="text-white">Notifications</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70 min-w-[3rem] text-right">
                      {Math.round(localSettings.soundVolumes.ambient * 100)}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSound('ambient')}
                      disabled={!localSettings.soundEnabled}
                      className="bg-white/10 hover:bg-white/20 border-white/30 text-white h-8 px-3"
                    >
                      Test
                    </Button>
                  </div>
                </div>
                <Slider
                  value={[localSettings.soundVolumes.ambient * 100]}
                  onValueChange={(value) => handleSoundVolumeChange('ambient', value)}
                  max={100}
                  step={5}
                  disabled={!localSettings.soundEnabled}
                  className="w-full"
                />
                <p className="text-xs text-white/60">Chat notifications, player joins</p>
              </div>
            </Card>
          </div>

          {/* Device Info */}
          <Card className="bg-white/5 border-white/20 p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-white/70">
                Haptic feedback requires a compatible device
              </p>
              <p className="text-xs text-white/50">
                Sound effects will use fallback tones if audio files can't be loaded
              </p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AudioSettingsDialog;