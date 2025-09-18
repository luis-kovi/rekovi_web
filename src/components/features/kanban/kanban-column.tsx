'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KanbanCard } from './kanban-card'
import type { KanbanPhase, Task } from '@/types'

interface KanbanColumnProps {
  phase: KanbanPhase
  onTaskClick?: (task: Task) => void
  onAddTask?: (phaseId: string) => void
  className?: string
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
}

export function KanbanColumn({ 
  phase, 
  onTaskClick, 
  onAddTask, 
  className 
}: KanbanColumnProps) {
  const taskCount = phase.tasks?.length || 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex-shrink-0 w-80', className)}
    >
      <Card className="h-full bg-background/50 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                {phase.name}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs px-2 py-0.5',
                  statusColors[phase.status]
                )}
              >
                {taskCount}
              </Badge>
            </div>
            
            {onAddTask && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAddTask(phase.id)}
                className="h-6 w-6 hover:bg-accent"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3 min-h-[400px]">
            {phase.tasks && phase.tasks.length > 0 ? (
              phase.tasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Nenhuma tarefa
                </p>
                <p className="text-xs text-muted-foreground">
                  Clique no + para adicionar uma nova tarefa
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}