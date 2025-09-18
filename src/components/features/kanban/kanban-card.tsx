'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { Calendar, User, Tag, AlertCircle } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '@/types'

interface KanbanCardProps {
  task: Task
  onClick?: () => void
  className?: string
  isDragging?: boolean
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
}

const priorityIcons = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴'
}

export function KanbanCard({ task, onClick, className, isDragging }: KanbanCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()
  const assigneeName = task.assignee_id ? 'Usuário' : 'Não atribuído' // TODO: Get real assignee name

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn('cursor-pointer', className)}
      onClick={onClick}
    >
      <Card 
        className={cn(
          'kanban-card transition-all duration-200 hover:shadow-lg',
          isDragging && 'opacity-50 rotate-2 scale-105',
          isOverdue && 'border-red-200 bg-red-50/50'
        )}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header with priority and status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs px-2 py-0.5 border',
                  priorityColors[task.priority]
                )}
              >
                {priorityIcons[task.priority]} {task.priority}
              </Badge>
              
              {isOverdue && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs font-medium">Atrasado</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs px-2 py-0.5"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer with assignee and due date */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(assigneeName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {assigneeName}
              </span>
            </div>
            
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className={cn(
                  isOverdue && 'text-red-600 font-medium'
                )}>
                  {formatDate(task.due_date, { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Metadata */}
          {task.metadata && Object.keys(task.metadata).length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">ID:</span> {task.id.slice(0, 8)}...
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}