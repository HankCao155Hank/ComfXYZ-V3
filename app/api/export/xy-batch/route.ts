import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface XYBatchResult {
  batchId: string;
  totalCombinations: number;
  xAxisCount: number;
  yAxisCount: number;
  xAxisNode: string;
  xAxisInput: string;
  yAxisNode: string;
  yAxisInput: string;
  generations: Array<{
    generationId: string;
    xIndex: number;
    yIndex: number;
    xValue: string;
    yValue: string;
  }>;
}

// POST - 导出XY轴批量生成结果
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchResult, format = 'csv' }: { batchResult: XYBatchResult; format: 'csv' | 'excel' } = body;

    if (!batchResult || !batchResult.generations) {
      return NextResponse.json(
        { success: false, error: '批次数据不完整' },
        { status: 400 }
      );
    }

    // 获取所有生成记录的详细信息
    const generationIds = batchResult.generations.map(gen => gen.generationId);
    const generations = await prisma.generation.findMany({
      where: {
        id: { in: generationIds }
      },
      include: {
        workflow: true
      }
    });

    // 创建生成记录映射
    const generationMap = new Map();
    generations.forEach((gen: { id: string }) => {
      generationMap.set(gen.id, gen);
    });

    // 下载图片并转换为base64的函数
    const downloadImageAsBase64 = async (url: string): Promise<string | null> => {
      try {
        if (!url) return null;
        const response = await fetch(url);
        if (!response.ok) return null;
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:image/png;base64,${base64}`;
      } catch (error) {
        console.error('下载图片失败:', error);
        return null;
      }
    };

    // 准备表格数据 - 以X轴和Y轴为行列的图片网格
    const xAxisValues = [...new Set(batchResult.generations.map(gen => gen.xValue))].sort();
    const yAxisValues = [...new Set(batchResult.generations.map(gen => gen.yValue))].sort();
    
    // 创建图片数据映射
    const imageDataMap = new Map();
    await Promise.all(batchResult.generations.map(async (gen) => {
      const generation = generationMap.get(gen.generationId);
      const imageBase64 = generation?.blobUrl ? await downloadImageAsBase64(generation.blobUrl) : null;
      const key = `${gen.xValue}-${gen.yValue}`;
      imageDataMap.set(key, {
        generation,
        imageBase64,
        status: generation?.status || 'unknown',
        errorMsg: generation?.errorMsg || ''
      });
    }));

    // 准备表格数据
    const tableData = [];
    
    // 第一行：X轴标题行
    const headerRow = ['Y轴\\X轴', ...xAxisValues];
    tableData.push(headerRow);
    
    // 数据行：每行对应一个Y轴值
    for (const yValue of yAxisValues) {
      const row = [yValue]; // 第一列是Y轴值
      for (const xValue of xAxisValues) {
        const key = `${xValue}-${yValue}`;
        const imageData = imageDataMap.get(key);
        if (imageData && imageData.imageBase64) {
          row.push(imageData.imageBase64); // 只存储base64数据用于图片嵌入
        } else {
          row.push('无图片'); // 显示文本提示
        }
      }
      tableData.push(row);
    }

    if (format === 'excel') {
      // 生成Excel文件
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('XY批量生成结果');

      // 设置列宽
      worksheet.columns = [
        { width: 15 }, // Y轴标题列
        ...xAxisValues.map(() => ({ width: 25 })) // 图片列
      ];

      // 添加表格数据
      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        const row = tableData[rowIndex];
        const excelRow = worksheet.addRow(row);
        
        // 设置标题行样式
        if (rowIndex === 0) {
          excelRow.font = { bold: true };
          excelRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
        }
        
        // 处理图片嵌入
        for (let colIndex = 1; colIndex < row.length; colIndex++) {
          const cellValue = row[colIndex];
          if (typeof cellValue === 'string' && cellValue.startsWith('data:image/')) {
            try {
              // 将base64转换为buffer
              const base64Data = cellValue.replace(/^data:image\/[a-z]+;base64,/, '');
              const imageBuffer = Buffer.from(base64Data, 'base64');
              
              // 添加图片到Excel
              const imageId = workbook.addImage({
                buffer: imageBuffer,
                extension: 'png',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any);
              
              // 在对应单元格插入图片
              worksheet.addImage(imageId, {
                tl: { col: colIndex, row: rowIndex },
                ext: { width: 200, height: 200 }
              });
              
              // 清空单元格的文本内容，只保留图片
              const cell = worksheet.getCell(rowIndex + 1, colIndex + 1);
              cell.value = '';
              
              // 调整行高以容纳图片
              excelRow.height = 150;
            } catch (error) {
              console.error('嵌入图片失败:', error);
            }
          }
        }
      }

      // 生成Excel文件
      const buffer = await workbook.xlsx.writeBuffer();
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="xy-batch-${batchResult.batchId}.xlsx"`
        }
      });
    } else {
      // 生成CSV文件 - 表格格式
      const csvContent = tableData.map(row => 
        row.map(cell => {
          // 对于图片base64数据，显示简化信息
          if (typeof cell === 'string' && cell.startsWith('data:image/')) {
            return `"图片(${cell.length}字符)"`;
          }
          
          // 处理包含逗号或引号的值
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      ).join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="xy-batch-${batchResult.batchId}.csv"`
        }
      });
    }

  } catch (error) {
    console.error('导出XY批量结果失败:', error);
    return NextResponse.json(
      { success: false, error: '导出失败' },
      { status: 500 }
    );
  }
}