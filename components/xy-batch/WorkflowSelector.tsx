'use client';

// import { useState } from 'react'; // 暂时未使用

interface Workflow {
  id: string;
  name: string;
  description?: string;
  workflowId: string;
  nodeData: Record<string, unknown>;
}

interface WorkflowSelectorProps {
  workflows: Workflow[];
  selectedWorkflowId: string;
  onWorkflowChange: (workflowId: string, workflow: Workflow) => void;
}

export function WorkflowSelector({ workflows, selectedWorkflowId, onWorkflowChange }: WorkflowSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">选择工作流 *</label>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
        value={selectedWorkflowId}
        onChange={(e) => {
          const workflow = workflows.find((w) => w.id === e.target.value);
          if (workflow) {
            onWorkflowChange(e.target.value, workflow);
          }
        }}
      >
        <option value="">请选择工作流</option>
        {workflows.map((workflow) => (
          <option key={workflow.id} value={workflow.id}>
            {workflow.name}
          </option>
        ))}
      </select>
    </div>
  );
}
