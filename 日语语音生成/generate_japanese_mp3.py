#!/usr/bin/env python3
# coding: utf-8
"""Generate Japanese MP3s from the audited file list. Python >= 3.9."""
from __future__ import annotations

import argparse
import asyncio
import csv
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
MANIFEST = HERE / 'audio_manifest.csv'
DEST = HERE / 'MP3'
OUTZIP = HERE / 'JPS_Japanese_MP3_All.zip'
FAILED = HERE / '未完成音频清单.csv'
LOG = HERE / 'generation_log.csv'
FILE_RE = re.compile(r'^JPS\d{5}_\d+(?:_[12])?\.mp3$')
HEADERS = ['文件名', '课程', '类型', '日语原文', '实际朗读文本', '日语假名', '中文翻译', 'Excel来源位置', '备注']


def tasks_from_csv():
    if not MANIFEST.exists():
        raise RuntimeError(f'找不到清单：{MANIFEST}')
    tasks = []
    seen = set()
    with MANIFEST.open('r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        missing = [x for x in HEADERS if x not in (reader.fieldnames or [])]
        if missing:
            raise ValueError('清单缺少列：' + ','.join(missing))
        for line, item in enumerate(reader, 2):
            file = item['文件名'].strip()
            text = item['实际朗读文本'].strip()
            if not FILE_RE.fullmatch(file):
                raise ValueError(f'第 {line} 行文件名不符合命名规则：{file!r}')
            if file in seen:
                raise ValueError(f'文件名重复：{file}')
            if not text:
                raise ValueError(f'第 {line} 行没有朗读文本：{file}')
            if len(text) > 1000:
                raise ValueError(f'第 {line} 行朗读文本过长：{file}')
            seen.add(file)
            tasks.append(item)
    return tasks


def is_mp3(path: Path) -> bool:
    """Quick container/audio-header validation without external packages."""
    if not path.is_file() or path.stat().st_size < 1024:
        return False
    with path.open('rb') as f:
        header = f.read(8)
    return header.startswith(b'ID3') or (len(header) >= 2 and header[0] == 0xff and (header[1] & 0xe0) == 0xe0)


def write_csv(path: Path, fieldnames, rows):
    with path.open('w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for x in rows:
            writer.writerow(x)


def audit(tasks, quiet=False):
    good, pending = [], []
    for task in tasks:
        path = DEST / task['文件名']
        if is_mp3(path):
            good.append(task)
        else:
            pending.append(task)
    write_csv(FAILED, HEADERS, pending)
    if not quiet:
        print(f'音频核对：已生成 {len(good)} / {len(tasks)}；未生成或损坏 {len(pending)}。')
        print(f'未完成清单：{FAILED}')
    return good, pending


def write_log(file, state, note=''):
    is_new = not LOG.exists()
    with LOG.open('a', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        if is_new:
            w.writerow(['时间', '文件名', '结果', '详情'])
        w.writerow([datetime.now().isoformat(timespec='seconds'), file, state, note[:300]])


def make_zip(tasks):
    good, pending = audit(tasks, quiet=True)
    if pending:
        print(f'尚有 {len(pending)} 个 MP3 未完成，不会制作误标为完整的 ZIP。重新运行可断点续做。')
        return False
    print('全部 MP3 均通过文件头检查，开始打包。')
    tmp = OUTZIP.with_name(OUTZIP.name + '.tmp')
    if tmp.exists():
        tmp.unlink()
    try:
        with zipfile.ZipFile(tmp, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as z:
            for i, item in enumerate(tasks, 1):
                path = DEST / item['文件名']
                z.write(path, arcname=path.name)
                if i % 300 == 0:
                    print(f'已打包 {i} / {len(tasks)}', flush=True)
        with zipfile.ZipFile(tmp) as z:
            if z.testzip() is not None:
                raise RuntimeError('ZIP 校验未通过')
            if len(z.namelist()) != len(tasks):
                raise RuntimeError('ZIP 文件数不匹配')
        os.replace(tmp, OUTZIP)
        print('全部音频打包完成：', OUTZIP)
        return True
    except Exception:
        tmp.unlink(missing_ok=True)
        raise


async def make_edge_one(task, semaphore, rate_word, rate_sentence, voice, retries=4):
    import edge_tts
    dst = DEST / task['文件名']
    rate = rate_word if task['类型'] == '单词' else rate_sentence
    async with semaphore:
        for attempt in range(1, retries+1):
            tmp = dst.with_name(dst.name + '.download')
            try:
                tmp.unlink(missing_ok=True)
                audio = edge_tts.Communicate(task['实际朗读文本'], voice=voice, rate=rate)
                await audio.save(str(tmp))
                if not is_mp3(tmp):
                    raise RuntimeError('服务返回的音频文件不是有效 MP3 或内容为空')
                os.replace(tmp, dst)
                return (task, None)
            except Exception as exc:
                tmp.unlink(missing_ok=True)
                note = str(exc)
                if attempt >= retries:
                    return (task, f'{type(exc).__name__}: {note}')
                await asyncio.sleep(min(2 ** attempt, 10))
    return task, 'unknown error'


async def run_edge(tasks, args):
    try:
        import edge_tts
    except ImportError:
        print('未找到 edge-tts。请先运行：python3 -m pip install edge-tts')
        return 2
    chosen = [t for t in tasks if not is_mp3(DEST / t['文件名']) or args.force]
    if args.limit:
        chosen = chosen[:args.limit]
    print(f'使用 Edge 神经网络日语语音：{args.voice or "ja-JP-NanamiNeural"}，待生成 {len(chosen)} 个。')
    print('例句保留日语标点停顿；单词优先使用表中假名。已有有效 MP3 默认跳过。')
    if not chosen:
        return 0
    semaphore = asyncio.Semaphore(max(1, args.workers))
    jobs = [asyncio.create_task(make_edge_one(t, semaphore, args.word_rate, args.sentence_rate,
                                               args.voice or 'ja-JP-NanamiNeural')) for t in chosen]
    done = 0
    failed = 0
    for job in asyncio.as_completed(jobs):
        task, error = await job
        done += 1
        if error:
            failed += 1
            write_log(task['文件名'], 'FAIL', error)
            print('失败', task['文件名'], error[:180], flush=True)
        else:
            write_log(task['文件名'], 'OK')
        if done % 25 == 0 or done == len(chosen):
            print(f'当前运行进度：{done}/{len(chosen)}，失败 {failed}', flush=True)
    return 1 if failed else 0


def detect_mac_voice(voice_arg):
    if platform.system() != 'Darwin':
        raise RuntimeError('离线 macOS 语音只支持 Mac；其他平台请选择 Edge 模式。')
    if not shutil.which('say'):
        raise RuntimeError('系统找不到 say 命令。')
    if voice_arg:
        return voice_arg
    result = subprocess.run(['say', '-v', '?'], check=True, capture_output=True, text=True)
    voices = []
    for line in result.stdout.splitlines():
        before = line.split('#', 1)[0].rstrip()
        m = re.match(r'^(.*?)\s+ja_JP\s*$', before)
        if m:
            voices.append(m.group(1).strip())
    if not voices:
        raise RuntimeError('Mac 尚未安装日语语音。请在系统设置 > 辅助功能 > 朗读内容/语音 > 系统语音 中下载日语语音。')
    return next((v for v in voices if v.lower() == 'kyoko'), voices[0])


def make_mac_one(task, voice, ffmpeg, rate_word, rate_sentence):
    dst = DEST / task['文件名']
    rate = rate_word if task['类型'] == '单词' else rate_sentence
    with tempfile.TemporaryDirectory(prefix='jps_', dir=str(DEST)) as temp:
        p = Path(temp)
        textfile = p / 'text.txt'
        aiff = p / 'audio.aiff'
        mp3 = p / 'audio.mp3'
        textfile.write_text(task['实际朗读文本'], encoding='utf-8')
        subprocess.run(['say', '-v', voice, '-r', str(rate), '-f', str(textfile), '-o', str(aiff)], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(aiff),
                       '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-q:a', '2',
                       '-af', 'apad=pad_dur=0.20', str(mp3)], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        if not is_mp3(mp3):
            raise RuntimeError('转换后的 MP3 校验失败')
        os.replace(mp3, dst)


def run_mac(tasks, args):
    try:
        voice = detect_mac_voice(args.voice)
    except Exception as exc:
        print('离线模式无法启动：', exc)
        return 2
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        print('尚未安装 ffmpeg。可以通过 Homebrew 安装：brew install ffmpeg')
        return 2
    chosen = [t for t in tasks if not is_mp3(DEST / t['文件名']) or args.force]
    if args.limit:
        chosen = chosen[:args.limit]
    print(f'使用 macOS 本地日语语音：{voice}，待生成 {len(chosen)} 个。')
    fails = 0
    for i, task in enumerate(chosen, 1):
        try:
            make_mac_one(task, voice, ffmpeg, args.mac_word_rate, args.mac_sentence_rate)
            write_log(task['文件名'], 'OK')
        except Exception as exc:
            fails += 1
            write_log(task['文件名'], 'FAIL', str(exc))
            print('失败', task['文件名'], type(exc).__name__, str(exc)[:180])
        if i % 25 == 0 or i == len(chosen):
            print(f'当前运行进度：{i}/{len(chosen)}，失败 {fails}', flush=True)
    return 1 if fails else 0


def main():
    parser = argparse.ArgumentParser(description='根据 Excel 导出的清单生成/核对/打包日语 MP3。')
    parser.add_argument('--engine', choices=['edge', 'mac'], default='edge', help='edge=自然神经网络语音；mac=本地日语语音')
    parser.add_argument('--voice', default='', help='edge 例如 ja-JP-NanamiNeural；mac 例如 Kyoko')
    parser.add_argument('--workers', type=int, default=3, help='Edge 同时生成的请求数（默认 3）')
    parser.add_argument('--word-rate', default='-18%', help='Edge 单词语速：默认 -18%%')
    parser.add_argument('--sentence-rate', default='-14%', help='Edge 例句语速：默认 -14%%')
    parser.add_argument('--mac-word-rate', type=int, default=145)
    parser.add_argument('--mac-sentence-rate', type=int, default=155)
    parser.add_argument('--limit', type=int, default=0, help='最多本次生成几条；0=全部')
    parser.add_argument('--force', action='store_true', help='覆盖有效的既有 MP3')
    parser.add_argument('--verify', action='store_true', help='仅核对已生成音频')
    parser.add_argument('--zip-only', action='store_true', help='仅核对并打包完整音频')
    parser.add_argument('--dry-run', action='store_true', help='只检查清单并预览最前面的任务')
    args = parser.parse_args()
    try:
        tasks = tasks_from_csv()
    except Exception as exc:
        print('清单校验失败：', exc)
        return 2
    DEST.mkdir(exist_ok=True)
    print(f'载入 {len(tasks)} 个 MP3 任务，编号无重复。')
    if args.dry_run:
        for task in tasks[:9]:
            print(task['文件名'], '/', task['类型'], ':', task['实际朗读文本'])
        return 0
    if args.verify:
        good, pending = audit(tasks)
        return 0 if not pending else 1
    if args.zip_only:
        return 0 if make_zip(tasks) else 1
    ret = asyncio.run(run_edge(tasks, args)) if args.engine == 'edge' else run_mac(tasks, args)
    good, pending = audit(tasks)
    if not pending:
        make_zip(tasks)
    else:
        print('可重新运行同一命令，从未完成的编号继续。')
    return ret


if __name__ == '__main__':
    sys.exit(main())
