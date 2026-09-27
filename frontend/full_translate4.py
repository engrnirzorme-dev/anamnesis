#!/usr/bin/env python3
"""
Fourth-pass: fix the last specific remaining Russian UI strings.
"""
import os

SRC_DIR = "/data/data/com.termux/files/home/anamnesis/frontend/src"

TRANSLATIONS = [
    # DetailSheet
    ("Неactive", "Inactive"),
    ("Неактивный", "Inactive"),
    # VisitDetailsModal
    ("Вofит не найден или был удалён.", "Visit not found or was deleted."),
    # ErrorModal
    ("Open заново", "Reopen"),
    # HealthGraphPage
    ("Проблемы", "Issues"),
    # graph-elements edge labels
    ("назначил", "prescribed"),
    ("назначен", "prescribed"),
    ("для", "for"),
    # MorePage
    ("Чат с AI", "AI Chat"),
    ("All препараты", "All medications"),
    ("All специалисты", "All specialists"),
    ("All вакцинации", "All vaccinations"),
    ("All анализы", "All lab results"),
    ("All напоминания", "All reminders"),
    ("All диагнозы", "All diagnoses"),
    ("All приёмы", "All visits"),
    ("All документы", "All documents"),
    ("All записи", "All records"),
    ("All ошибки", "All errors"),
    # Vaccinations
    ("BeforeBeforeза", "Dose"),
    ("Beforeза", "Dose"),
    # Collapsible labels
    ("NIRZOR Аналof", "NIRZOR Analysis"),
    # SecurityModal
    ("Секретный вопрос", "Security question"),
    ("Изменить пароль", "Change password"),
    ("Старый пароль", "Old password"),
    ("Новый пароль", "New password"),
    ("Повторите пароль", "Repeat password"),
    ("Биометрическая авторизация", "Biometric authentication"),
    # HistoryModal
    ("История изменений", "Change history"),
    # NirzorModal
    ("Введите клинический вопрос", "Enter clinical question"),
    ("нAprимер", "e.g."),
    # Transcription
    ("КЛЮЧЕВЫЕ MОMЕНТЫ", "KEY POINTS"),
    ("КЛЮЧЕВЫЕ МОМЕНТЫ", "KEY POINTS"),
    # DashboardPage
    ("Обновление...", "Updating..."),
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
