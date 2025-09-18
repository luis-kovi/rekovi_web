'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, formatDate, getInitials } from '@/lib/utils'
import { 
  Calendar, 
  User, 
  Tag, 
  AlertCircle, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle
} from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '@/types'

interface TaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
}

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  cancelled: AlertCircle
}

export function TaskModal({ task, isOpen, onClose, onEdit, onDelete }: TaskModalProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (!task) return null

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()
  const assigneeName = task.assignee_id ? 'Usuário' : 'Não atribuído' // TODO: Get real assignee name
  const StatusIcon = statusIcons[task.status]

  const handleEdit = () => {
    setIsEditing(true)
    onEdit?.(task)
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      onDelete?.(task.id)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes da Tarefa"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {task.title}
            </h2>
            {task.description && (
              <p className="text-muted-foreground leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4 text-muted-foreground" />
            <Badge 
              variant="outline" 
              className={cn(
                'text-sm px-3 py-1',
                statusColors[task.status]
              )}
            >
              {task.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <Badge 
            variant="outline" 
            className={cn(
              'text-sm px-3 py-1',
              priorityColors[task.priority]
            )}
          >
            Prioridade: {task.priority.toUpperCase()}
          </Badge>
        </div>

        {/* Assignee and Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(assigneeName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                Responsável
              </p>
              <p className="text-sm text-muted-foreground">
                {assigneeName}
              </p>
            </div>
          </div>

          {task.due_date && (
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              isOverdue ? "bg-red-50 border border-red-200" : "bg-muted/50"
            )}>
              <Calendar className={cn(
                "w-5 h-5",
                isOverdue ? "text-red-600" : "text-muted-foreground"
              )} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Data de Vencimento
                </p>
                <p className={cn(
                  "text-sm",
                  isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                )}>
                  {formatDate(task.due_date, { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {isOverdue && " (Atrasado)"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-sm px-3 py-1"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium">ID da Tarefa</p>
              <p className="font-mono">{task.id}</p>
            </div>
            <div>
              <p className="font-medium">Criado em</p>
              <p>{formatDate(task.created_at, { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div>
              <p className="font-medium">Atualizado em</p>
              <p>{formatDate(task.updated_at, { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Tarefa
          </Button>
        </div>
      </div>
    </Modal>
  )
}