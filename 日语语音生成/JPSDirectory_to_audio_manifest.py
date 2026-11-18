#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 JPSDirectory.xlsx 中 Enable 列出的课程导出为 audio_manifest.csv。

依赖：pip install openpyxl
运行：python JPSDirectory_to_audio_manifest.py JPSDirectory.xlsx -o audio_manifest.csv

规则：
* 仅处理 Enable 工作表 A 列列出的工作表（忽略表头），排除 JPSDirectory 与 Enable；
* 每个词条最多输出 3 条音频记录：单词、例句1、例句2；
* 输出文件名使用源数据的 jps_audio / sentence_audio / sentence_audio2，不重新编号；
* CSV 使用 UTF-8 with BOM，方便 Excel 直接打开。
"""

import argparse
import csv
import re
import sys
from collections import Counter
from pathlib import Path

from openpyxl import load_workbook


CSV_HEADERS = [
    "文件名", "课程", "类型", "日语原文", "实际朗读文本",
    "日语假名", "中文翻译", "Excel来源位置", "备注",
]
SKIP_SHEETS = {"JPSDirectory", "Enable"}

# 采用 Excel 第二行的字段码定位列：不会被重复的中文列名所影响。
REQUIRED_FIELDS = (
    "jps", "kana", "cns", "jps_audio",
    "sentence", "sentence_cn", "sentence_audio",
    "sentence2", "sentence_cn2", "sentence_audio2",
)



def clean(value):
    """把 Excel 单元格转为文本，空单元格输出空字符串。"""
    return "" if value is None else str(value).strip()


def prepare_word_reading(kana, japanese):
    """将词条假名转成适合 TTS 的文字；保留原文列不变。"""
    source = clean(kana) or clean(japanese)
    notes = []

    # 全角［］用于标注搭配或语法，如：だいじょうぶ［な］。
    without_fullwidth = re.sub(r"［[^］]*］", "", source)
    if without_fullwidth != source:
        notes.append("全角方括号是搭配用法说明；仅朗读括号外的主要词条")
    source = without_fullwidth

    # 特例：「こちらこそ[どうぞ]」的尾部是可选词，沿用示例 CSV 的读法。
    if source.endswith("[どうぞ]"):
        source = source[:-len("[どうぞ]")]
        notes.append("可选尾部「どうぞ」未朗读，只读主要词条，建议试听复核")

    # 半角 [] 中的可选文字默认读出，例如 [お]みやげ → おみやげ。
    without_halfwidth = re.sub(r"\[([^]]*)\]", r"\1", source)
    if without_halfwidth != source:
        notes.append("词条含可选内容；当前读出全部半角括号内文字，建议试听复核")
    source = without_halfwidth

    # 〜/~／～ 表示省略的词或占位符：首尾直接删除，句型中间转成停顿。
    placeholders = "〜～~"
    original_parts = [part for part in re.split(r"[〜～~]+", source)]
    middle_placeholder = any(
        left.strip("、，。 　") and right.strip("、，。 　")
        for left, right in zip(original_parts, original_parts[1:])
    )
    source = re.sub(r"[〜～~]+", "、", source)
    source = re.sub(r"、{2,}", "、", source).strip("、， 　")
    if middle_placeholder:
        notes.append("句型中间的占位符已改成停顿；建议试听复核")

    return source, "；".join(notes)


def prepare_sentence_reading(sentence):
    """示例中的 A：...／B：... 转为连续的自然朗读句。"""
    sentence = clean(sentence)
    processed = re.sub(r"(?:[／/]\s*)?[A-ZＡ-Ｚ]\s*[:：]\s*", "", sentence)
    if processed != sentence:
        return processed.strip(), "对话标签或分隔符已转换为停顿；请试听核对"
    return sentence, ""


def enabled_sheet_names(workbook):
    if "Enable" not in workbook.sheetnames:
        raise ValueError("Excel 中未找到 Enable 工作表")

    enable = workbook["Enable"]
    enable.reset_dimensions()  # 某些 Excel 的工作表维度元信息不准确
    found = []
    seen = set()
    for i, row in enumerate(enable.iter_rows(min_col=1, max_col=1, values_only=True), 1):
        name = clean(row[0])
        if i == 1 and name.lower() == "name":
            continue
        if not name or name in SKIP_SHEETS or name in seen:
            continue
        seen.add(name)
        if name not in workbook.sheetnames:
            print(f"[警告] Enable 标记了不存在的工作表：{name}，已跳过", file=sys.stderr)
            continue
        found.append(name)
    return found


def sheet_records(worksheet):
    sheet_name = worksheet.title
    worksheet.reset_dimensions()  # 避免虚假的 max_row 导致读取百万空白行
    row_iter = worksheet.iter_rows(min_row=1, max_col=11, values_only=True)
    try:
        next(row_iter)  # 中文字段名
        codes = next(row_iter)  # 字段码，如 jps:s, kana:s
    except StopIteration:
        print(f"[警告] {sheet_name} 不足两行，跳过", file=sys.stderr)
        return

    field_positions = {
        clean(value).split(":", 1)[0]: idx
        for idx, value in enumerate(codes)
        if clean(value)
    }
    missing = [key for key in REQUIRED_FIELDS if key not in field_positions]
    if missing:
        print(f"[警告] {sheet_name} 缺少字段 {', '.join(missing)}，跳过", file=sys.stderr)
        return

    consecutive_empty = 0
    for row_idx, row in enumerate(row_iter, start=3):
        def field(name):
            pos = field_positions[name]
            return clean(row[pos] if pos < len(row) else None)

        # 部分工作表预格式化了很多空行。连续 50 个无词条/音频 ID 的行即视为结束。
        if not any(field(name) for name in ("jps", "jps_audio", "sentence_audio", "sentence_audio2")):
            consecutive_empty += 1
            if consecutive_empty >= 50:
                break
            continue
        consecutive_empty = 0

        japanese = field("jps")
        kana = field("kana")
        translation = field("cns")
        word_id = field("jps_audio")
        if japanese and word_id:
            reading, note = prepare_word_reading(kana, japanese)
            yield [
                word_id.removesuffix(".mp3") + ".mp3", sheet_name, "单词",
                japanese, reading, kana, translation,
                f"{sheet_name}!B{row_idx}:E{row_idx}", note,
            ]

        for type_name, sentence_field, translation_field, audio_field, col in (
            ("例句1", "sentence", "sentence_cn", "sentence_audio", "F"),
            ("例句2", "sentence2", "sentence_cn2", "sentence_audio2", "I"),
        ):
            sentence = field(sentence_field)
            filename = field(audio_field)
            if sentence and filename:
                reading, note = prepare_sentence_reading(sentence)
                yield [
                    filename.removesuffix(".mp3") + ".mp3", sheet_name, type_name,
                    sentence, reading, "", field(translation_field),
                    f"{sheet_name}!{col}{row_idx}", note,
                ]


def convert(input_file: Path, output_file: Path):
    wb = load_workbook(input_file, read_only=True, data_only=True)
    try:
        enabled = enabled_sheet_names(wb)
        if not enabled:
            raise ValueError("Enable 中没有有效的课程工作表")
        output_file.parent.mkdir(parents=True, exist_ok=True)
        counters = Counter()
        with output_file.open("w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(CSV_HEADERS)
            for name in enabled:
                count = 0
                for record in sheet_records(wb[name]):
                    writer.writerow(record)
                    count += 1
                counters[name] = count
                print(f"{name}: {count} 条")
    finally:
        wb.close()
    print(f"\n导出成功：{output_file}（{len(counters)} 个课程，{sum(counters.values())} 条音频记录）")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input", nargs="?", default="JPSDirectory.xlsx", type=Path, help="源 XLSX（默认：JPSDirectory.xlsx）")
    parser.add_argument("-o", "--output", type=Path, default=Path("audio_manifest.csv"), help="输出 CSV（默认：audio_manifest.csv）")
    args = parser.parse_args()
    try:
        convert(args.input, args.output)
    except (OSError, ValueError) as exc:
        parser.exit(1, f"错误：{exc}\n")


if __name__ == "__main__":
    main()
