#!/usr/bin/env python3
"""
Third-pass: fix remaining mixed Russian/English strings in UI.
"""
import os

SRC_DIR = "/data/data/com.termux/files/home/anamnesis/frontend/src"

TRANSLATIONS = [
    # Sidebar
    ("Сводка", "Dashboard"),
    ("План", "Plan"),
    ("Приёмы", "Visits"),
    ("NIRZOR ИИ", "NIRZOR AI"),
    ("History ofменений", "History"),
    ("Mедицинский трекер", "Medical Tracker"),
    ("Медицинский трекер", "Medical Tracker"),
    ("Основное", "Main"),
    ("Картотека", "Records"),
    ("Инструменты", "Tools"),
    # PinScreen confirm button
    ("Confirmть", "Confirm"),
    # Plan
    ("All задачи выполнены!", "All tasks completed!"),
    ("No выполненных задач", "No completed tasks"),
    ("В ожидании", "Pending"),
    ("Совет", "Tip"),
    # Nirzor
    ("Аналof...", "Analyzing..."),
    ("Новый аналof", "New analysis"),
    # Vaccinations
    ("Delete фото?", "Delete photo?"),
    ("Delete фото", "Delete photo"),
    ("BeforeBeforeза", "Dose"),
    ("Beforeза", "Dose"),
    # Copy button
    ("Копировать", "Copy"),
    # ExpandableText
    ("Show полностью", "Show all"),
    # Sheet dialog
    ("Диалог", "Dialog"),
    # Lab expiry labels
    ("Просрочен на", "Expired by"),
    ("дн.", "days"),
    ("Осталось", "Left"),
    ("Годен ещё", "Valid for"),
    ("мес.", "months"),
    # Months in lab patterns (lowercase Russian abbrevs used as data - leave them, they're internal)
    # Upload document
    ("Upload документа", "Document upload"),
    ("Loading документа", "Uploading document"),
]


def main():
    total_files = 0
    for root, dirs, files in os.walk(SRC_DIR):
        for fname in files:
            if fname.endswith(".tsx") or fname.endswith(".ts"):
                fpath = os.path.join(root, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                original = content
                for ru, en in TRANSLATIONS:
                    content = content.replace(ru, en)
                if content != original:
                    with open(fpath, "w", encoding="utf-8") as f:
                        f.write(content)
                    total_files += 1
    print(f"Done! Updated {total_files} files.")


if __name__ == "__main__":
    main()
