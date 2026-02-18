/**
 * MCP (Model Context Protocol) configuration utilities
 * Adapted from zcf project's cogem-config.ts and features.ts
 */

import { homedir } from 'node:os'
import { dirname, join } from 'pathe'
import fs from 'fs-extra'
import { getMcpCommand, isWindows } from './platform'

/**
 * MCP Server Configuration interface
 */
export interface McpServerConfig {
  type: 'stdio' | 'sse'
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
  startup_timeout_ms?: number
}

/**
 * CoGem MCP Configuration interface
 */
export interface CoGemConfig {
  mcpServers?: Record<string, McpServerConfig>
  hasCompletedOnboarding?: boolean
  customApiKeyResponses?: {
    approved: string[]
    rejected: string[]
  }
  env?: Record<string, string>
  primaryApiKey?: string
  installMethod?: 'npm-global' | 'native'
  // ... other fields preserved
  [key: string]: any
}

/**
 * Get CoGem MCP config path (~/.cogem/config.json)
 */
export function getCoGemConfigPath(): string {
  return join(homedir(), '.cogem', 'config.json')
}

/**
 * Read CoGem MCP config
 */
export async function readCoGemConfig(): Promise<CoGemConfig | null> {
  const configPath = getCoGemConfigPath()

  try {
    if (!(await fs.pathExists(configPath))) {
      return null
    }

    const content = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(content) as CoGemConfig
  }
  catch (error) {
    console.error('Failed to read CoGem MCP config:', error)
    return null
  }
}

/**
 * Write CoGem MCP config
 */
export async function writeCoGemConfig(config: CoGemConfig): Promise<void> {
  const configPath = getCoGemConfigPath()

  try {
    await fs.ensureDir(dirname(configPath))
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
  }
  catch (error) {
    throw new Error(`Failed to write CoGem MCP config: ${error}`)
  }
}

/**
 * Apply platform-specific command wrapper to MCP server config
 * On Windows, npx/uvx commands need cmd /c wrapper
 *
 * @param config - MCP server configuration to modify
 */
export function applyPlatformCommand(config: McpServerConfig): void {
  // Only process if command exists (avoid wrapping SSE services)
  if (isWindows() && config.command) {
    // 幂等性检查：如果 command 已经是 'cmd'，说明已处理过，跳过
    if (config.command === 'cmd') {
      return
    }

    const mcpCmd = getMcpCommand(config.command)

    // Only modify if command needs Windows wrapper (cmd /c)
    if (mcpCmd[0] === 'cmd') {
      const originalArgs = config.args || []
      config.command = mcpCmd[0] // 'cmd'
      // getMcpCommand 已返回 ['cmd', '/c', 'npx']，slice(1) = ['/c', 'npx']
      config.args = [...mcpCmd.slice(1), ...originalArgs]
    }
  }
}

/**
 * Build MCP server config with platform-specific adjustments
 *
 * @param baseConfig - Base MCP server configuration
 * @param apiKey - Optional API key to inject
 * @param placeholder - Placeholder to replace with API key
 * @param envVarName - Optional environment variable name for API key
 * @returns Platform-adjusted MCP server configuration
 */
export function buildMcpServerConfig(
  baseConfig: McpServerConfig,
  apiKey?: string,
  placeholder: string = 'YOUR_API_KEY',
  envVarName?: string,
): McpServerConfig {
  // Deep clone to avoid mutation
  const config = JSON.parse(JSON.stringify(baseConfig)) as McpServerConfig

  // Apply platform-specific command wrapper
  applyPlatformCommand(config)

  if (!apiKey) {
    return config
  }

  // Method 1: Set environment variable directly (recommended)
  if (envVarName && config.env) {
    config.env[envVarName] = apiKey
    return config
  }

  // Method 2: Replace placeholder in args (legacy)
  if (config.args) {
    config.args = config.args.map(arg => arg.replace(placeholder, apiKey))
  }

  // Method 3: Replace placeholder in URL (for SSE services)
  if (config.url) {
    config.url = config.url.replace(placeholder, apiKey)
  }

  return config
}

/**
 * Repair corrupted Windows MCP configuration
 * Fixes issues like duplicated commands in args array
 *
 * @param config - MCP server configuration to repair
 * @returns true if config was repaired, false if no repair needed
 */
export function repairCorruptedMcpArgs(config: McpServerConfig): boolean {
  if (!isWindows() || config.command !== 'cmd' || !config.args) {
    return false
  }

  const args = config.args
  let repaired = false

  // 检测并修复 args 开头的错误模式
  // 正确格式: ['/c', 'npx', '-y', ...]
  // 错误格式1: ['cmd', '/c', 'npx', ...] (开头多余的 cmd)
  // 错误格式2: ['/c', 'npx', 'npx', ...] (重复的命令)
  // 错误格式3: ['cmd', '/c', 'npx', 'npx', ...] (两种错误的组合)

  // 移除开头多余的 'cmd'
  if (args[0] === 'cmd') {
    args.shift()
    repaired = true
  }

  // 确保第一个是 '/c'
  if (args[0] !== '/c') {
    return repaired
  }

  // 检测并移除重复的命令 (如 'npx', 'npx')
  if (args.length >= 3 && args[1] === args[2]) {
    args.splice(2, 1) // 移除重复的命令
    repaired = true
  }

  return repaired
}

/**
 * Fix Windows MCP configuration by applying platform wrappers
 * This function processes all MCP servers in the config and applies Windows-specific fixes
 *
 * @param config - CoGem MCP configuration
 * @returns Fixed configuration with Windows command wrappers
 */
export function fixWindowsMcpConfig(config: CoGemConfig): CoGemConfig {
  if (!isWindows() || !config.mcpServers) {
    return config
  }

  // Clone config to avoid mutation
  const fixed = JSON.parse(JSON.stringify(config)) as CoGemConfig

  // Fix each MCP server configuration
  for (const [serverName, serverConfig] of Object.entries(fixed.mcpServers || {})) {
    if (serverConfig && typeof serverConfig === 'object' && 'command' in serverConfig) {
      const mcpConfig = serverConfig as McpServerConfig
      // 先尝试修复损坏的配置
      repairCorruptedMcpArgs(mcpConfig)
      // 再应用平台命令包装（幂等，已处理过的会跳过）
      applyPlatformCommand(mcpConfig)
    }
  }

  return fixed
}

/**
 * Merge new MCP servers into existing configuration
 * Preserves all other fields in the config
 *
 * @param existing - Existing CoGem MCP configuration (or null)
 * @param newServers - New MCP servers to add/update
 * @returns Merged configuration
 */
export function mergeMcpServers(
  existing: CoGemConfig | null,
  newServers: Record<string, McpServerConfig>,
): CoGemConfig {
  const config: CoGemConfig = existing || { mcpServers: {} }

  if (!config.mcpServers) {
    config.mcpServers = {}
  }

  // Merge new servers (will override existing servers with same name)
  Object.assign(config.mcpServers, newServers)

  return config
}

/**
 * Create backup of CoGem MCP config
 * @returns Backup file path or null if failed
 */
export async function backupCoGemConfig(): Promise<string | null> {
  const configPath = getCoGemConfigPath()

  try {
    if (!(await fs.pathExists(configPath))) {
      return null
    }

    const backupDir = join(homedir(), '.cogem', 'backup')
    await fs.ensureDir(backupDir)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = join(backupDir, `cogem-config-${timestamp}.json`)

    await fs.copy(configPath, backupPath)
    return backupPath
  }
  catch (error) {
    console.error('Failed to backup CoGem MCP config:', error)
    return null
  }
}

/**
 * Diagnose MCP configuration issues
 * @returns Array of diagnostic messages
 */
export async function diagnoseMcpConfig(): Promise<string[]> {
  const issues: string[] = []
  const configPath = getCoGemConfigPath()

  // Check if config file exists
  if (!(await fs.pathExists(configPath))) {
    issues.push('❌ ~/.cogem/config.json does not exist')
    return issues
  }

  // Try to read and parse config
  const config = await readCoGemConfig()
  if (!config) {
    issues.push('❌ Failed to parse ~/.cogem/config.json')
    return issues
  }

  // Check if mcpServers exists
  if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
    issues.push('⚠️  No MCP servers configured')
    return issues
  }

  // Check Windows-specific issues
  if (isWindows()) {
    for (const [name, server] of Object.entries(config.mcpServers)) {
      if (server.command && ['npx', 'uvx', 'node'].includes(server.command)) {
        if (server.command !== 'cmd') {
          issues.push(`❌ ${name}: Command not properly wrapped for Windows (should use cmd /c)`)
        }
      }
    }
  }

  if (issues.length === 0) {
    issues.push('✅ MCP configuration looks good')
  }

  return issues
}
