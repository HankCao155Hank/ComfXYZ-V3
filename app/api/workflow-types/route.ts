import { NextResponse } from 'next/server';

// GET - 获取工作流类型说明
export async function GET() {
  try {
    // 返回工作流配置说明
    const workflowInfo = {
      message: '现在需要手动输入ComfyStack工作流ID',
      instructions: [
        '1. 在ComfyStack平台创建工作流并发布',
        '2. 获取工作流的workflow_id（格式如：wf-xxxxxxxxx）',
        '3. 在创建表单中输入工作流ID',
        '4. 可选：粘贴完整的curl命令来自动解析参数',
        '5. 系统会自动提取可修改的参数并填充表单'
      ],
      example: {
        workflowId: 'wf-dbruh5vcabfoc3jq',
        curlExample: 'curl --location \'https://cloud.infini-ai.com/api/maas/comfy_task_api/prompt\'...'
      }
    };
    
    return NextResponse.json({ 
      success: true, 
      data: workflowInfo
    });
  } catch (error) {
    console.error('获取工作流信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取工作流信息失败' },
      { status: 500 }
    );
  }
}
