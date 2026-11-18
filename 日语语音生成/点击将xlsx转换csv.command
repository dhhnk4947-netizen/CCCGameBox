#!/bin/bash
# macOS 双击运行：首次自动创建 .venv 并安装 openpyxl，之后复用环境。
# 启动文件版本：2.1

set -u

# 双击从 Finder 打开时，终端当前目录通常是用户主目录；始终切到脚本所在目录。
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)" || exit 1
cd "$SCRIPT_DIR" || exit 1

pause_on_exit() {
    if [ -t 0 ]; then
        printf '\n按回车键关闭终端窗口...'
        IFS= read -r _ || true
    fi
}
trap pause_on_exit EXIT

# Finder 启动的 PATH 可能与交互式终端不同，兼容 Homebrew 安装的 Python。
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"

printf '\n===========================================\n'
printf '  JPSDirectory -> audio_manifest.csv\n'
printf '  自动安装依赖版 v2.1\n'
printf '===========================================\n'
printf '当前目录：%s\n\n' "$SCRIPT_DIR"

if [ ! -f 'JPSDirectory_to_audio_manifest.py' ]; then
    printf '错误：缺少 JPSDirectory_to_audio_manifest.py。\n请把 Python 脚本和本 .command 放在同一文件夹。\n' >&2
    exit 1
fi

# 优先读取标准文件名，也兼容下载时的 JPSDirectory(3).xlsx。
if [ -f 'JPSDirectory.xlsx' ]; then
    INPUT_FILE='JPSDirectory.xlsx'
else
    shopt -s nullglob
    candidates=(JPSDirectory*.xlsx)
    shopt -u nullglob
    if [ "${#candidates[@]}" -eq 0 ]; then
        printf '错误：找不到 JPSDirectory.xlsx。\n' >&2
        exit 1
    elif [ "${#candidates[@]}" -gt 1 ]; then
        printf '错误：发现多个 JPSDirectory*.xlsx。请只保留一个或重命名为 JPSDirectory.xlsx：\n' >&2
        printf '  %s\n' "${candidates[@]}" >&2
        exit 1
    fi
    INPUT_FILE="${candidates[0]}"
fi

if ! command -v python3 >/dev/null 2>&1; then
    printf '错误：没有找到 Python 3。请先安装 Python 3（建议 3.9 或更新版本）。\n' >&2
    exit 2
fi

if ! python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' 2>/dev/null; then
    printf '错误：Python 版本过低或无法启动。需要 Python 3.9 或更新版本。\n' >&2
    python3 --version 2>&1 || true
    exit 2
fi

VENV_DIR="$SCRIPT_DIR/.venv"
VENV_PYTHON="$VENV_DIR/bin/python3"

if [ ! -x "$VENV_PYTHON" ]; then
    printf '[1/3] 首次运行，正在创建隔离的 Python 环境 .venv ...\n'
    if ! python3 -m venv "$VENV_DIR"; then
        printf '\n错误：无法创建虚拟环境。请确认 Python 3 安装完整，并检查目录写入权限。\n' >&2
        exit 2
    fi
else
    printf '[1/3] 已找到 .venv，继续使用现有环境。\n'
fi

# .venv 可能由另一工具创建；不要假定其中已安装 openpyxl。
if ! "$VENV_PYTHON" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1; then
    printf '错误：.venv 的 Python 版本过低或环境已经损坏。\n请备份后删除当前文件夹中的 .venv，再双击本文件重建。\n' >&2
    exit 2
fi

if "$VENV_PYTHON" -c 'import openpyxl' >/dev/null 2>&1; then
    printf '[2/3] openpyxl 已安装，跳过安装。\n'
else
    printf '[2/3] 检测到缺少 openpyxl，正在自动安装（首次运行需要联网）...\n'

    if ! "$VENV_PYTHON" -m pip --version >/dev/null 2>&1; then
        printf 'pip 不可用，尝试自动初始化 pip ...\n'
        if ! "$VENV_PYTHON" -m ensurepip --upgrade; then
            printf '错误：无法初始化 pip。请重新安装完整版 Python 3。\n' >&2
            exit 2
        fi
    fi

    if ! "$VENV_PYTHON" -m pip install --disable-pip-version-check openpyxl; then
        printf '\n错误：openpyxl 自动安装失败，请确认 Mac 可以访问互联网后再试。\n' >&2
        exit 2
    fi

    if ! "$VENV_PYTHON" -c 'import openpyxl' >/dev/null 2>&1; then
        printf '错误：pip 已结束，但仍无法导入 openpyxl，请检查上面的安装日志。\n' >&2
        exit 2
    fi
    printf '依赖安装成功。\n'
fi

printf '[3/3] 正在生成 audio_manifest.csv ...\n'
printf '输入：%s\n输出：%s/audio_manifest.csv\n\n' "$INPUT_FILE" "$SCRIPT_DIR"
"$VENV_PYTHON" 'JPSDirectory_to_audio_manifest.py' "$INPUT_FILE" -o 'audio_manifest.csv'
status=$?

if [ "$status" -eq 0 ]; then
    printf '\n转换完成：%s/audio_manifest.csv\n' "$SCRIPT_DIR"
else
    printf '\n转换失败（退出码：%s），请检查以上错误信息。\n' "$status" >&2
fi

exit "$status"
