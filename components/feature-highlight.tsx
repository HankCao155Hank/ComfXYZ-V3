'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Eye, Download, Grid } from 'lucide-react';

export function FeatureHighlight() {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      title: '实时生成跟踪',
      description: '实时查看图像生成进度，包含详细的状态更新和时间估算',
      badge: 'NEW'
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: '智能进度指示',
      description: '基于生成阶段的智能进度条，让您清楚了解完成情况',
      badge: 'HOT'
    },
    {
      icon: <Eye className="w-5 h-5 text-blue-500" />,
      title: '即时图像展示',
      description: '生成完成后立即显示图像，带有精美的揭示动画效果',
      badge: 'COOL'
    },
    {
      icon: <Download className="w-5 h-5 text-green-500" />,
      title: '一键下载保存',
      description: '生成完成后可以立即预览大图或下载保存到本地',
      badge: 'EASY'
    },
    {
      icon: <Grid className="w-5 h-5 text-indigo-500" />,
      title: 'XY轴批量生成',
      description: '设置X轴和Y轴参数，一次性生成所有参数组合的对比网格',
      badge: 'NEW'
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          ✨ 全新实时生成体验
        </CardTitle>
        <CardDescription>
          现在您可以实时跟踪图像生成过程，享受更流畅的创作体验！
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {feature.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{feature.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>使用提示：</strong> 
            执行工作流后，系统会自动跳转到"实时生成"标签页。
            想要对比不同参数效果？试试全新的"XY轴批量"功能！
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
