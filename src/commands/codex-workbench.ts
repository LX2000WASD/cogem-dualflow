import ansis from 'ansis'
import { spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'pathe'
import fs from 'fs-extra'
import { getAllCommandIds, installWorkflows } from '../utils/installer'

interface SetupCodexBridgeOptions {
  codexHome?: string
  force?: boolean
}

interface SetupCodexBridgeResult {
  success: boolean
  codexHome: string
  skillPath: string
  commandsPath: string
  copiedAuth: boolean
  copiedConfig: boolean
  message: string
}

const BRIDGE_SKILL_NAME = 'cogem-slash-bridge'

function getDefaultCodexHome(): string {
  return join(homedir(), '.cogem', 'codex-home')
}

function getDefaultCogemHome(): string {
  return join(homedir(), '.cogem')
}

function getLegacyCodexHome(): string {
  return join(homedir(), '.codex')
}

function buildSkillContent(commandsPath: string): string {
  return `---
name: ${BRIDGE_SKILL_NAME}
description: Use when user input includes /cogem:<command> (for example /cogem:plan, /cogem:execute, /cogem:review). This skill maps slash text to CoGem workflow templates under ${commandsPath} and executes the matching workflow.
---

# CoGem Slash Bridge

## Trigger

Use this skill when user input contains:\n
- \`/cogem:<command>\`\n
- or asks to run a CoGem workflow command by name.

## Source of truth

CoGem command templates live at:\n
- \`${commandsPath}\`

## Execution workflow

1. Parse user input to extract \`<command>\` and command arguments.
2. Map to template file: \`${commandsPath}/<command>.md\`.
3. If file exists, read it and execute according to template intent.
4. Replace \`$ARGUMENTS\` in the template with user provided arguments.
5. If command file is missing, list available command files from \`${commandsPath}\` and ask user to pick one.
6. Always prefer Codex for planning/backend orchestration and Gemini for frontend tasks.

## Guardrails

- Do not claim built-in Codex slash command registration.
- Treat \`/cogem:*\` as text trigger routed by this skill.
- Keep execution steps transparent: show which template file is selected before acting.
`
}

async function ensureCogemCommands(commandsPath: string, force = false): Promise<void> {
  if (await fs.pathExists(commandsPath)) {
    const files = await fs.readdir(commandsPath)
    if (files.some(file => file.endsWith('.md')) && !force) {
      return
    }
  }

  const cogemHome = getDefaultCogemHome()
  await installWorkflows(getAllCommandIds(), cogemHome, true, {
    routing: {
      mode: 'smart',
      frontend: { models: ['gemini'], primary: 'gemini' },
      backend: { models: ['codex'], primary: 'codex' },
      review: { models: ['codex', 'gemini'] },
    },
    liteMode: false,
    mcpProvider: 'ace-tool',
  })
}

export async function setupCodexBridge(options: SetupCodexBridgeOptions = {}): Promise<SetupCodexBridgeResult> {
  const codexHome = options.codexHome || getDefaultCodexHome()
  const legacyCodexHome = getLegacyCodexHome()
  const cogemCommandsPath = join(getDefaultCogemHome(), 'commands', 'cogem')
  const skillPath = join(codexHome, 'skills', BRIDGE_SKILL_NAME)
  const skillFile = join(skillPath, 'SKILL.md')

  let copiedAuth = false
  let copiedConfig = false

  await fs.ensureDir(codexHome)
  await fs.ensureDir(skillPath)

  await ensureCogemCommands(cogemCommandsPath, options.force)

  if (await fs.pathExists(legacyCodexHome)) {
    const legacyAuth = join(legacyCodexHome, 'auth.json')
    const legacyConfig = join(legacyCodexHome, 'config.toml')
    const targetAuth = join(codexHome, 'auth.json')
    const targetConfig = join(codexHome, 'config.toml')

    if (!(await fs.pathExists(targetAuth)) && await fs.pathExists(legacyAuth)) {
      await fs.copy(legacyAuth, targetAuth)
      copiedAuth = true
    }

    if (!(await fs.pathExists(targetConfig)) && await fs.pathExists(legacyConfig)) {
      await fs.copy(legacyConfig, targetConfig)
      copiedConfig = true
    }
  }

  await fs.writeFile(skillFile, buildSkillContent(cogemCommandsPath), 'utf-8')

  return {
    success: true,
    codexHome,
    skillPath,
    commandsPath: cogemCommandsPath,
    copiedAuth,
    copiedConfig,
    message: 'Codex bridge installed',
  }
}

export async function setupCodexBridgeAndPrint(options: SetupCodexBridgeOptions = {}): Promise<void> {
  console.log()
  console.log(ansis.cyan.bold('  🔌 配置 Codex 适配层'))
  console.log()

  try {
    const result = await setupCodexBridge(options)

    console.log(ansis.green('✓ Codex 适配层安装成功'))
    console.log(`  ${ansis.gray('•')} CODEX_HOME: ${result.codexHome}`)
    console.log(`  ${ansis.gray('•')} Skill: ${result.skillPath}`)
    console.log(`  ${ansis.gray('•')} Commands: ${result.commandsPath}`)

    if (result.copiedAuth) {
      console.log(`  ${ansis.gray('•')} 已复制认证: auth.json`)
    }
    if (result.copiedConfig) {
      console.log(`  ${ansis.gray('•')} 已复制配置: config.toml`)
    }

    console.log()
    console.log(ansis.cyan('  现在可用以下方式进入一体化工作台：'))
    console.log(ansis.gray('    npx cogem-dualflow codex'))
    console.log(ansis.gray('    或全局安装后: cogem codex'))
    console.log()
  }
  catch (error) {
    console.log(ansis.red(`✗ Codex 适配层安装失败: ${error}`))
    console.log()
  }
}

export async function launchCodexWorkbench(args: string[] = [], options: SetupCodexBridgeOptions = {}): Promise<void> {
  const setup = await setupCodexBridge(options)

  console.log()
  console.log(ansis.cyan.bold('  🚀 启动 CoGem Workbench (Codex)'))
  console.log(`  ${ansis.gray('CODEX_HOME')}=${setup.codexHome}`)
  console.log(`  ${ansis.gray('Slash Bridge')}=${setup.skillPath}`)
  console.log()

  await new Promise<void>((resolve) => {
    const child = spawn('codex', args, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        CODEX_HOME: setup.codexHome,
      },
    })

    child.on('close', () => resolve())
    child.on('error', () => resolve())
  })
}
