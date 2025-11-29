'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface EditableTextProps {
    value: string
    onChange: (value: string) => void
    className?: string
    placeholder?: string
    multiline?: boolean
    tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'
    readOnly?: boolean
}

export function EditableText({
    value,
    onChange,
    className,
    placeholder = 'Click to edit',
    multiline = false,
    tagName = 'p',
    readOnly = false
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [localValue, setLocalValue] = useState(value || '')
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        setLocalValue(value || '')
    }, [value])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false)
        if (localValue !== value) {
            onChange(localValue)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            e.preventDefault()
            inputRef.current?.blur()
        }
    }

    if (isEditing && !readOnly) {
        const InputComponent = multiline ? 'textarea' : 'input'
        return (
            <InputComponent
                ref={inputRef as any}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn(
                    'bg-transparent border-none outline-none ring-2 ring-primary/50 rounded px-1 w-full',
                    'placeholder:text-muted-foreground/50',
                    'font-[inherit] text-[inherit] leading-[inherit] tracking-[inherit]',
                    className
                )}
                placeholder={placeholder}
                rows={multiline ? 3 : undefined}
                autoFocus
            />
        )
    }

    const Tag = tagName as any

    return (
        <Tag
            onClick={() => !readOnly && setIsEditing(true)}
            className={cn(
                !readOnly && 'cursor-text hover:bg-primary/5 rounded px-1 -mx-1 transition-colors min-w-[20px] min-h-[1em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50',
                'break-words whitespace-pre-wrap',
                className
            )}
            data-placeholder={readOnly ? '' : placeholder}
        >
            {value}
        </Tag>
    )
}

interface EditableListProps<T> {
    items: T[]
    onUpdate: (items: T[]) => void
    renderItem: (item: T, index: number, updateItem: (newItem: T) => void) => React.ReactNode
    newItemTemplate: T
    className?: string
    addButtonLabel?: string
    readOnly?: boolean
}

export function EditableList<T>({
    items = [],
    onUpdate,
    renderItem,
    newItemTemplate,
    className,
    addButtonLabel = 'Add Item',
    readOnly = false
}: EditableListProps<T>) {
    const handleAddItem = () => {
        // Fix: Handle primitive types (strings) correctly by not spreading them
        const newItem = (typeof newItemTemplate === 'object' && newItemTemplate !== null)
            ? { ...newItemTemplate }
            : newItemTemplate
        onUpdate([...items, newItem])
    }

    const handleRemoveItem = (index: number) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        onUpdate(newItems)
    }

    const handleUpdateItem = (index: number, newItem: T) => {
        const newItems = [...items]
        newItems[index] = newItem
        onUpdate(newItems)
    }

    return (
        <div className={cn('space-y-2 group/list', className)}>
            {items.map((item, index) => (
                <div key={index} className="group/item flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                        {renderItem(item, index, (newItem) => handleUpdateItem(index, newItem))}
                    </div>
                    {!readOnly && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                            onClick={() => handleRemoveItem(index)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            ))}
            {!readOnly && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full border border-dashed border-muted-foreground/20 text-muted-foreground hover:text-primary hover:border-primary/50 opacity-0 group-hover/list:opacity-100 transition-all"
                    onClick={handleAddItem}
                >
                    <Plus className="h-3 w-3 mr-2" />
                    {addButtonLabel}
                </Button>
            )}
        </div>
    )
}
