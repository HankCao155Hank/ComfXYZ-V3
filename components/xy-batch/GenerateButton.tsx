'use client';

import { Button } from '@/components/ui/button';
import { Play, Settings } from 'lucide-react';

interface GenerateButtonProps {
  isGenerating: boolean;
  isDisabled: boolean;
  totalCombinations: number;
  onGenerate: () => void;
}

export function GenerateButton({ isGenerating, isDisabled, totalCombinations, onGenerate }: GenerateButtonProps) {
  return (
    <div className="flex gap-4 pt-4">
      <Button 
        onClick={onGenerate} 
        disabled={isDisabled || isGenerating}
        className="flex-1"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Settings className="w-4 h-4 mr-2 animate-spin" />
            生成中... ({totalCombinations} 张图片)
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            开始 XY 轴批量生成 ({totalCombinations} 张图片)
          </>
        )}
      </Button>
    </div>
  );
}
