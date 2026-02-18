---
description: '初始化 OpenSpec (OPSX) 环境 + 验证多模型 MCP 工具'
---
<!-- CoGem:SPEC:INIT:START -->
**Core Philosophy**
- OPSX provides the specification framework; CoGem adds multi-model collaboration.
- This phase ensures all tools are ready before any development work begins.
- Fail fast: detect missing dependencies early rather than mid-workflow.

**Guardrails**
- Detect OS (Linux/macOS/Windows) and adapt commands accordingly.
- Do not proceed to next step until current step completes successfully.
- Provide clear, actionable error messages when a step fails.
- Respect user's existing configurations; avoid overwriting without confirmation.

**Steps**
1. **Detect Operating System**
   - Identify OS using `uname -s` (Unix) or environment variables (Windows).
   - Inform user which OS was detected.

2. **Check and Install OpenSpec (OPSX)**
   - **IMPORTANT**: OpenSpec CLI command is `openspec`, NOT `opsx`
   - Verify if OpenSpec is available:
     ```bash
     npx @fission-ai/openspec --version
     ```
   - If not found, install globally:
     ```bash
     npm install -g @fission-ai/openspec@latest
     ```
   - After installation, verify again:
     ```bash
     openspec --version
     ```
   - If `openspec` command not found after global install, use `npx`:
     ```bash
     npx @fission-ai/openspec --version
     ```
   - **Note**: Always use `openspec` (not `opsx`) for CLI commands.

3. **Initialize OPSX for Current Project**
   - Check if already initialized:
     ```bash
     ls -la openspec/ .cogem/skills/openspec-* 2>/dev/null || echo "Not initialized"
     ```
   - If not initialized, run:
     ```bash
     npx @fission-ai/openspec init --tools codex,gemini
     ```
   - Verify initialization:
     - Check `openspec/` directory exists
     - Check `.cogem/skills/` contains `openspec-*` skills
     - Check `.cogem/commands/opsx/` contains OPSX commands
   - Report any errors with remediation steps.

4. **Validate Multi-Model MCP Tools**
   - Check `codeagent-wrapper` availability: `~/.cogem/bin/codeagent-wrapper --version`
   - **工作目录**：`{{WORKDIR}}` 替换为目标工作目录的绝对路径。如果用户通过 `/add-dir` 添加了多个工作区，先确定任务相关的工作区。
   - Test Codex backend:
     ```bash
     ~/.cogem/bin/codeagent-wrapper --backend codex - "{{WORKDIR}}" <<< "echo test"
     ```
   - Test Gemini backend:
     ```bash
     ~/.cogem/bin/codeagent-wrapper --backend gemini --gemini-model gemini-3-pro-preview - "{{WORKDIR}}" <<< "echo test"
     ```
   - For each unavailable tool, display warning with installation instructions.

5. **Validate Context Retrieval MCP** (Optional)
   - **Check Active Tool**: Is `{{MCP_SEARCH_TOOL}}` available in the current session?
   - **Check Configuration**: If tool is missing, check `~/.cogem/config.json` for `"ace-tool"` or `"ace-tool-rs"` in `mcpServers`.
   - **Diagnosis**:
     - If tool available: Mark as "✓ Active".
     - If config exists but tool missing: Mark as "⚠️ Configured but inactive (Try restarting CoGem CLI)".
     - If neither: Mark as "○ Not installed (Optional)".
   - If not installed/configured, suggest: "Run `npx cogem-dualflow` and select ace-tool MCP option."

6. **Summary Report**
   Display status table:
   ```
   Component                 Status
   ─────────────────────────────────
   OpenSpec (OPSX) CLI       ✓/✗
   Project initialized       ✓/✗
   OPSX Skills               ✓/✗
   codeagent-wrapper         ✓/✗
   Codex backend             ✓/✗
   Gemini backend            ✓/✗
   ace-tool MCP              ✓/✗ (optional)
   ```

   **Next Steps (Use CoGem Encapsulated Commands)**
   1. Start Research: `/cogem:spec-research "description"`
   2. Plan & Design: `/cogem:spec-plan`
   3. Implement: `/cogem:spec-impl` (Includes auto-review & archive)

   **Standalone Tools (Available Anytime)**
   - Code Review: `/cogem:spec-review` (Independent dual-model review)

**Reference**
- OpenSpec (OPSX) CLI: `npx @fission-ai/openspec --help`
- OPSX Commands: `/opsx:new`, `/opsx:continue`, `/opsx:apply`, etc.
- CoGem Workflow: `npx cogem-dualflow`
- Codex/Gemini MCP: Bundled with codeagent-wrapper
- Node.js >= 18.x required for OpenSpec
<!-- CoGem:SPEC:INIT:END -->
