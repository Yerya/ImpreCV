"use client"

import { memo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { GlobalHeader } from "@/components/global-header"
import { RefreshCw, Loader2, Palette } from "lucide-react"
import { CoverLetterPanel } from "@/components/resume-templates/cover-letter-panel"
import { SkillMapPanel } from "@/components/resume-templates/skill-map-panel"
import { WebResumeRenderer } from "@/components/resume-templates/web-renderer"
import { ResumeChatPanel } from "@/components/chat/resume-chat-panel"
import { ResumeActionBar } from "./resume-action-bar"
import { RecentResumesList } from "./recent-resumes-list"
import { TemplatePreviewCarousel } from "./template-preview-carousel"
import type { UseResumeEditorReturn } from "./types"

interface DesktopResumeEditorProps {
    editor: UseResumeEditorReturn
    backHref: string
    showJobRelatedTabs?: boolean
}

export const DesktopResumeEditor = memo(function DesktopResumeEditor({
    editor,
    backHref,
    showJobRelatedTabs = true
}: DesktopResumeEditorProps) {
    const [showStyleDialog, setShowStyleDialog] = useState(false)

    const {
        resumeData,
        setResumeData,
        selectedVariant,
        setSelectedVariant,
        themeMode,
        setThemeMode,
        activeResumeId,
        activeResumeLabel,
        availableResumes,
        saving,
        exporting,
        deletingId,
        activeCoverLetters,
        coverLetterLoading,
        coverLetterError,
        generatingCoverLetter,
        deletingCoverLetterId,
        waitingForCoverLetter,
        activeSkillMaps,
        skillMapLoading,
        skillMapError,
        generatingSkillMap,
        deletingSkillMapId,
        waitingForSkillMap,
        activeTab,
        setActiveTab,
        handleReset,
        handleSave,
        handleExport,
        handleSelectSaved,
        handleDeleteSaved,
        handleGenerateCoverLetter,
        handleDeleteCoverLetter,
        handleReloadCoverLetters,
        handleGenerateSkillMap,
        handleDeleteSkillMap,
        handleReloadSkillMaps,
    } = editor

    return (
        <div className="min-h-screen relative pb-20">
            <GlobalHeader variant="back" backHref={backHref} backLabel="Back" />

            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {/* Header section - NOT sticky, scrolls away */}
                <div className="mb-4">
                    <h1 className="text-3xl font-bold mb-1 gradient-text">Tailor Your Resume</h1>
                    <p className="text-muted-foreground text-sm max-w-2xl">
                        Click directly on the resume to edit. What you see is exactly what you export.
                    </p>
                </div>

                {/* Sticky toolbar: Tabs + Action buttons */}
                <div className="sticky top-16 z-20 -mx-4 px-4 py-3 mb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'resume' | 'cover' | 'skills')}>
                            <div className="flex items-center gap-3">
                                <TabsList>
                                    <TabsTrigger value="resume">Resume</TabsTrigger>
                                    {showJobRelatedTabs && (
                                        <>
                                            <TabsTrigger value="cover">Cover Letter</TabsTrigger>
                                            <TabsTrigger value="skills">Skill Map</TabsTrigger>
                                        </>
                                    )}
                                </TabsList>
                                {activeTab === 'resume' && (
                                    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowStyleDialog(true)}
                                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-background text-foreground shadow-sm transition-all"
                                        >
                                            <Palette className="h-4 w-4" />
                                            Style
                                        </button>
                                    </div>
                                )}
                                {showJobRelatedTabs && activeTab === 'cover' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleReloadCoverLetters}
                                        disabled={!activeResumeId || coverLetterLoading || waitingForCoverLetter}
                                    >
                                        {coverLetterLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Refresh
                                    </Button>
                                )}
                                {showJobRelatedTabs && activeTab === 'skills' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleReloadSkillMaps}
                                        disabled={!activeResumeId || skillMapLoading || waitingForSkillMap}
                                    >
                                        {skillMapLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Refresh
                                    </Button>
                                )}
                            </div>
                        </Tabs>
                        <ResumeActionBar
                            saving={saving}
                            exporting={exporting}
                            onReset={handleReset}
                            onSave={handleSave}
                            onExport={handleExport}
                            variant="desktop"
                        />
                    </div>
                </div>

                {/* Main content area */}
                <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start justify-items-center xl:justify-items-start">
                    <div className="w-full max-w-full">
                        {activeTab === 'resume' && (
                            <Card
                                className="glass-card p-4 md:p-6"
                                style={{ maxWidth: 'calc(210mm + 3rem)', minWidth: 'min(100%, calc(210mm + 3rem))' }}
                            >
                                <div className="w-full flex justify-center">
                                    <WebResumeRenderer
                                        data={resumeData}
                                        variant={selectedVariant}
                                        onUpdate={setResumeData}
                                        themeMode={themeMode}
                                        onThemeModeChange={setThemeMode}
                                    />
                                </div>
                            </Card>
                        )}

                        {showJobRelatedTabs && activeTab === 'cover' && (
                            <CoverLetterPanel
                                activeResumeId={activeResumeId}
                                resumeName={activeResumeLabel}
                                coverLetters={activeCoverLetters}
                                loading={coverLetterLoading}
                                forceLoading={waitingForCoverLetter}
                                error={coverLetterError}
                                onReload={handleReloadCoverLetters}
                                onDelete={handleDeleteCoverLetter}
                                deletingId={deletingCoverLetterId}
                                generating={generatingCoverLetter}
                                onGenerate={handleGenerateCoverLetter}
                            />
                        )}

                        {showJobRelatedTabs && activeTab === 'skills' && (
                            <SkillMapPanel
                                activeResumeId={activeResumeId}
                                resumeName={activeResumeLabel}
                                skillMaps={activeSkillMaps}
                                loading={skillMapLoading}
                                forceLoading={waitingForSkillMap}
                                error={skillMapError}
                                onReload={handleReloadSkillMaps}
                                onDelete={handleDeleteSkillMap}
                                deletingId={deletingSkillMapId}
                                generating={generatingSkillMap}
                                onGenerate={handleGenerateSkillMap}
                            />
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="hidden xl:block sticky top-[136px]">
                        <RecentResumesList
                            resumes={availableResumes}
                            activeResumeId={activeResumeId}
                            deletingId={deletingId}
                            onSelect={handleSelectSaved}
                            onDelete={handleDeleteSaved}
                            variant="desktop"
                        />
                    </div>
                </div>
            </div>

            <ResumeChatPanel
                resumeData={resumeData}
                resumeId={activeResumeId}
                onApplyModifications={setResumeData}
                onResetToBaseline={handleReset}
            />

            <Dialog open={showStyleDialog} onOpenChange={setShowStyleDialog}>
                <DialogContent className="glass-card !max-w-[95vw] !w-[95vw] !h-[85vh] p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/50 shrink-0">
                        <DialogTitle className="text-xl">Choose a Style</DialogTitle>
                        <DialogDescription className="text-sm">
                            Preview and select a template design for your resume
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-hidden px-2">
                        <TemplatePreviewCarousel
                            resumeData={resumeData}
                            selectedVariant={selectedVariant}
                            onSelect={(v) => {
                                setSelectedVariant(v)
                                setShowStyleDialog(false)
                            }}
                            themeMode={themeMode}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
})
