'use client';

interface GenerationPreviewProps {
  xAxisValues: string[];
  yAxisValues: string[];
  getTotalCombinations: () => number;
}

export function GenerationPreview({ xAxisValues, yAxisValues, getTotalCombinations }: GenerationPreviewProps) {
  const validXValues = xAxisValues.filter((v: string) => v.trim() !== '');
  const validYValues = yAxisValues.filter((v: string) => v.trim() !== '');
  const totalCombinations = getTotalCombinations();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">生成预览</h3>
      <div className="p-4 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground mb-3">
          将生成 <strong>{totalCombinations}</strong> 张图片
        </div>
        
        {validXValues.length > 0 && validYValues.length > 0 && (
          <div 
            className="grid gap-2" 
            style={{
              gridTemplateColumns: `repeat(${validXValues.length}, 1fr)`,
              gridTemplateRows: `repeat(${validYValues.length}, 1fr)`
            }}
          >
            {validYValues.map((yValue, yIndex) =>
              validXValues.map((xValue, xIndex) => (
                <div
                  key={`${xIndex}-${yIndex}`}
                  className="aspect-square bg-background border rounded p-1 text-xs flex flex-col justify-between"
                >
                  <div className="text-center">
                    <div className="font-mono text-[10px] text-blue-600">
                      X: {xValue}
                    </div>
                    <div className="font-mono text-[10px] text-green-600">
                      Y: {yValue}
                    </div>
                  </div>
                  <div className="text-center text-[8px] text-muted-foreground">
                    ({xIndex + 1}, {yIndex + 1})
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {totalCombinations > 16 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⚠️ 注意：您将生成 {totalCombinations} 张图片，这可能需要较长时间完成。
            建议先用较少的参数组合进行测试。
          </p>
        </div>
      )}
    </div>
  );
}
