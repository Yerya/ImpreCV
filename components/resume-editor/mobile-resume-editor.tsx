"use client"

import { memo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalHeader } from "@/components/global-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileDrawer } from "@/components/ui/mobile-drawer"
import { cn } from "@/lib/utils"
import { Eye, Edit3, FileText, Palette } from "lucide-react"
import { CoverLetterPanel } from "@/components/resume-templates/cover-letter-panel"
import { SkillMapPanel } from "@/components/resume-templates/skill-map-panel"
import { WebResumeRenderer } from "@/components/resume-templates/web-renderer"
import { MobileResumeViewer } from "@/components/resume-templates/mobile-resume-viewer"
import { MobileResumeForm } from "@/components/resume-templates/mobile-resume-form"
import { ResumeChatPanel } from "@/components/chat/resume-chat-panel"
import { ResumeActionBar } from "./resume-action-bar"
import { RecentResumesList } from "./recent-resumes-list"
import { StylePicker } from "./style-picker"
import type { UseResumeEditorReturn } from "./types"

interface MobileResumeEditorProps {
    editor: UseResumeEditorReturn
    backHref: string
}

export const MobileResumeEditor = memo(function MobileResumeEditor({
    editor,
    backHref
}: MobileResumeEditorProps) {
    const [mobileView, setMobileView] = useState<'preview' | 'edit'>('preview')
    const [showStyleDrawer, setShowStyleDrawer] = useState(false)
    const [showResumesDrawer, setShowResumesDrawer] = useState(false)

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
        <div className="min-h-screen flex flex-col pb-20">
            <GlobalHeader variant="back" backHref={backHref} backLabel="Back" />

            <div className="px-4 pt-3 pb-2">
                <h1 className="text-xl font-bold gradient-text">Edit Resume</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {mobileView === 'preview' ? 'Pinch to zoom, drag to pan' : 'Edit your resume sections'}
                </p>
            </div>

            <div className="px-4 pb-2">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'resume' | 'cover' | 'skills')}>
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="resume" className="text-xs">Resume</TabsTrigger>
                        <TabsTrigger value="cover" className="text-xs">Cover</TabsTrigger>
                        <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {activeTab === 'resume' && (
                <div className="px-4 pb-2 flex items-center gap-2">
                    <div className="flex-1 flex rounded-lg border border-border/50 p-1 bg-muted/30">
                        <button
                            type="button"
                            onClick={() => setMobileView('preview')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all",
                                mobileView === 'preview'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileView('edit')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium transition-all",
                                mobileView === 'edit'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                        </button>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowStyleDrawer(true)}
                    >
                        <Palette className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowResumesDrawer(true)}
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="flex-1 px-4 pb-4">
                {activeTab === 'resume' ? (
                    mobileView === 'preview' ? (
                        <MobileResumeViewer className="min-h-[60vh]">
                            <WebResumeRenderer
                                data={resumeData}
                                variant={selectedVariant}
                                onUpdate={setResumeData}
                                themeMode={themeMode}
                                onThemeModeChange={setThemeMode}
                                isEditing={false}
                            />
                        </MobileResumeViewer>
                    ) : (
                        <MobileResumeForm
                            data={resumeData}
                            onUpdate={setResumeData}
                        />
                    )
                ) : activeTab === 'cover' ? (
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
                ) : (
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

            <ResumeActionBar
                saving={saving}
                exporting={exporting}
                onReset={handleReset}
                onSave={handleSave}
                onExport={handleExport}
                variant="mobile"
            />

            <MobileDrawer
                open={showStyleDrawer}
                onOpenChange={setShowStyleDrawer}
                title="Choose a Style"
                description="Select a template for your resume"
            >
                <StylePicker
                    selectedVariant={selectedVariant}
                    onSelect={(v) => {
                        setSelectedVariant(v)
                        setShowStyleDrawer(false)
                    }}
                    variant="mobile"
                />
            </MobileDrawer>

            <MobileDrawer
                open={showResumesDrawer}
                onOpenChange={setShowResumesDrawer}
                title="Recent Resumes"
                description="Select a resume to edit"
            >
                <RecentResumesList
                    resumes={availableResumes}
                    activeResumeId={activeResumeId}
                    deletingId={deletingId}
                    onSelect={(resume) => {
                        handleSelectSaved(resume)
                        setShowResumesDrawer(false)
                    }}
                    onDelete={handleDeleteSaved}
                    variant="mobile"
                />
            </MobileDrawer>

            <ResumeChatPanel
                resumeData={resumeData}
                resumeId={activeResumeId}
                onApplyModifications={setResumeData}
                onResetToBaseline={handleReset}
            />

            <MobileBottomNav />
        </div>
    )
})
