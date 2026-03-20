#!/usr/bin/env node

import inquirer from 'inquirer'
import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'

const THEME_PRESETS = {
  dark: {
    bgPrimary: '#0a0e16',
    bgSecondary: '#0e1117',
    bgSurface: '#111827',
    textPrimary: '#e0e0d0',
    textSecondary: '#6a7282',
    borderPrimary: '#1a2233',
    borderSecondary: '#2a3545',
  },
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f9fafb',
    bgSurface: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    borderPrimary: '#e5e7eb',
    borderSecondary: '#d1d5db',
  },
}

function colorTable(colors) {
  return [
    '| Token                | Value                | Usage                |',
    '|----------------------|----------------------|----------------------|',
    `| \`--bg-primary\`       | ${colors.bgPrimary.padEnd(20)} | Main page background |`,
    `| \`--bg-secondary\`     | ${colors.bgSecondary.padEnd(20)} | Secondary surfaces   |`,
    `| \`--bg-surface\`       | ${colors.bgSurface.padEnd(20)} | Cards, panels        |`,
    `| \`--text-primary\`     | ${colors.textPrimary.padEnd(20)} | Primary text         |`,
    `| \`--text-secondary\`   | ${colors.textSecondary.padEnd(20)} | Muted text           |`,
    `| \`--border-primary\`   | ${colors.borderPrimary.padEnd(20)} | Default borders      |`,
    `| \`--border-secondary\` | ${colors.borderSecondary.padEnd(20)} | Subtle dividers      |`,
  ].join('\n')
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

console.log('\n🚀 Better System — Create new project\n')

const answers = await inquirer.prompt([
  {
    name: 'name',
    message: 'Project name?',
    validate: (v) => v.trim().length > 0 || 'Name is required',
  },
  {
    name: 'theme',
    type: 'list',
    message: 'Color theme?',
    choices: [
      { name: 'Dark only', value: 'dark' },
      { name: 'Light only', value: 'light' },
      { name: 'Both (dark + light with toggle)', value: 'both' },
    ],
    default: 'dark',
  },
  {
    name: 'headingFont',
    message: 'Heading font (e.g. Poppins, Sora)?',
    default: 'Poppins',
  },
  {
    name: 'accentPrimary',
    message: 'Primary accent color (hex)?',
    default: '#D4AF37',
  },
  {
    name: 'accentSecondary',
    message: 'Secondary accent color (hex)?',
    default: '#38bdf8',
  },
])

// ─── Resolve values ───────────────────────────────────────────────────────────

const projectName = answers.name.trim()
const projectPath = path.resolve(process.cwd(), projectName)

const isBoth = answers.theme === 'both'
const isDark = answers.theme === 'dark'

const defaultColors = isBoth || isDark ? THEME_PRESETS.light : THEME_PRESETS.light
const rootColors = isBoth ? THEME_PRESETS.light : (isDark ? THEME_PRESETS.dark : THEME_PRESETS.light)
const darkColors = THEME_PRESETS.dark

// ─── Clone template ───────────────────────────────────────────────────────────

console.log('\n📦 Cloning Better System template...')
await execa('npx', ['degit', 'brunogilferro/better-system', projectName], {
  stdio: 'inherit',
})

// ─── Fill globals.css placeholders ───────────────────────────────────────────

console.log('💅 Configuring CSS variables...')

const cssPath = path.join(projectPath, 'apps', 'frontend', 'app', 'globals.css')
let css = await fs.readFile(cssPath, 'utf-8')

// Root (default theme) token replacements
const cssReplacements = {
  '__HEADING_FONT__': answers.headingFont,
  '__BODY_FONT__': 'Inter',
  '__ACCENT_PRIMARY__': answers.accentPrimary,
  '__ACCENT_PRIMARY_HOVER__': answers.accentPrimary,
  '__ACCENT_SECONDARY__': answers.accentSecondary,
  '__BG_PRIMARY__': rootColors.bgPrimary,
  '__BG_SECONDARY__': rootColors.bgSecondary,
  '__BG_SURFACE__': rootColors.bgSurface,
  '__TEXT_PRIMARY__': rootColors.textPrimary,
  '__TEXT_SECONDARY__': rootColors.textSecondary,
  '__BORDER_PRIMARY__': rootColors.borderPrimary,
  '__BORDER_SECONDARY__': rootColors.borderSecondary,
}

for (const [placeholder, value] of Object.entries(cssReplacements)) {
  css = css.replaceAll(placeholder, value)
}

if (isBoth) {
  // Fill dark theme block placeholders
  const darkReplacements = {
    '__DARK_BG_PRIMARY__': darkColors.bgPrimary,
    '__DARK_BG_SECONDARY__': darkColors.bgSecondary,
    '__DARK_BG_SURFACE__': darkColors.bgSurface,
    '__DARK_TEXT_PRIMARY__': darkColors.textPrimary,
    '__DARK_TEXT_SECONDARY__': darkColors.textSecondary,
    '__DARK_BORDER_PRIMARY__': darkColors.borderPrimary,
    '__DARK_BORDER_SECONDARY__': darkColors.borderSecondary,
  }

  for (const [placeholder, value] of Object.entries(darkReplacements)) {
    css = css.replaceAll(placeholder, value)
  }

  // Remove the comment markers but keep the .dark block
  css = css.replace('/* DARK_THEME_BLOCK_START */', '').replace('/* DARK_THEME_BLOCK_END */', '')
} else {
  // Remove the entire dark theme block (between markers inclusive)
  css = css.replace(
    /\/\* DARK_THEME_BLOCK_START \*\/[\s\S]*?\/\* DARK_THEME_BLOCK_END \*\//,
    ''
  )
}

// For dark-only: also set @custom-variant to .dark class based (already set by default)
// For light-only: nothing extra needed

await fs.writeFile(cssPath, css)

// ─── Fill figma-design-rules.md placeholders ─────────────────────────────────

console.log('🎨 Configuring design tokens...')

const figmaRulesPath = path.join(projectPath, 'docs', 'figma-design-rules.md')
let figmaRules = await fs.readFile(figmaRulesPath, 'utf-8')

let colorsSection
if (isBoth) {
  colorsSection = [
    '## Colors — Light theme (default)',
    '',
    colorTable(THEME_PRESETS.light),
    '',
    '## Colors — Dark theme (`.dark` class on `<html>`)',
    '',
    colorTable(THEME_PRESETS.dark),
  ].join('\n')
} else {
  const label = isDark ? 'Dark theme' : 'Light theme'
  colorsSection = `## Colors — ${label}\n\n${colorTable(rootColors)}`
}

const cssBlock = isBoth ? 'Both light and dark — see globals.css' : `Single theme (${answers.theme})`

const figmaReplacements = {
  '__THEME_MODE__': answers.theme,
  '__HEADING_FONT__': answers.headingFont,
  '__BODY_FONT__': 'Inter',
  '__ACCENT_PRIMARY__': answers.accentPrimary,
  '__ACCENT_PRIMARY_HOVER__': answers.accentPrimary,
  '__ACCENT_SECONDARY__': answers.accentSecondary,
  '__COLORS_SECTION__': colorsSection,
  '__CSS_BLOCK__': cssBlock,
}

for (const [placeholder, value] of Object.entries(figmaReplacements)) {
  figmaRules = figmaRules.replaceAll(placeholder, value)
}

await fs.writeFile(figmaRulesPath, figmaRules)

// ─── Update root package.json ─────────────────────────────────────────────────

console.log('📝 Updating package.json...')

const rootPkgPath = path.join(projectPath, 'package.json')
const rootPkg = await fs.readJson(rootPkgPath)
rootPkg.name = projectName
await fs.writeJson(rootPkgPath, rootPkg, { spaces: 2 })

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log(`\n✅ Project "${projectName}" created!`)

if (isBoth) {
  console.log(`\n💡 Both themes enabled.`)
  console.log(`   Light is the default. Add class="dark" to <html> to activate dark.`)
}

console.log(`\nNext steps:`)
console.log(`  cd ${projectName}`)
console.log(`  pnpm install`)
console.log(`  pnpm dev\n`)
