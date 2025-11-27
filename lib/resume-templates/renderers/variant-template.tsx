import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ResumeData, ResumeItem } from '../types'
import type { ResumeVariantId } from '../variants'

interface VariantTheme {
    accent: string
    text: string
    muted: string
    background: string
    border: string
    surface: string
    badge: string
    layout: 'single' | 'split'
    headerAccent: string
}

const variantThemes: Record<ResumeVariantId, VariantTheme> = {
    tailored: {
        accent: '#cbd5f5',
        text: '#e2e8f0',
        muted: '#cbd5e1',
        background: '#0b1220',
        border: '#1f2937',
        surface: '#111827',
        badge: '#a855f7',
        layout: 'single',
        headerAccent: '#e2e8f0'
    },
    minimal: {
        accent: '#fafafa',
        text: '#f4f4f5',
        muted: '#d4d4d8',
        background: '#0b0b0f',
        border: '#27272a',
        surface: '#0f0f13',
        badge: '#a1a1aa',
        layout: 'single',
        headerAccent: '#f4f4f5'
    },
    spotlight: {
        accent: '#c2410c',
        text: '#111827',
        muted: '#7c2d12',
        background: '#fffaf0',
        border: '#fde68a',
        surface: '#fff7e6',
        badge: '#fb923c',
        layout: 'single',
        headerAccent: '#111827'
    }
}

const buildStyles = (theme: VariantTheme, variantId: ResumeVariantId) => StyleSheet.create({
    page: {
        padding: 36,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.5,
        color: theme.text,
        backgroundColor: theme.background
    },
    header: {
        marginBottom: 14
    },
    name: {
        fontSize: 26,
        fontWeight: 700,
        color: theme.headerAccent,
        marginBottom: 4
    },
    title: {
        fontSize: 13,
        color: theme.muted,
        marginBottom: 8
    },
    badge: {
        fontSize: 9,
        color: theme.text,
        backgroundColor: variantId === 'minimal' ? '#18181b' : theme.border,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginLeft: 8
    },
    contactBlock: {
        marginTop: 6,
        gap: 4,
        display: 'flex',
        flexDirection: 'column'
    },
    contactLine: {
        fontSize: 10.5,
        color: theme.muted
    },
    section: {
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1,
        color: theme.accent,
        textTransform: 'uppercase',
        marginBottom: 8
    },
    paragraph: {
        fontSize: 10.5,
        color: theme.text,
        lineHeight: 1.5
    },
    item: {
        marginBottom: 10
    },
    itemTitle: {
        fontSize: 12,
        fontWeight: 700,
        color: theme.text
    },
    subtitle: {
        fontSize: 11,
        color: theme.muted,
        marginTop: 2
    },
    date: {
        fontSize: 10,
        color: theme.muted,
        fontStyle: 'italic'
    },
    bulletList: {
        marginTop: 4
    },
    bullet: {
        fontSize: 10,
        color: theme.text,
        marginLeft: 10,
        marginBottom: 3
    },
    bulletMarker: {
        color: theme.accent,
        marginRight: 6,
        fontWeight: 700
    },
    columns: {
        flexDirection: 'row',
        gap: 18
    },
    sidebar: {
        width: '35%'
    },
    main: {
        width: '65%'
    },
    singleColumn: {
        width: '100%'
    },
    card: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface
    },
    pageCard: {
        padding: 18,
        borderRadius: 14,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border
    },
    sectionGap: {
        marginTop: 10
    }
})

const ContactInfo = ({ data, styles }: { data: ResumeData; styles: ReturnType<typeof buildStyles> }) => {
    const items = [
        data.personalInfo.email,
        data.personalInfo.phone,
        data.personalInfo.location,
        data.personalInfo.linkedin,
        data.personalInfo.website
    ].filter(Boolean)

    if (!items.length) return null

    return (
        <View style={styles.contactBlock}>
            {items.map((item, index) => (
                <Text key={index} style={styles.contactLine}>{item}</Text>
            ))}
        </View>
    )
}

const ExperienceItem = ({ item, styles }: { item: ResumeItem; styles: ReturnType<typeof buildStyles> }) => (
    <View style={styles.item}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
            </View>
            {item.date && <Text style={styles.date}>{item.date}</Text>}
        </View>
        {item.description && <Text style={styles.paragraph}>{item.description}</Text>}
        {item.bullets?.length ? (
            <View style={styles.bulletList}>
                {item.bullets.map((bullet, index) => (
                    <Text key={index} style={styles.bullet}>
                        <Text style={styles.bulletMarker}>•</Text>
                        {bullet}
                    </Text>
                ))}
            </View>
        ) : null}
    </View>
)

const SectionBlock = ({ section, styles }: { section: ResumeData['sections'][0]; styles: ReturnType<typeof buildStyles> }) => (
    <View style={styles.section}>
        {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}

        {typeof section.content === 'string' ? (
            <View style={styles.card}>
                <Text style={styles.paragraph}>{section.content}</Text>
            </View>
        ) : (
            <View style={styles.card}>
                {section.content.map((item, index) => (
                    <ExperienceItem key={index} item={item} styles={styles} />
                ))}
            </View>
        )}
    </View>
)

export const ResumeVariantTemplate = ({ data, variantId }: { data: ResumeData; variantId: ResumeVariantId }) => {
    const theme = variantThemes[variantId] ?? variantThemes.tailored
    const styles = buildStyles(theme, variantId)

    const sidebarSections = theme.layout === 'split'
        ? data.sections.filter((section) => section.type === 'skills' || section.type === 'education')
        : []
    const mainSections = theme.layout === 'split'
        ? data.sections.filter((section) => section.type !== 'skills' && section.type !== 'education')
        : data.sections

    const shouldSplit = theme.layout === 'split' && sidebarSections.length > 0

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.pageCard}>
                    <View style={styles.header}>
                        <Text style={styles.name}>{data.personalInfo.name || 'Resume'}</Text>
                        {data.personalInfo.title && (
                            <Text style={styles.title}>{data.personalInfo.title}</Text>
                        )}
                        <ContactInfo data={data} styles={styles} />
                    </View>

                    {shouldSplit ? (
                        <View style={styles.columns}>
                            <View style={styles.sidebar}>
                                {sidebarSections.map((section, index) => (
                                    <SectionBlock key={index} section={section} styles={styles} />
                                ))}
                            </View>
                            <View style={styles.main}>
                                {mainSections.map((section, index) => (
                                    <SectionBlock key={index} section={section} styles={styles} />
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.singleColumn}>
                            {mainSections.map((section, index) => (
                                <SectionBlock key={index} section={section} styles={styles} />
                            ))}
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    )
}
