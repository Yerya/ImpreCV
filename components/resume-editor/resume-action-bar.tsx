"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResumeActionBarProps {
    saving: boolean
    exporting: boolean
    hasUnsavedChanges?: boolean
    onReset: () => void
    onSave: () => void
    onExport: () => void
    variant?: 'desktop' | 'mobile'
}

export const ResumeActionBar = memo(function ResumeActionBar({
    saving,
    exporting,
    hasUnsavedChanges = false,
    onReset,
    onSave,
    onExport,
    variant = 'desktop'
}: ResumeActionBarProps) {
    // Pulsing styles for unsaved changes - respects prefers-reduced-motion via CSS
    const saveButtonClasses = cn(
        "gap-2",
        hasUnsavedChanges && !saving && "animate-pulse-subtle"
    )

    const saveButtonStyle = hasUnsavedChanges && !saving ? {
        boxShadow: '0 0 0 2px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.5)'
    } : undefined

    if (variant === 'mobile') {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-30 px-3 py-2">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReset}
                        className="flex-1 h-9 bg-background text-foreground border-border"
                    >
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Reset
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={saving}
                        className={cn(
                            "flex-1 h-9",
                            hasUnsavedChanges && !saving && "animate-pulse-subtle"
                        )}
                        style={hasUnsavedChanges && !saving ? {
                            boxShadow: '0 0 0 2px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.5)'
                        } : undefined}
                    >
                        {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        size="sm"
                        onClick={onExport}
                        disabled={exporting}
                        className="flex-1 h-9"
                    >
                        {exporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                        PDF
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="gap-2"
            >
                <RefreshCw className="h-4 w-4" />
                Reset
            </Button>
            <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className={saveButtonClasses}
                style={saveButtonStyle}
            >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" onClick={onExport} disabled={exporting} className="gap-2">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
        </div>
    )
})
