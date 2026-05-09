export interface Goal {
  id: string
  title: string
  description: string
  category: string
  targetDate: string
  status: 'not-started' | 'in-progress' | 'complete'
  progress: number
  nextAction: string
  target?: string
  current?: string
  destinations?: string[]
  budget?: string
}

export interface VisionItem {
  id: string
  title: string
  description: string
  emoji: string
  color: string
}

export interface ActionItem {
  id: string
  title: string
  category: string
  dueDate: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}
