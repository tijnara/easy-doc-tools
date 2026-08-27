'use client';
import { useState, useEffect, useRef } from 'react';

export default function DueDateCalculator() {
    // Initial date formatted as DD/MM/YYYY
    const [baseDate, setBaseDate] = useState('01/08/2026');
    const [frequency, setFrequency] = useState('weekly');
    const [installments, setInstallments] = useState(12);
    const [copied, setCopied] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    // Popover Calendar State
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewYear, setViewYear] = useState(2026);
    const [viewMonth, setViewMonth] = useState(7); // 0-indexed: 7 = August
    const calendarRef = useRef(null);

    // Payment frequency rules
    const frequencies = [
        { id: 'weekly', label: 'Weekly', days: 7, months: 0, desc: 'Every 7 days' },
        { id: 'fortnightly', label: 'Fortnightly', days: 14, months: 0, desc: 'Every 2 weeks' },
        { id: 'monthly', label: 'Monthly', days: 0, months: 1, desc: 'Every month' },
        { id: 'quarterly', label: 'Quarterly', days: 0, months: 3, desc: 'Every 3 months' },
        { id: 'semi-annually', label: 'Semi-Annually', days: 0, months: 6, desc: 'Every 6 months' },
        { id: 'annually', label: 'Annually', days: 0, months: 12, desc: 'Every year' },
    ];

    // Converts Date object to DD/MM/YYYY string
    const formatDateToDmy = (dateObj) => {
        if (!dateObj || isNaN(dateObj.getTime())) return '';
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();
        return `${d}/${m}/${y}`;
    };

    // Robust parser for DD/MM/YYYY or flexible inputs
    const parseDmyOrFlexible = (inputStr) => {
        if (!inputStr) return null;
        const cleaned = inputStr.trim();

        // Standard DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
        if (dmyMatch) {
            const day = parseInt(dmyMatch[1], 10);
            const month = parseInt(dmyMatch[2], 10) - 1;
            const year = parseInt(dmyMatch[3], 10);
            const date = new Date(year, month, day);
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                return date;
            }
        }

        // YYYY-MM-DD format (ISO fallback)
        const isoMatch = cleaned.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10) - 1;
            const day = parseInt(isoMatch[3], 10);
            const date = new Date(year, month, day);
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                return date;
            }
        }

        // Fallback natural date parsing (e.g. "25 Aug 2026")
        const parsedDate = new Date(cleaned);
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
        }

        return null;
    };

    const handlePasteDate = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text') || '';
        const parsedDate = parseDmyOrFlexible(pastedText);

        if (parsedDate) {
            setBaseDate(formatDateToDmy(parsedDate));
            showToast('Date pasted & recognized!');
        } else {
            showToast('Could not recognize date format');
        }
    };

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 2500);
    };

    // Sync calendar month/year view whenever baseDate updates to a valid date
    useEffect(() => {
        if (baseDate) {
            const parsed = parseDmyOrFlexible(baseDate);
            if (parsed) {
                setViewYear(parsed.getFullYear());
                setViewMonth(parsed.getMonth());
            }
        }
    }, [baseDate]);

    // Close calendar popover on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calendar Grid Helpers
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const handleSelectDay = (day) => {
        const selectedDate = new Date(viewYear, viewMonth, day);
        setBaseDate(formatDateToDmy(selectedDate));
        setShowCalendar(false);
    };

    // Compute upcoming payment schedule for N installments
    const calculateSchedule = (startDateStr, freqId, count) => {
        const startDate = parseDmyOrFlexible(startDateStr);
        if (!startDate || !count || count <= 0) return [];

        const result = [];
        const freqObj = frequencies.find((f) => f.id === freqId) || frequencies[0];

        for (let i = 1; i <= count; i++) {
            let nextDate = new Date(startDate.getTime());

            if (freqObj.months > 0) {
                nextDate.setMonth(nextDate.getMonth() + freqObj.months * (i - 1));
            } else {
                nextDate.setDate(nextDate.getDate() + freqObj.days * (i - 1));
            }

            result.push({
                installment: i,
                dateStr: formatDateToDmy(nextDate),
                formatted: formatDateToDmy(nextDate),
            });
        }
        return result;
    };

    const numInstallments = Math.max(1, parseInt(installments, 10) || 1);
    const schedule = calculateSchedule(baseDate, frequency, numInstallments);
    const nextPayment = schedule[0];
    const finalPayment = schedule[schedule.length - 1];

    const formatDisplayHeaderDate = (dateStr) => {
        const d = parseDmyOrFlexible(dateStr);
        if (!d) return dateStr;
        return d.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleCopySchedule = () => {
        if (!nextPayment) return;
        const selectedFreqLabel = frequencies.find((f) => f.id === frequency)?.label;
        let text = `Payment Due Summary:\nInitial Due Date: ${baseDate}\nFrequency: ${selectedFreqLabel}\nTotal Installments: ${numInstallments}\nNEXT DUE DATE: ${nextPayment.formatted}\nFINAL DUE DATE: ${finalPayment?.formatted || 'N/A'}\n\nFull Payment Lineup:\n`;
        schedule.forEach((item) => {
            text += `Payment #${item.installment}: ${item.formatted}\n`;
        });

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const parsedCurrentBase = parseDmyOrFlexible(baseDate);

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Due Date Calculator</h2>
                    {toastMsg && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50">
                            ✓ {toastMsg}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleCopySchedule}
                    className="px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition"
                >
                    {copied ? '✓ Copied!' : '📋 Copy Schedule'}
                </button>
            </div>

            {/* Inputs Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                {/* Initial Due Date Input (DD/MM/YYYY Format) with Manual Editing & Interactive Calendar */}
                <div className="flex flex-col gap-1.5 relative" ref={calendarRef}>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Initial Due Date (DD/MM/YYYY)
                    </label>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={baseDate}
                            onChange={(e) => setBaseDate(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onPaste={handlePasteDate}
                            placeholder="DD/MM/YYYY"
                            className="w-full p-3 pr-10 border rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCalendar(!showCalendar)}
                            title="Open Calendar Picker"
                            className="absolute right-2.5 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 transition"
                        >
                            📅
                        </button>
                    </div>

                    {/* Interactive Calendar Popover */}
                    {showCalendar && (
                        <div className="absolute top-full left-0 mt-2 z-50 w-72 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl animate-fadeIn">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition"
                                >
                                    ◀
                                </button>
                                <span className="font-bold text-xs text-gray-800 dark:text-white">
                                    {monthNames[viewMonth]} {viewYear}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition"
                                >
                                    ▶
                                </button>
                            </div>

                            {/* Weekday Labels */}
                            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1">
                                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="grid grid-cols-7 gap-1 text-xs">
                                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}

                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const isSelected = parsedCurrentBase &&
                                        parsedCurrentBase.getFullYear() === viewYear &&
                                        parsedCurrentBase.getMonth() === viewMonth &&
                                        parsedCurrentBase.getDate() === day;

                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => handleSelectDay(day)}
                                            className={`h-8 rounded-lg font-semibold flex items-center justify-center transition ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Quick Select Shortcuts */}
                            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBaseDate('01/08/2026');
                                        setShowCalendar(false);
                                    }}
                                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    01/08/2026
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBaseDate(formatDateToDmy(new Date()));
                                        setShowCalendar(false);
                                    }}
                                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Today
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Frequency Selector */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Frequency
                    </label>
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="p-3 border rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                    >
                        {frequencies.map((freq) => (
                            <option key={freq.id} value={freq.id}>
                                {freq.label} ({freq.desc})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Number of Payments */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Payments
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="120"
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="12"
                        className="p-3 border rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>
            </div>

            {/* Summary Highlights */}
            {nextPayment && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl flex flex-col gap-3 shadow-2xs">
                    <div className="flex flex-col items-center justify-center text-center gap-0.5">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Next Due Date (#1)
                        </span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
                            {formatDisplayHeaderDate(nextPayment.dateStr)}
                        </span>
                    </div>

                    {numInstallments > 1 && finalPayment && (
                        <div className="pt-2 border-t border-blue-100 dark:border-slate-800 flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                                Final Payment Due Date (#{numInstallments}):
                            </span>
                            <strong className="text-gray-800 dark:text-gray-200 font-mono font-bold">
                                {formatDisplayHeaderDate(finalPayment.dateStr)}
                            </strong>
                        </div>
                    )}
                </div>
            )}

            {/* Lineup List */}
            <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700/60">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Upcoming Payment Lineup ({numInstallments} Payments):
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {frequencies.find((f) => f.id === frequency)?.label} Frequency
                    </span>
                </div>

                <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {schedule.map((item) => (
                        <li
                            key={item.installment}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                                item.installment === 1
                                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50'
                                    : item.installment === numInstallments
                                        ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40'
                                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700/80'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
                                    Payment #{item.installment}
                                </span>
                                {item.installment === 1 && (
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                                        NEXT
                                    </span>
                                )}
                                {item.installment === numInstallments && numInstallments > 1 && (
                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">
                                        FINAL
                                    </span>
                                )}
                            </div>
                            <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 font-mono">
                                {item.formatted}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}