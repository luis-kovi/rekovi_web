'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KanbanColumn } from './kanban-column'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import type { KanbanBoard as KanbanBoardType, Task, KanbanPhase } from '@/types'

interface KanbanBoardProps {
  board: KanbanBoardType
  onTaskClick?: (task: Task) => void
  onAddTask?: (phaseId: string) => void
  onTaskMove?: (taskId: string, fromPhaseId: string, toPhaseId: string) => void
  isLoading?: boolean
  className?: string
}

export function KanbanBoard({ 
  board, 
  onTaskClick, 
  onAddTask, 
  onTaskMove,
  isLoading = false,
  className 
}: KanbanBoardProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground mt-4">
            Carregando quadro Kanban...
          </p>
        </div>
      </div>
    )
  }

  if (!board || !board.phases || board.phases.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum quadro encontrado
          </h3>
          <p className="text-sm text-muted-foreground">
            Não há fases configuradas para este quadro.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('kanban-board min-h-screen bg-gradient-to-br from-muted/50 to-muted', className)}>
      <div className="container-padding section-padding">
        {/* Board Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {board.name}
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas de forma visual e eficiente
          </p>
        </motion.div>

        {/* Kanban Columns */}
        <div className="flex gap-6 overflow-x-auto pb-4 scroll-container">
          <AnimatePresence>
            {board.phases
              .sort((a, b) => a.order - b.order)
              .map((phase, index) => (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.1 
                  }}
                >
                  <KanbanColumn
                    phase={phase}
                    onTaskClick={onTaskClick}
                    onAddTask={onAddTask}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* Board Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {board.phases.map((phase) => {
            const taskCount = phase.tasks?.length || 0
            const completedTasks = phase.tasks?.filter(task => task.status === 'completed').length || 0
            const completionRate = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0

            return (
              <div
                key={phase.id}
                className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-foreground">
                    {phase.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {completionRate}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {completedTasks}/{taskCount}
                  </span>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}