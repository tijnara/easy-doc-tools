'use client';
import { useState } from 'react';

export default function DueDateCalculator() {
    const [baseDate, setBaseDate] = useState('2026-08-01');
    const [frequency, setFrequency] = useState('weekly');
    const [installments, setInstallments] = useState(12);
    const [copied, setCopied] = useState(false);

    // Payment frequency rules
    const frequencies = [
        { id: 'weekly', label: 'Weekly', days: 7, months: 0, desc: 'Every 7 days' },
        { id: 'fortnightly', label: 'Fortnightly', days: 14, months: 0, desc: 'Every 2 weeks' },
        { id: 'monthly', label: 'Monthly', days: 0, months: 1, desc: 'Every month' },
        { id: 'quarterly', label: 'Quarterly', days: 0, months: 3, desc: 'Every 3 months' },
        { id: 'semi-annually', label: 'Semi-Annually', days: 0, months: 6, desc: 'Every 6 months' },
        { id: 'annually', label: 'Annually', days: 0, months: 12, desc: 'Every year' },
    ];

    // Compute upcoming payment schedule for N installments
    const calculateSchedule = (startDateStr, freqId, count) => {
        if (!startDateStr || !count || count <= 0) return [];
        const result = [];
        const freqObj = frequencies.find((f) => f.id === freqId) || frequencies[0];

        for (let i = 1; i <= count; i++) {
            let nextDate = new Date(startDateStr + 'T00:00:00');
            if (freqObj.months > 0) {
                nextDate.setMonth(nextDate.getMonth() + freqObj.months * i);
            } else {
                nextDate.setDate(nextDate.getDate() + freqObj.days * i);
            }

            result.push({
                installment: i,
                dateStr: nextDate.toISOString().split('T')[0],
                formatted: nextDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
            });
        }
        return result;
    };

    const numInstallments = Math.max(1, parseInt(installments, 10) || 1);
    const schedule = calculateSchedule(baseDate, frequency, numInstallments);
    const nextPayment = schedule[0];
    const finalPayment = schedule[schedule.length - 1];

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleCopySchedule = () => {
        if (!nextPayment) return;
        const selectedFreqLabel = frequencies.find((f) => f.id === frequency)?.label;
        let text = `Payment Due Summary:\nInitial Due Date: ${formatDate(baseDate)}\nFrequency: ${selectedFreqLabel}\nTotal Installments: ${numInstallments}\nNEXT DUE DATE: ${nextPayment.formatted}\nFINAL DUE DATE: ${finalPayment?.formatted || 'N/A'}\n\nFull Payment Lineup:\n`;
        schedule.forEach((item) => {
            text += `Payment #${item.installment}: ${item.formatted}\n`;
        });

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Due Date Calculator</h2>
                <button
                    onClick={handleCopySchedule}
                    className="px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition"
                >
                    {copied ? '✓ Copied!' : '📋 Copy Schedule'}
                </button>
            </div>

            {/* Configurable Inputs: Start Date, Frequency, and Number of Installments */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Initial Due Date
                    </label>
                    <input
                        type="date"
                        value={baseDate}
                        onChange={(e) => setBaseDate(e.target.value)}
                        className="p-3 border rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>

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
                        placeholder="12"
                        className="p-3 border rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>
            </div>

            {/* Summary Highlights: Next Payment and Final Completion Date */}
            {nextPayment && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl flex flex-col gap-3 shadow-2xs">
                    <div className="flex flex-col items-center justify-center text-center gap-0.5">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Next Due Date (#1)
                        </span>
                        <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
                            {nextPayment.formatted}
                        </span>
                    </div>

                    {numInstallments > 1 && finalPayment && (
                        <div className="pt-2 border-t border-blue-100 dark:border-slate-800 flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">
                                Final Payment Due Date (#{numInstallments}):
                            </span>
                            <strong className="text-gray-800 dark:text-gray-200 font-mono font-bold">
                                {finalPayment.formatted}
                            </strong>
                        </div>
                    )}
                </div>
            )}

            {/* Lineup List for All Installments */}
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