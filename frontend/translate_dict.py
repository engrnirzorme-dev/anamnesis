#!/usr/bin/env python3
"""
Translate Russian string literals in TSX/TS files to English.
Uses a comprehensive hardcoded dictionary for speed and reliability.
"""
import os
import re

# Comprehensive Russian -> English dictionary for medical app UI
TRANSLATIONS = {
    # Auth / PIN
    'Введите PIN-код': 'Enter PIN code',
    'Введите PIN-код для входа': 'Enter PIN code to login',
    'Неверный PIN-код': 'Incorrect PIN code',
    'Неверный PIN': 'Incorrect PIN',
    'PIN-код': 'PIN code',
    'PIN код': 'PIN code',
    'Слишком много попыток': 'Too many attempts',
    'Попробуйте через': 'Try again in',
    'сек.': 'sec.',
    'Попробуйте позже': 'Try again later',
    'Новое устройство': 'New device',
    'Контрольное слово': 'Security word',
    'Название устройства (необязательно)': 'Device name (optional)',
    'Подтвердить': 'Confirm',
    'Проверяю…': 'Checking…',
    'Ошибка проверки': 'Verification error',
    'Ошибка биометрии, введи PIN': 'Biometry error, enter PIN',
    'Войти через биометрию': 'Login with biometry',
    'Неверный ответ': 'Incorrect answer',
    '← Ввести PIN заново': '← Enter PIN again',
    'Нет соединения с сервером': 'No connection to server',
    
    # General UI
    'Загрузка…': 'Loading…',
    'Загрузка': 'Loading',
    'Ошибка': 'Error',
    'Сохранить': 'Save',
    'Отмена': 'Cancel',
    'Удалить': 'Delete',
    'Редактировать': 'Edit',
    'Добавить': 'Add',
    'Закрыть': 'Close',
    'Назад': 'Back',
    'Далее': 'Next',
    'Готово': 'Done',
    'Нет данных': 'No data',
    'Нет записей': 'No records',
    'Поиск…': 'Search…',
    'Поиск': 'Search',
    'Фильтр': 'Filter',
    'Все': 'All',
    'Да': 'Yes',
    'Нет': 'No',
    'Создать': 'Create',
    'Обновить': 'Update',
    'Применить': 'Apply',
    'Сбросить': 'Reset',
    'Подтверждение': 'Confirmation',
    'Предупреждение': 'Warning',
    'Успех': 'Success',
    'Ещё': 'More',
    'Показать': 'Show',
    'Скрыть': 'Hide',
    'Открыть': 'Open',
    'Выбрать': 'Select',
    'Изменить': 'Change',
    'Обязательное поле': 'Required field',
    'Необязательно': 'Optional',
    'Не указано': 'Not specified',
    'Не задано': 'Not set',
    'Данные обновлены': 'Data updated',
    'Данные сохранены': 'Data saved',
    'Произошла ошибка': 'An error occurred',
    'Попробуйте снова': 'Try again',
    
    # Navigation / Sections
    'Главная': 'Dashboard',
    'Дашборд': 'Dashboard',
    'Диагнозы': 'Diagnoses',
    'Медикаменты': 'Medications',
    'Препараты': 'Medications',
    'Визиты': 'Visits',
    'Хронология': 'Timeline',
    'Документы': 'Documents',
    'Анализы': 'Lab Results',
    'Анализы крови': 'Blood Tests',
    'Лабораторные данные': 'Lab Results',
    'Вакцинации': 'Vaccinations',
    'Прививки': 'Vaccinations',
    'Ошибки': 'Errors',
    'Медицинские ошибки': 'Medical Errors',
    'Напоминания': 'Reminders',
    'Специалисты': 'Specialists',
    'Врачи': 'Doctors',
    'Рост и вес': 'Growth & Weight',
    'Рост': 'Growth',
    'Поиск': 'Search',
    'История': 'History',
    'Экспорт': 'Export',
    'Настройки': 'Settings',
    'Безопасность': 'Security',
    'Резервные копии': 'Backups',
    'Граф здоровья': 'Health Graph',
    'График здоровья': 'Health Graph',
    'AI Чат': 'AI Chat',
    'ИИ Чат': 'AI Chat',
    'Комментарии': 'Comments',
    'Назначения': 'Prescriptions',
    
    # Dashboard
    'Активные диагнозы': 'Active Diagnoses',
    'Текущие препараты': 'Current Medications',
    'Критические ошибки': 'Critical Errors',
    'Предстоящие напоминания': 'Upcoming Reminders',
    'Последний визит': 'Last Visit',
    'Сводка ИИ': 'AI Summary',
    'Аналитика ИИ': 'AI Analytics',
    'Нет активных диагнозов': 'No active diagnoses',
    'Нет текущих препаратов': 'No current medications',
    'Нет напоминаний': 'No reminders',
    'Нет критических ошибок': 'No critical errors',
    
    # Plan / Priorities
    'План лечения': 'Treatment Plan',
    'Срочно': 'Urgent',
    'Важно': 'Important',
    'Плановое': 'Routine',
    'Выполнено': 'Completed',
    'В процессе': 'In Progress',
    'Ожидает': 'Pending',
    'Приоритет': 'Priority',
    'Высокий': 'High',
    'Средний': 'Medium',
    'Низкий': 'Low',
    'Срок': 'Due date',
    'Дата выполнения': 'Completion date',
    
    # Medical fields
    'Диагноз': 'Diagnosis',
    'Название': 'Name',
    'Описание': 'Description',
    'Статус': 'Status',
    'Активный': 'Active',
    'Активна': 'Active',
    'В ремиссии': 'In remission',
    'Вылечен': 'Cured',
    'Дата': 'Date',
    'Дата начала': 'Start date',
    'Дата окончания': 'End date',
    'Дозировка': 'Dosage',
    'Частота': 'Frequency',
    'Препарат': 'Medication',
    'Код МКБ': 'ICD Code',
    'Источник': 'Source',
    'Врач': 'Doctor',
    'Специалист': 'Specialist',
    'Клиника': 'Clinic',
    'Тип специалиста': 'Specialist type',
    'Специализация': 'Specialization',
    'Телефон': 'Phone',
    'Примечания': 'Notes',
    'Заметки': 'Notes',
    'Оценка ИИ': 'AI Assessment',
    'Анализ ИИ': 'AI Analysis',
    'Запросить анализ': 'Request analysis',
    'Ожидает анализа': 'Pending analysis',
    'Анализ готов': 'Analysis ready',
    'Аномалия': 'Anomaly',
    'Норма': 'Normal',
    'Выше нормы': 'Above normal',
    'Ниже нормы': 'Below normal',
    'Критично': 'Critical',
    'Критическое': 'Critical',
    'Высокое': 'High',
    'Серьёзное': 'Serious',
    'Умеренное': 'Moderate',
    
    # Documents
    'Загрузить документ': 'Upload document',
    'Загрузить': 'Upload',
    'Файл': 'File',
    'Тип файла': 'File type',
    'Размер': 'Size',
    'Категория': 'Category',
    'Транскрипция': 'Transcription',
    'Анализ документа': 'Document analysis',
    'Дата документа': 'Document date',
    'Источник документа': 'Document source',
    'Организация': 'Organization',
    'Дубликат': 'Duplicate',
    'Требует источника': 'Needs source',
    'Низкое качество': 'Low quality',
    'Конфликт': 'Conflict',
    'Хорошее качество': 'Good quality',
    
    # Lab results
    'Тест': 'Test',
    'Параметр': 'Parameter',
    'Значение': 'Value',
    'Единица': 'Unit',
    'Референс. диапазон': 'Reference range',
    'Референсный диапазон': 'Reference range',
    'Мин.': 'Min.',
    'Макс.': 'Max.',
    'Дата теста': 'Test date',
    'Название теста': 'Test name',
    
    # Vaccinations
    'Вакцина': 'Vaccine',
    'Название вакцины': 'Vaccine name',
    'Дата введения': 'Administration date',
    'Запланировано': 'Scheduled',
    'Введена': 'Administered',
    'Пропущена': 'Missed',
    'Реакция': 'Reaction',
    'Серия': 'Batch',
    'Номер дозы': 'Dose number',
    'Фотографии': 'Photos',
    
    # Growth
    'Рост (см)': 'Height (cm)',
    'Вес (кг)': 'Weight (kg)',
    'Окружность головы (см)': 'Head circumference (cm)',
    'Дата измерения': 'Measurement date',
    'Измерено': 'Measured',
    
    # Security
    'Устройства': 'Devices',
    'Доверенные устройства': 'Trusted devices',
    'Последнее посещение': 'Last seen',
    'Отозвать': 'Revoke',
    'Выйти': 'Logout',
    'Выйти везде': 'Logout everywhere',
    'Сменить PIN': 'Change PIN',
    'Текущий PIN': 'Current PIN',
    'Новый PIN': 'New PIN',
    'Повторите новый PIN': 'Repeat new PIN',
    'PIN изменён': 'PIN changed',
    'Настроить': 'Set up',
    'Контрольный вопрос': 'Security question',
    'Ответ': 'Answer',
    'Вопрос': 'Question',
    'Биометрия': 'Biometry',
    'Face ID': 'Face ID',
    'Touch ID': 'Touch ID',
    'Passkey': 'Passkey',
    'Зарегистрировать биометрию': 'Register biometry',
    'Удалить биометрию': 'Remove biometry',
    
    # Reminders
    'Напоминание': 'Reminder',
    'Создать напоминание': 'Create reminder',
    'Заголовок': 'Title',
    'Дата и время': 'Date and time',
    'Активно': 'Active',
    'Завершено': 'Completed',
    'Просрочено': 'Overdue',
    
    # Backups
    'Резервная копия': 'Backup',
    'Создать копию': 'Create backup',
    'Последняя копия': 'Last backup',
    'Шифрование': 'Encryption',
    'Telegram': 'Telegram',
    
    # History / Audit
    'Изменения': 'Changes',
    'Кем изменено': 'Changed by',
    'Когда изменено': 'Changed at',
    'Добавлено': 'Added',
    'Изменено': 'Updated',
    'Удалено': 'Deleted',
    
    # Export
    'Экспортировать': 'Export',
    'Скачать PDF': 'Download PDF',
    'Подготовка…': 'Preparing…',
    
    # Comments
    'Добавить комментарий': 'Add comment',
    'Комментарий': 'Comment',
    'Написать комментарий…': 'Write a comment…',
    'Отправить': 'Send',
    
    # Errors page
    'Медицинская ошибка': 'Medical error',
    'Серьёзность': 'Severity',
    'Рекомендации': 'Recommendations',
    'Разрешено': 'Resolved',
    'Не разрешено': 'Unresolved',
    'Дата разрешения': 'Resolution date',
    
    # Misc
    'Обновить страницу': 'Refresh page',
    'Нет подключения к интернету': 'No internet connection',
    'Нет подключения': 'No connection',
    'Подключение восстановлено': 'Connection restored',
    'Обновление…': 'Updating…',
    'пациент': 'patient',
    'Пациент': 'Patient',
    'Имя': 'Name',
    'Дата рождения': 'Date of birth',
    'Пол': 'Gender',
    'Мужской': 'Male',
    'Женский': 'Female',
    'Возраст': 'Age',
    'лет': 'years',
    'год': 'year',
    'года': 'years',
    'месяц': 'month',
    'месяца': 'months',
    'месяцев': 'months',
    'день': 'day',
    'дня': 'days',
    'дней': 'days',
    'час': 'hour',
    'часа': 'hours',
    'часов': 'hours',
    'минута': 'minute',
    'минуты': 'minutes',
    'минут': 'minutes',
    'секунда': 'second',
    'секунды': 'seconds',
    'секунд': 'seconds',
    'сегодня': 'today',
    'вчера': 'yesterday',
    'завтра': 'tomorrow',
    'назад': 'ago',
    'через': 'in',
    'Итого': 'Total',
    'Всего': 'Total',
    'Страница': 'Page',
    'из': 'of',
    'запись': 'record',
    'записи': 'records',
    'записей': 'records',
}

def translate_file(filepath, translations):
    """Translate Russian strings in a file using dictionary."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Sort by length (longest first) to avoid partial replacements
    sorted_keys = sorted(translations.keys(), key=len, reverse=True)
    
    for ru in sorted_keys:
        en = translations[ru]
        # Only replace inside string literals (between quotes)
        # Pattern: Russian text inside quotes
        if ru in content:
            content = content.replace(ru, en)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    target_dir = '/data/data/com.termux/files/home/anamnesis/frontend/src'
    changed = 0
    for root, dirs, files in os.walk(target_dir):
        # Skip node_modules
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                filepath = os.path.join(root, file)
                if translate_file(filepath, TRANSLATIONS):
                    changed += 1
                    print(f'Updated: {filepath}')
    print(f'\nDone! Updated {changed} files.')

if __name__ == '__main__':
    main()
