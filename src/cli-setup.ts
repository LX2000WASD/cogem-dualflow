import type { CAC } from 'cac'
import type { CliOptions } from './types'
import ansis from 'ansis'
import { version } from '../package.json'
import { configMcp } from './commands/config-mcp'
import { diagnoseMcp, fixMcp } from './commands/diagnose-mcp'
import { init } from './commands/init'
import { showMainMenu } from './commands/menu'
import { i18n, initI18n } from './i18n'
import { readWorkflowConfig } from './utils/config'
import { installMcpServer } from './utils/installer'

function customizeHelp(sections: any[]): any[] {
  sections.unshift({
    title: '',
    body: ansis.cyan.bold(`CoGem - Codex + Gemini v${version}`),
  })

  sections.push({
    title: ansis.yellow(i18n.t('cli:help.commands')),
    body: [
      `  ${ansis.cyan('cogem')}              ${i18n.t('cli:help.commandDescriptions.showMenu')}`,
      `  ${ansis.cyan('cogem init')} | ${ansis.cyan('i')}     ${i18n.t('cli:help.commandDescriptions.initConfig')}`,
      `  ${ansis.cyan('cogem config mcp')}   配置 MCP（交互式）`,
      `  ${ansis.cyan('cogem setup-github-mcp')} 快速配置 GitHub MCP`,
      `  ${ansis.cyan('cogem diagnose-mcp')} 诊断 MCP 配置问题`,
      `  ${ansis.cyan('cogem fix-mcp')}      修复 Windows MCP 配置`,
      '',
      ansis.gray(`  ${i18n.t('cli:help.shortcuts')}`),
      `  ${ansis.cyan('cogem i')}            ${i18n.t('cli:help.shortcutDescriptions.quickInit')}`,
    ].join('\n'),
  })

  sections.push({
    title: ansis.yellow(i18n.t('cli:help.options')),
    body: [
      `  ${ansis.green('--lang, -l')} <lang>         ${i18n.t('cli:help.optionDescriptions.displayLanguage')} (zh-CN, en)`,
      `  ${ansis.green('--force, -f')}               ${i18n.t('cli:help.optionDescriptions.forceOverwrite')}`,
      `  ${ansis.green('--help, -h')}                ${i18n.t('cli:help.optionDescriptions.displayHelp')}`,
      `  ${ansis.green('--version, -v')}             ${i18n.t('cli:help.optionDescriptions.displayVersion')}`,
      '',
      ansis.gray(`  ${i18n.t('cli:help.nonInteractiveMode')}`),
      `  ${ansis.green('--skip-prompt, -s')}         ${i18n.t('cli:help.optionDescriptions.skipAllPrompts')}`,
      `  ${ansis.green('--frontend, -F')} <models>   ${i18n.t('cli:help.optionDescriptions.frontendModels')}`,
      `  ${ansis.green('--backend, -B')} <models>    ${i18n.t('cli:help.optionDescriptions.backendModels')}`,
      `  ${ansis.green('--mode, -m')} <mode>         ${i18n.t('cli:help.optionDescriptions.collaborationMode')}`,
      `  ${ansis.green('--workflows, -w')} <list>    ${i18n.t('cli:help.optionDescriptions.workflows')}`,
      `  ${ansis.green('--install-dir, -d')} <path>  ${i18n.t('cli:help.optionDescriptions.installDir')}`,
    ].join('\n'),
  })

  sections.push({
    title: ansis.yellow(i18n.t('cli:help.examples')),
    body: [
      ansis.gray(`  # ${i18n.t('cli:help.exampleDescriptions.showInteractiveMenu')}`),
      `  ${ansis.cyan('npx cogem-dualflow')}`,
      '',
      ansis.gray(`  # ${i18n.t('cli:help.exampleDescriptions.runFullInitialization')}`),
      `  ${ansis.cyan('npx cogem-dualflow init')}`,
      `  ${ansis.cyan('npx cogem-dualflow i')}`,
      '',
      ansis.gray(`  # ${i18n.t('cli:help.exampleDescriptions.customModels')}`),
      `  ${ansis.cyan('npx cogem-dualflow i --frontend gemini,codex --backend codex,gemini')}`,
      '',
      ansis.gray(`  # ${i18n.t('cli:help.exampleDescriptions.parallelMode')}`),
      `  ${ansis.cyan('npx cogem-dualflow i --mode parallel')}`,
      '',
    ].join('\n'),
  })

  return sections
}

export async function setupCommands(cli: CAC): Promise<void> {
  try {
    const config = await readWorkflowConfig()
    const defaultLang = config?.general?.language || 'zh-CN'
    await initI18n(defaultLang)
  }
  catch {
    await initI18n('zh-CN')
  }

  // Default command - show menu
  cli
    .command('', '显示交互式菜单（默认）')
    .option('--lang, -l <lang>', '显示语言 (zh-CN, en)')
    .action(async (options: CliOptions) => {
      if (options.lang) {
        await initI18n(options.lang)
      }
      await showMainMenu()
    })

  // Init command
  cli
    .command('init', '初始化 CoGem 协作系统')
    .alias('i')
    .option('--lang, -l <lang>', '显示语言 (zh-CN, en)')
    .option('--force, -f', '强制覆盖现有配置')
    .option('--skip-prompt, -s', '跳过所有交互式提示（非交互模式）')
    .option('--skip-mcp', '跳过 MCP 配置（更新时使用）')
    .option('--frontend, -F <models>', '前端模型（逗号分隔: gemini,codex）')
    .option('--backend, -B <models>', '后端模型（逗号分隔: codex,gemini）')
    .option('--mode, -m <mode>', '协作模式 (parallel, smart, sequential)')
    .option('--workflows, -w <workflows>', '要安装的工作流（逗号分隔或 "all"）')
    .option('--install-dir, -d <path>', '安装目录（默认: ~/.cogem）')
    .action(async (options: CliOptions) => {
      if (options.lang) {
        await initI18n(options.lang)
      }
      await init(options)
    })

  // Diagnose MCP command
  cli
    .command('diagnose-mcp', '诊断 MCP 配置问题')
    .action(async () => {
      await diagnoseMcp()
    })

  // Fix MCP command (Windows only)
  cli
    .command('fix-mcp', '修复 Windows MCP 配置问题')
    .action(async () => {
      await fixMcp()
    })

  // Config MCP command
  cli
    .command('config <subcommand>', '配置 CoGem 设置')
    .action(async (subcommand: string) => {
      if (subcommand === 'mcp') {
        await configMcp()
      }
      else {
        console.log(ansis.red(`未知子命令: ${subcommand}`))
        console.log(ansis.gray('可用子命令: mcp'))
      }
    })

  // Quick setup GitHub MCP command
  cli
    .command('setup-github-mcp', '快速配置 GitHub MCP（非交互）')
    .option('--token <token>', 'GitHub Personal Access Token')
    .action(async (options: { token?: string }) => {
      const token = options.token || process.env.GITHUB_PERSONAL_ACCESS_TOKEN

      if (!token?.trim()) {
        console.log(ansis.red('✗ 未提供 GitHub Token'))
        console.log(ansis.gray('  请使用 --token 或设置环境变量 GITHUB_PERSONAL_ACCESS_TOKEN'))
        console.log(ansis.gray('  Token 页面: https://github.com/settings/personal-access-tokens/new'))
        return
      }

      console.log(ansis.yellow('⏳ 正在安装 GitHub MCP...'))
      const result = await installMcpServer(
        'github',
        'npx',
        ['-y', '@modelcontextprotocol/server-github'],
        { GITHUB_PERSONAL_ACCESS_TOKEN: token.trim() },
      )

      if (result.success) {
        console.log(ansis.green('✓ GitHub MCP 配置成功'))
        console.log(ansis.gray('  重启 CoGem CLI 使配置生效'))
      }
      else {
        console.log(ansis.red(`✗ GitHub MCP 配置失败: ${result.message}`))
      }
    })

  cli.help(sections => customizeHelp(sections))
  cli.version(version)
}
