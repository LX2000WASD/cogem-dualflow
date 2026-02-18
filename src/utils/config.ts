import type { CoGemWorkflowConfig, ModelRouting, SupportedLang } from '../types'
import fs from 'fs-extra'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { parse, stringify } from 'smol-toml'
import { version as packageVersion } from '../../package.json'

// CoGem 配置目录统一到 ~/.cogem/config/
const COGEM_CONFIG_DIR = join(homedir(), '.cogem', 'config')
const CONFIG_FILE = join(COGEM_CONFIG_DIR, 'config.toml')

export function getCoGemConfigDir(): string {
  return COGEM_CONFIG_DIR
}

export function getConfigPath(): string {
  return CONFIG_FILE
}

export async function ensureCoGemConfigDir(): Promise<void> {
  await fs.ensureDir(COGEM_CONFIG_DIR)
}

export async function readWorkflowConfig(): Promise<CoGemWorkflowConfig | null> {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8')
      return parse(content) as unknown as CoGemWorkflowConfig
    }
  }
  catch {
    // Config doesn't exist or is invalid
  }
  return null
}

export async function writeWorkflowConfig(config: CoGemWorkflowConfig): Promise<void> {
  await ensureCoGemConfigDir()
  const content = stringify(config as any)
  await fs.writeFile(CONFIG_FILE, content, 'utf-8')
}

export function createDefaultConfig(options: {
  language: SupportedLang
  routing: ModelRouting
  installedWorkflows: string[]
  mcpProvider?: string
  liteMode?: boolean
}): CoGemWorkflowConfig {
  return {
    general: {
      version: packageVersion,
      language: options.language,
      createdAt: new Date().toISOString(),
    },
    routing: options.routing,
    workflows: {
      installed: options.installedWorkflows,
    },
    paths: {
      commands: join(homedir(), '.cogem', 'commands', 'cogem'),
      prompts: join(COGEM_CONFIG_DIR, 'prompts'),
      backup: join(COGEM_CONFIG_DIR, 'backup'),
    },
    mcp: {
      provider: options.mcpProvider || 'ace-tool',
      setup_url: 'https://augmentcode.com/',
    },
    performance: {
      liteMode: options.liteMode || false,
    },
  }
}

// 兼容旧命名（后续版本可移除）
export const getCcgDir = getCoGemConfigDir
export const ensureCcgDir = ensureCoGemConfigDir
export const readCcgConfig = readWorkflowConfig
export const writeCcgConfig = writeWorkflowConfig

export function createDefaultRouting(): ModelRouting {
  return {
    frontend: {
      models: ['gemini'],
      primary: 'gemini',
      strategy: 'parallel',
    },
    backend: {
      models: ['codex'],
      primary: 'codex',
      strategy: 'parallel',
    },
    review: {
      models: ['codex', 'gemini'],
      strategy: 'parallel',
    },
    mode: 'smart',
  }
}
