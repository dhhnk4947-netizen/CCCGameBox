#!/bin/zsh
set -u
cd -- "$(dirname -- "$0")" || exit 1

printf '\n===========================================\n'
printf '    日语单词 + 例句 MP3 批量生成工具\n'
printf '===========================================\n'
if ! command -v python3 >/dev/null 2>&1; then
  echo '需要 Python 3。请先安装 Python 3，再运行本文件。'
  printf '按回车结束：'
  read -r ignored
  exit 2
fi

printf '\n请选择：\n'
printf '1）先生成前 9 条试听 MP3（高质量日语女声，需联网）\n'
printf '2）生成全部 MP3（高质量日语女声，需联网，默认）\n'
printf '3）生成全部 MP3（Mac 内置日语语音，离线）\n'
printf '4）核对已有 MP3 是否齐全\n'
printf '5）打包全部已完成的 MP3\n'
printf '请输入 1 / 2 / 3 / 4 / 5，直接回车选择 2：'
read -r choice
[ -z "$choice" ] && choice=2

case "$choice" in
  1|2)
    echo '\n语音服务：Microsoft Edge 神经网络日语语音（ja-JP-NanamiNeural）。'
    echo '首次运行需要联网通过 pip 安装 edge-tts，并联网合成语音。'
    if [ ! -x .venv/bin/python3 ]; then
      echo '创建隔离的 Python 环境...'
      python3 -m venv .venv || exit 2
    fi
    if ! .venv/bin/python3 -c 'import edge_tts' >/dev/null 2>&1; then
      .venv/bin/python3 -m pip install edge-tts || { echo '依赖安装失败，请检查网络。'; exit 2; }
    fi
    if [ "$choice" = 1 ]; then
      .venv/bin/python3 generate_japanese_mp3.py --engine edge --limit 9
    else
      .venv/bin/python3 generate_japanese_mp3.py --engine edge
    fi
    status=$?
    ;;
  3)
    echo '\n离线语音将调用 Mac 系统日语语音和 ffmpeg。'
    python3 generate_japanese_mp3.py --engine mac
    status=$?
    ;;
  4)
    python3 generate_japanese_mp3.py --verify
    status=$?
    ;;
  5)
    python3 generate_japanese_mp3.py --zip-only
    status=$?
    ;;
  *)
    echo '无效选项。'
    status=2
    ;;
esac

printf '\n执行结束，状态码：%s\n' "$status"
printf '音频目录：%s/MP3\n' "$PWD"
printf '完成后总 ZIP：%s/JPS_Japanese_MP3_All.zip\n' "$PWD"
printf '\n按回车关闭窗口：'
read -r ignored
exit "$status"
