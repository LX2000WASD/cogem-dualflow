import ansis from 'ansis'
import inquirer from 'inquirer'
import { exec, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import fs from 'fs-extra'
import { configMcp } from './config-mcp'
import { i18n } from '../i18n'
import { uninstallWorkflows } from '../utils/installer'
import { init } from './init'
import { update } from './update'
import { isWindows } from '../utils/platform'

const execAsync = promisify(exec)

export async function showMainMenu(): Promise<void> {
  while (true) {
    console.log()
    console.log(ansis.cyan.bold(`  CoGem - Codex + Gemini`))
    console.log(ansis.gray('  Multi-Model Collaboration System'))
    console.log()

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: i18n.t('menu:title'),
      choices: [
        { name: `${ansis.green('➜')} ${i18n.t('menu:options.init')}`, value: 'init' },
        { name: `${ansis.blue('➜')} ${i18n.t('menu:options.update')}`, value: 'update' },
        { name: `${ansis.cyan('⚙')} 配置 MCP`, value: 'config-mcp' },
        { name: `${ansis.magenta('🎭')} 配置输出风格`, value: 'config-style' },
        { name: `${ansis.yellow('🔧')} 实用工具`, value: 'tools' },
        { name: `${ansis.magenta('➜')} ${i18n.t('menu:options.uninstall')}`, value: 'uninstall' },
        { name: `${ansis.yellow('?')} ${i18n.t('menu:options.help')}`, value: 'help' },
        new inquirer.Separator(),
        { name: `${ansis.red('✕')} ${i18n.t('menu:options.exit')}`, value: 'exit' },
      ],
    }])

    switch (action) {
      case 'init':
        await init()
        break
      case 'update':
        await update()
        break
      case 'config-mcp':
        await configMcp()
        break
      case 'config-style':
        await configOutputStyle()
        break
      case 'tools':
        await handleTools()
        break
      case 'uninstall':
        await uninstall()
        break
      case 'help':
        showHelp()
        break
      case 'exit':
        console.log(ansis.gray('再见！'))
        return // 退出循环和函数
    }

    // 操作完成后暂停，让用户看到结果
    console.log()
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: ansis.gray('按 Enter 返回主菜单...'),
    }])
  }
}

function showHelp(): void {
  console.log()
  console.log(ansis.cyan.bold(i18n.t('menu:help.title')))
  console.log()

  // Development Workflows
  console.log(ansis.yellow.bold('  开发工作流:'))
  console.log(`  ${ansis.green('/cogem:workflow')}    完整6阶段开发工作流`)
  console.log(`  ${ansis.green('/cogem:plan')}        多模型协作规划（Phase 1-2）`)
  console.log(`  ${ansis.green('/cogem:execute')}     多模型协作执行（Phase 3-5）`)
  console.log(`  ${ansis.green('/cogem:frontend')}    ${i18n.t('menu:help.descriptions.frontend')}`)
  console.log(`  ${ansis.green('/cogem:backend')}     ${i18n.t('menu:help.descriptions.backend')}`)
  console.log(`  ${ansis.green('/cogem:feat')}        智能功能开发`)
  console.log(`  ${ansis.green('/cogem:analyze')}     ${i18n.t('menu:help.descriptions.analyze')}`)
  console.log(`  ${ansis.green('/cogem:debug')}       问题诊断 + 修复`)
  console.log(`  ${ansis.green('/cogem:optimize')}    性能优化`)
  console.log(`  ${ansis.green('/cogem:test')}        测试生成`)
  console.log(`  ${ansis.green('/cogem:review')}      ${i18n.t('menu:help.descriptions.review')}`)
  console.log()

  // OpenSpec Workflows
  console.log(ansis.yellow.bold('  OpenSpec 规范驱动:'))
  console.log(`  ${ansis.green('/cogem:spec-init')}      初始化 OpenSpec 环境`)
  console.log(`  ${ansis.green('/cogem:spec-research')} 需求研究 → 约束集`)
  console.log(`  ${ansis.green('/cogem:spec-plan')}     多模型分析 → 零决策计划`)
  console.log(`  ${ansis.green('/cogem:spec-impl')}     规范驱动实现`)
  console.log(`  ${ansis.green('/cogem:spec-review')}   归档前双模型审查`)
  console.log()

  // Git Tools
  console.log(ansis.yellow.bold('  Git 工具:'))
  console.log(`  ${ansis.green('/cogem:commit')}      ${i18n.t('menu:help.descriptions.commit')}`)
  console.log(`  ${ansis.green('/cogem:rollback')}    ${i18n.t('menu:help.descriptions.rollback')}`)
  console.log(`  ${ansis.green('/cogem:clean-branches')} 清理已合并分支`)
  console.log(`  ${ansis.green('/cogem:worktree')}    Git Worktree 管理`)
  console.log()

  // Project Init
  console.log(ansis.yellow.bold('  项目管理:'))
  console.log(`  ${ansis.green('/cogem:init')}        初始化项目 AGENTS.md`)
  console.log()

  console.log(ansis.gray(i18n.t('menu:help.hint')))
  console.log()
}

// ============ 配置输出风格 ============

// 风格来源：
// - abyss-cultivator: https://github.com/telagod/code-abyss
// - engineer-professional, nekomata-engineer, laowang-engineer, ojousama-engineer: https://github.com/UfoMiao/zcf
const OUTPUT_STYLES = [
  { id: 'default', name: '默认', desc: 'CoGem 原生风格' },
  { id: 'engineer-professional', name: '专业工程师', desc: '简洁专业的技术风格' },
  { id: 'nekomata-engineer', name: '猫娘工程师', desc: '可爱猫娘语气喵~' },
  { id: 'laowang-engineer', name: '老王工程师', desc: '接地气的老王风格' },
  { id: 'ojousama-engineer', name: '大小姐工程师', desc: '优雅大小姐语气' },
  { id: 'abyss-cultivator', name: '邪修风格', desc: '宿命深渊·道语标签' },
]

async function configOutputStyle(): Promise<void> {
  console.log()
  console.log(ansis.cyan.bold('  配置输出风格'))
  console.log()

  const settingsPath = join(homedir(), '.cogem', 'settings.json')
  let settings: Record<string, any> = {}
  if (await fs.pathExists(settingsPath)) {
    settings = await fs.readJson(settingsPath)
  }

  const currentStyle = settings.outputStyle || 'default'
  console.log(ansis.gray(`  当前风格: ${currentStyle}`))
  console.log()

  const { style } = await inquirer.prompt([{
    type: 'list',
    name: 'style',
    message: '选择输出风格',
    choices: OUTPUT_STYLES.map(s => ({
      name: `${s.name} ${ansis.gray(`- ${s.desc}`)}`,
      value: s.id,
    })),
    default: currentStyle,
  }])

  if (style === currentStyle) {
    console.log(ansis.gray('风格未变更'))
    return
  }

  // 如果选择自定义风格，需要复制文件
  if (style !== 'default') {
    const outputStylesDir = join(homedir(), '.cogem', 'output-styles')
    await fs.ensureDir(outputStylesDir)

    // 从模板复制风格文件
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    // 从 dist/shared 或 src/commands 回到包根目录
    let pkgRoot = dirname(dirname(__dirname))
    if (!await fs.pathExists(join(pkgRoot, 'templates'))) {
      pkgRoot = dirname(pkgRoot) // 再上一级
    }
    const templatePath = join(pkgRoot, 'templates', 'output-styles', `${style}.md`)
    const destPath = join(outputStylesDir, `${style}.md`)

    if (await fs.pathExists(templatePath)) {
      await fs.copy(templatePath, destPath)
      console.log(ansis.green(`✓ 已安装风格文件: ${style}.md`))
    }
  }

  // 更新 settings.json
  if (style === 'default') {
    delete settings.outputStyle
  }
  else {
    settings.outputStyle = style
  }

  await fs.writeJson(settingsPath, settings, { spaces: 2 })

  console.log()
  console.log(ansis.green(`✓ 输出风格已设置为: ${style}`))
  console.log(ansis.gray('  重启 CoGem CLI 使配置生效'))
}

/**
 * Check if CoGem is installed globally via npm
 */
async function checkIfGlobalInstall(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('npm list -g cogem-dualflow --depth=0', { timeout: 5000 })
    return stdout.includes('cogem-dualflow@')
  }
  catch {
    return false
  }
}

async function uninstall(): Promise<void> {
  console.log()

  // Check if installed globally via npm
  const isGlobalInstall = await checkIfGlobalInstall()

  if (isGlobalInstall) {
    console.log(ansis.yellow('⚠️  检测到你是通过 npm 全局安装的'))
    console.log()
    console.log('完整卸载需要两步：')
    console.log(`  ${ansis.cyan('1. 移除工作流文件')} (即将执行)`)
    console.log(`  ${ansis.cyan('2. 卸载 npm 全局包')} (需要手动执行)`)
    console.log()
  }

  // Confirm uninstall
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: isGlobalInstall ? '继续卸载工作流文件？' : i18n.t('menu:uninstall.confirm'),
    default: false,
  }])

  if (!confirm) {
    console.log(ansis.gray(i18n.t('menu:uninstall.cancelled')))
    return
  }

  console.log()
  console.log(ansis.yellow(i18n.t('menu:uninstall.uninstalling')))

  // Uninstall workflows
  const installDir = join(homedir(), '.cogem')
  const result = await uninstallWorkflows(installDir)

  if (result.success) {
    console.log(ansis.green('✅ 工作流文件已移除'))

    if (result.removedCommands.length > 0) {
      console.log()
      console.log(ansis.cyan(i18n.t('menu:uninstall.removedCommands')))
      for (const cmd of result.removedCommands) {
        console.log(`  ${ansis.gray('•')} /cogem:${cmd}`)
      }
    }

    if (result.removedAgents.length > 0) {
      console.log()
      console.log(ansis.cyan('已移除子智能体:'))
      for (const agent of result.removedAgents) {
        console.log(`  ${ansis.gray('•')} ${agent}`)
      }
    }

    if (result.removedSkills.length > 0) {
      console.log()
      console.log(ansis.cyan('已移除 Skills:'))
      console.log(`  ${ansis.gray('•')} multi-model-collaboration`)
    }

    if (result.removedBin) {
      console.log()
      console.log(ansis.cyan('已移除二进制文件:'))
      console.log(`  ${ansis.gray('•')} codeagent-wrapper`)
    }

    // If globally installed, show instructions to uninstall npm package
    if (isGlobalInstall) {
      console.log()
      console.log(ansis.yellow.bold('🔸 最后一步：卸载 npm 全局包'))
      console.log()
      console.log('请在新的终端窗口中运行：')
      console.log()
      console.log(ansis.cyan.bold('  npm uninstall -g cogem-dualflow'))
      console.log()
      console.log(ansis.gray('(完成后 cogem 命令将彻底移除)'))
    }
  }
  else {
    console.log(ansis.red(i18n.t('menu:uninstall.failed')))
    for (const error of result.errors) {
      console.log(ansis.red(`  ${error}`))
    }
  }

  console.log()
}

// ============ 实用工具 ============

async function handleTools(): Promise<void> {
  console.log()

  const { tool } = await inquirer.prompt([{
    type: 'list',
    name: 'tool',
    message: '选择工具',
    choices: [
      { name: `${ansis.green('📊')} ccusage ${ansis.gray('- 命令行用量分析')}`, value: 'ccusage' },
      { name: `${ansis.blue('📟')} CCometixLine ${ansis.gray('- 状态栏工具（Git + 用量）')}`, value: 'ccline' },
      new inquirer.Separator(),
      { name: `${ansis.gray('返回')}`, value: 'cancel' },
    ],
  }])

  if (tool === 'cancel')
    return

  if (tool === 'ccusage') {
    await runCcusage()
  }
  else if (tool === 'ccline') {
    await handleCCometixLine()
  }
}

async function runCcusage(): Promise<void> {
  console.log()
  console.log(ansis.cyan('📊 运行 ccusage...'))
  console.log(ansis.gray('$ npx ccusage@latest'))
  console.log()

  return new Promise((resolve) => {
    const child = spawn('npx', ['ccusage@latest'], {
      stdio: 'inherit',
      shell: true,
    })
    child.on('close', () => resolve())
    child.on('error', () => resolve())
  })
}

async function handleCCometixLine(): Promise<void> {
  console.log()

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'CCometixLine 操作',
    choices: [
      { name: `${ansis.green('➜')} 安装/更新`, value: 'install' },
      { name: `${ansis.red('✕')} 卸载`, value: 'uninstall' },
      new inquirer.Separator(),
      { name: `${ansis.gray('返回')}`, value: 'cancel' },
    ],
  }])

  if (action === 'cancel')
    return

  if (action === 'install') {
    await installCCometixLine()
  }
  else if (action === 'uninstall') {
    await uninstallCCometixLine()
  }
}

async function installCCometixLine(): Promise<void> {
  console.log()
  console.log(ansis.yellow('⏳ 正在安装 CCometixLine...'))

  try {
    // 1. Install npm package globally
    const installCmd = isWindows() ? 'npm install -g @cometix/ccline' : 'sudo npm install -g @cometix/ccline'
    await execAsync(installCmd, { timeout: 120000 })
    console.log(ansis.green('✓ @cometix/ccline 安装成功'))

    // 2. Configure CoGem statusLine
    const settingsPath = join(homedir(), '.cogem', 'settings.json')
    let settings: Record<string, any> = {}

    if (await fs.pathExists(settingsPath)) {
      settings = await fs.readJson(settingsPath)
    }

    settings.statusLine = {
      type: 'command',
      command: isWindows()
        ? '%USERPROFILE%\\.cogem\\ccline\\ccline.exe'
        : '~/.cogem/ccline/ccline',
      padding: 0,
    }

    await fs.ensureDir(join(homedir(), '.cogem'))
    await fs.writeJson(settingsPath, settings, { spaces: 2 })
    console.log(ansis.green('✓ CoGem statusLine 已配置'))

    console.log()
    console.log(ansis.cyan('💡 提示：重启 CoGem CLI 使配置生效'))
  }
  catch (error) {
    console.log(ansis.red(`✗ 安装失败: ${error}`))
  }
}

async function uninstallCCometixLine(): Promise<void> {
  console.log()
  console.log(ansis.yellow('⏳ 正在卸载 CCometixLine...'))

  try {
    // 1. Remove statusLine config
    const settingsPath = join(homedir(), '.cogem', 'settings.json')
    if (await fs.pathExists(settingsPath)) {
      const settings = await fs.readJson(settingsPath)
      delete settings.statusLine
      await fs.writeJson(settingsPath, settings, { spaces: 2 })
      console.log(ansis.green('✓ statusLine 配置已移除'))
    }

    // 2. Uninstall npm package
    const uninstallCmd = isWindows() ? 'npm uninstall -g @cometix/ccline' : 'sudo npm uninstall -g @cometix/ccline'
    await execAsync(uninstallCmd, { timeout: 60000 })
    console.log(ansis.green('✓ @cometix/ccline 已卸载'))
  }
  catch (error) {
    console.log(ansis.red(`✗ 卸载失败: ${error}`))
  }
}
