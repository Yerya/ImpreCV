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
    badge: string
    layout: 'single' | 'split'
}

const variantThemes: Record<ResumeVariantId, VariantTheme> = {
    tailored: {
        accent: '#0f172a',
        text: '#111827',
        muted: '#475569',
        background: '#f8fafc',
        border: '#e2e8f0',
        badge: '#10b981',
        layout: 'single'
    },
    minimal: {
        accent: '#fafafa',
        text: '#f4f4f5',
        muted: '#d4d4d8',
        background: '#0b0b0f',
        border: '#27272a',
        badge: '#a1a1aa',
        layout: 'split'
    },
    spotlight: {
        accent: '#c2410c',
        text: '#111827',
        muted: '#7c2d12',
        background: '#fffaf0',
        border: '#fde68a',
        badge: '#fb923c',
        layout: 'single'
    }
}

const buildStyles = (theme: VariantTheme, variantId: ResumeVariantId) => StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.5,
        color: theme.text,
        backgroundColor: theme.background
    },
    header: {
        marginBottom: 18,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: theme.border
    },
    name: {
        fontSize: 26,
        fontWeight: 700,
        color: theme.accent,
        marginBottom: 4
    },
    title: {
        fontSize: 13,
        color: theme.muted,
        marginBottom: 8
    },
    badge: {
        fontSize: 9,
        color: theme.accent,
        backgroundColor: variantId === 'minimal' ? '#18181b' : '#ecfeff',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginLeft: 8
    },
    contact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 10,
        color: theme.muted
    },
    contactItem: {
        marginRight: 8
    },
    separator: {
        color: theme.border
    },
    section: {
        marginBottom: 14
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
        color: variantId === 'minimal' ? '#e5e7eb' : '#1f2937',
        lineHeight: 1.5
    },
    item: {
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.border
    },
    itemTitle: {
        fontSize: 12,
        fontWeight: 700,
        color: variantId === 'minimal' ? theme.text : '#0f172a'
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
        color: variantId === 'minimal' ? '#e5e7eb' : '#334155',
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
        paddingVertical: 6,
        paddingHorizontal: 8,
        ...(variantId === 'minimal' ? {
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: '#111114'
        } : {
            backgroundColor: 'transparent'
        }),
        borderRadius: 6
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
        <View style={styles.contact}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <Text style={styles.contactItem}>{item}</Text>
                    {index < items.length - 1 && <Text style={styles.separator}>•</Text>}
                </React.Fragment>
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
            section.content.map((item, index) => <ExperienceItem key={index} item={item} styles={styles} />)
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
                <View style={styles.header}>
                    <Text style={styles.name}>{data.personalInfo.name || 'Resume'}</Text>
                    {data.personalInfo.title && (
                        <Text style={styles.title}>
                            {data.personalInfo.title}
                            <Text style={styles.badge}>  {theme.layout === 'split' ? 'Grid' : 'Flow'}</Text>
                        </Text>
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
            </Page>
        </Document>
    )
}
