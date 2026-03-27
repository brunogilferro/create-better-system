#!/usr/bin/env node

import inquirer from 'inquirer'
import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import ora from 'ora'

// ─── Node version check ───────────────────────────────────────────────────────

const MIN_NODE = 20
const currentMajor = parseInt(process.versions.node.split('.')[0], 10)
if (currentMajor < MIN_NODE) {
  console.error(`\n❌ Node.js ${MIN_NODE}+ required. You are running ${process.versions.node}.\n`)
  process.exit(1)
}

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

// Converts a font name like "Open Sans" to the Next.js import format "Open_Sans"
function toNextFontName(fontName) {
  return fontName.trim().replace(/\s+/g, '_')
}

// Converts a font name to a valid JS variable name: "Open Sans" → "openSans"
function toVarName(fontName) {
  const words = fontName.trim().split(/\s+/)
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
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
const rootColors = isBoth ? THEME_PRESETS.light : (isDark ? THEME_PRESETS.dark : THEME_PRESETS.light)
const darkColors = THEME_PRESETS.dark

// Font helpers
const headingFontNextName = toNextFontName(answers.headingFont)
const headingFontVarName = toVarName(answers.headingFont) + 'Font'

// ─── Clone template ───────────────────────────────────────────────────────────

const spinnerClone = ora('Cloning Better System template...').start()
try {
  await execa('npx', ['degit', 'brunogilferro/better-system', projectName], {
    stdio: 'pipe',
  })
  spinnerClone.succeed('Template cloned')
} catch (err) {
  spinnerClone.fail('Failed to clone template')
  throw err
}

// ─── Update layout.tsx with heading font ─────────────────────────────────────

const spinnerSetup = ora('Configuring project...').start()

const layoutPath = path.join(projectPath, 'apps', 'frontend', 'app', 'layout.tsx')
let layout = await fs.readFile(layoutPath, 'utf-8')

const isInterHeading = headingFontNextName === 'Inter'

layout = layout
  .replace(
    '// __HEADING_FONT_IMPORT__',
    isInterHeading ? '' : `import { ${headingFontNextName} } from "next/font/google"`
  )
  .replace(
    '// __HEADING_FONT_DECLARATION__',
    isInterHeading
      ? `const ${headingFontVarName} = Inter({\n  variable: "--font-heading",\n  subsets: ["latin"],\n  weight: ["400", "500", "700"],\n})`
      : `const ${headingFontVarName} = ${headingFontNextName}({\n  variable: "--font-heading",\n  subsets: ["latin"],\n  weight: ["400", "500", "700"],\n})`
  )
  .replaceAll('__HEADING_FONT_CLASS__', `\${${headingFontVarName}.variable}`)
  .replaceAll('__PROJECT_NAME__', projectName)

await fs.writeFile(layoutPath, layout)
spinnerSetup.text = 'Configuring CSS variables...'

// ─── Fill globals.css placeholders ───────────────────────────────────────────


const cssPath = path.join(projectPath, 'apps', 'frontend', 'app', 'globals.css')
let css = await fs.readFile(cssPath, 'utf-8')

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
  css = css.replace('/* DARK_THEME_BLOCK_START */', '').replace('/* DARK_THEME_BLOCK_END */', '')
} else {
  css = css.replace(
    /\/\* DARK_THEME_BLOCK_START \*\/[\s\S]*?\/\* DARK_THEME_BLOCK_END \*\//,
    ''
  )
}

await fs.writeFile(cssPath, css)
spinnerSetup.text = 'Configuring design tokens...'

// ─── Fill figma-design-rules.md placeholders ─────────────────────────────────


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

const figmaReplacements = {
  '__THEME_MODE__': answers.theme,
  '__HEADING_FONT__': answers.headingFont,
  '__BODY_FONT__': 'Inter',
  '__ACCENT_PRIMARY__': answers.accentPrimary,
  '__ACCENT_PRIMARY_HOVER__': answers.accentPrimary,
  '__ACCENT_SECONDARY__': answers.accentSecondary,
  '__COLORS_SECTION__': colorsSection,
  '__CSS_BLOCK__': isBoth ? 'Both light and dark — see globals.css' : `Single theme (${answers.theme})`,
}

for (const [placeholder, value] of Object.entries(figmaReplacements)) {
  figmaRules = figmaRules.replaceAll(placeholder, value)
}

await fs.writeFile(figmaRulesPath, figmaRules)
spinnerSetup.text = 'Generating APP_KEY...'

// ─── Setup backend .env ───────────────────────────────────────────────────────


const backendPath = path.join(projectPath, 'apps', 'backend')
const envExamplePath = path.join(backendPath, '.env.example')
const envPath = path.join(backendPath, '.env')

await fs.copy(envExamplePath, envPath)

const generatedKey = crypto.randomBytes(32).toString('base64url')

let envContent = await fs.readFile(envPath, 'utf-8')
envContent = envContent.replace('APP_KEY=', `APP_KEY=${generatedKey}`)
await fs.writeFile(envPath, envContent)
spinnerSetup.text = 'Updating package.json...'

// ─── Update root package.json ─────────────────────────────────────────────────


const rootPkgPath = path.join(projectPath, 'package.json')
const rootPkg = await fs.readJson(rootPkgPath)
rootPkg.name = projectName
await fs.writeJson(rootPkgPath, rootPkg, { spaces: 2 })
spinnerSetup.succeed('Project configured')

// ─── Git init ─────────────────────────────────────────────────────────────────

const spinnerGit = ora('Initializing git repository...').start()
await execa('git', ['init'], { cwd: projectPath })
await execa('git', ['add', '.'], { cwd: projectPath })
await execa('git', ['commit', '-m', 'init: better system'], { cwd: projectPath })
spinnerGit.succeed('Git repository initialized')

// ─── Ensure pnpm is available ─────────────────────────────────────────────────

try {
  await execa('pnpm', ['--version'], { stdio: 'pipe' })
} catch {
  const spinnerPnpm = ora('pnpm not found — installing via npm...').start()
  try {
    await execa('npm', ['install', '-g', 'pnpm'], { stdio: 'pipe' })
    spinnerPnpm.succeed('pnpm installed')
  } catch {
    spinnerPnpm.fail('Could not install pnpm. Install it manually: npm install -g pnpm')
    process.exit(1)
  }
}

// ─── pnpm install ─────────────────────────────────────────────────────────────

const spinnerInstall = ora('Installing dependencies...').start()
try {
  await execa('pnpm', ['install'], { cwd: projectPath, stdio: 'pipe' })
  spinnerInstall.succeed('Dependencies installed')
} catch {
  spinnerInstall.fail('pnpm install failed — run it manually: cd ' + projectName + ' && pnpm install')
}

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log(`\n✅ Project "${projectName}" created!`)

if (isBoth) {
  console.log(`\n💡 Both themes enabled.`)
  console.log(`   Light is the default. Add class="dark" to <html> to activate dark.`)
}

console.log(`\nNext steps:`)
console.log(`  cd ${projectName}`)
console.log(`  pnpm dev`)
console.log(`\nTo push to GitHub:`)
console.log(`  gh repo create ${projectName} --private --source=. --push\n`)
