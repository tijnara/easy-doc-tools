'use client';
import { useState, useEffect, useRef } from 'react';

const RULES = [
    { id: 'new', label: 'New', info: 'Two and a half year', addMonths: 30, lifeMonths: 0 },
    { id: '1st', label: '1st Anniv', info: 'One and half years', addMonths: 18, lifeMonths: 12 },
    { id: '2nd', label: '2nd Anniv', info: 'Six Months', addMonths: 6, lifeMonths: 24 },
];

// Helper Component for DD/MM/YYYY text input with native calendar popup trigger
function DateInputUK({ valueIso, onChangeIso, label }) {
    const isoToUkStr = (iso) => {
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    const [textValue, setTextValue] = useState(isoToUkStr(valueIso));
    const datePickerRef = useRef(null);

    useEffect(() => {
        setTextValue(isoToUkStr(valueIso));
    }, [valueIso]);

    // Handle Manual Typing in DD/MM/YYYY format
    const handleTextChange = (e) => {
        const raw = e.target.value;
        setTextValue(raw);

        // Auto-parse DD/MM/YYYY when user completes typing
        const parts = raw.split('/');
        if (parts.length === 3) {
            let [d, m, y] = parts.map((p) => p.trim());
            if (d.length === 1) d = '0' + d;
            if (m.length === 1) m = '0' + m;

            if (d.length === 2 && m.length === 2 && y.length === 4) {
                const dayNum = parseInt(d, 10);
                const monthNum = parseInt(m, 10);
                const yearNum = parseInt(y, 10);

                if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 1900 && yearNum <= 2100) {
                    const iso = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const testDate = new Date(iso);
                    if (!isNaN(testDate.getTime())) {
                        onChangeIso(iso);
                    }
                }
            }
        }
    };

    // Handle Calendar Date Picker selection
    const handlePickerChange = (e) => {
        const val = e.target.value;
        if (val) {
            onChangeIso(val);
            setTextValue(isoToUkStr(val));
        }
    };

    const openCalendar = () => {
        if (datePickerRef.current) {
            if (typeof datePickerRef.current.showPicker === 'function') {
                datePickerRef.current.showPicker();
            } else {
                datePickerRef.current.focus();
                datePickerRef.current.click();
            }
        }
    };

    return (
        <div className="relative flex items-center w-full">
            <input
                type="text"
                value={textValue}
                onChange={handleTextChange}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                title={`${label} in DD/MM/YYYY format`}
                className="w-full p-2 pr-8 border rounded-xl text-xs font-bold font-mono text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Interactive Calendar Icon Trigger */}
            <button
                type="button"
                onClick={openCalendar}
                title="Click to select date from calendar"
                className="absolute right-2 text-gray-400 hover:text-blue-500 transition cursor-pointer text-sm select-none"
            >
                📅
            </button>

            {/* Hidden Native Calendar Picker */}
            <input
                ref={datePickerRef}
                type="date"
                value={valueIso || ''}
                onChange={handlePickerChange}
                className="absolute opacity-0 w-0 h-0 pointer-events-none top-0 right-0"
                tabIndex={-1}
            />
        </div>
    );
}

export default function NrdCalculator() {
    const [startDateStr, setStartDateStr] = useState('2026-08-22');
    const [annivDateStr, setAnnivDateStr] = useState('2026-08-22');
    const [selectedRuleId, setSelectedRuleId] = useState('new');
    const [isAutoDetected, setIsAutoDetected] = useState(true);
    const [currentYearToggle, setCurrentYearToggle] = useState('Yes');
    const [feedback, setFeedback] = useState('');

    // Restore state from localStorage on mount
    useEffect(() => {
        const savedStart = localStorage.getItem('nrd_start_date');
        const savedAnniv = localStorage.getItem('nrd_anniv_date');
        const savedRule = localStorage.getItem('nrd_selected_rule');
        if (savedStart) {
            setStartDateStr(savedStart);
            if (savedAnniv) setAnnivDateStr(savedAnniv);
            if (savedRule) setSelectedRuleId(savedRule);
        } else {
            autoDetectRule('2026-08-22');
        }
    }, []);

    // Helper: Add months to a Date object safely
    const addMonths = (dateObj, months) => {
        if (!dateObj || isNaN(dateObj.getTime())) return null;
        const d = new Date(dateObj);
        const day = d.getDate();
        d.setMonth(d.getMonth() + parseInt(months, 10));
        if (d.getDate() < day) d.setDate(0);
        return d;
    };

    // Construct hybrid base date: Takes Month & Year from Anniversary Date, Day from Start Date
    const getHybridBaseDate = (startObj, annivObj) => {
        if (!startObj || isNaN(startObj.getTime())) return annivObj;
        if (!annivObj || isNaN(annivObj.getTime())) return startObj;

        const targetYear = annivObj.getFullYear();
        const targetMonth = annivObj.getMonth();
        const targetDay = startObj.getDate();

        // Clamp day to prevent overflow for shorter months (e.g. Feb 31st -> Feb 28th/29th)
        const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const clampedDay = Math.min(targetDay, daysInTargetMonth);

        return new Date(targetYear, targetMonth, clampedDay);
    };

    // Helper: Auto-detect Rule and set Anniversary Date based on Start Date relative to current year
    const autoDetectRule = (startIso) => {
        if (!startIso) return;
        const start = new Date(startIso);
        if (isNaN(start.getTime())) return;

        const refDate = new Date(); // Current date anchor
        let yearDiff = refDate.getFullYear() - start.getFullYear();
        const monthDiff = refDate.getMonth() - start.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < start.getDate())) {
            yearDiff--;
        }

        let detectedRule = 'new';
        let annivOffsetMonths = 0;

        if (yearDiff === 1) {
            detectedRule = '1st';
            annivOffsetMonths = 12; // 1st Anniv = Start + 1 Year
        } else if (yearDiff >= 2) {
            detectedRule = '2nd';
            annivOffsetMonths = 24; // 2nd Anniv = Start + 2 Years
        } else {
            detectedRule = 'new';
            annivOffsetMonths = 0; // New = Start Date
        }

        const computedAnniv = addMonths(start, annivOffsetMonths);
        const annivIso = computedAnniv ? computedAnniv.toISOString().split('T')[0] : startIso;

        setSelectedRuleId(detectedRule);
        setAnnivDateStr(annivIso);
        setIsAutoDetected(true);

        localStorage.setItem('nrd_selected_rule', detectedRule);
        localStorage.setItem('nrd_anniv_date', annivIso);
    };

    const handleStartDateChange = (val) => {
        setStartDateStr(val);
        localStorage.setItem('nrd_start_date', val);
        autoDetectRule(val);
    };

    const handleAnnivDateChange = (val) => {
        setAnnivDateStr(val);
        localStorage.setItem('nrd_anniv_date', val);

        if (startDateStr && val) {
            const start = new Date(startDateStr);
            const anniv = new Date(val);
            if (!isNaN(start) && !isNaN(anniv)) {
                const totalMonths = (anniv.getFullYear() - start.getFullYear()) * 12 + (anniv.getMonth() - start.getMonth());
                if (totalMonths >= 24) setSelectedRuleId('2nd');
                else if (totalMonths >= 12) setSelectedRuleId('1st');
                else setSelectedRuleId('new');
            }
        }
    };

    const handleManualRuleSelect = (ruleId) => {
        setSelectedRuleId(ruleId);
        setIsAutoDetected(false);
        localStorage.setItem('nrd_selected_rule', ruleId);

        if (startDateStr) {
            const start = new Date(startDateStr);
            if (!isNaN(start)) {
                let offset = 0;
                if (ruleId === '1st') offset = 12;
                if (ruleId === '2nd') offset = 24;
                const computed = addMonths(start, offset);
                if (computed) {
                    const iso = computed.toISOString().split('T')[0];
                    setAnnivDateStr(iso);
                    localStorage.setItem('nrd_anniv_date', iso);
                }
            }
        }
    };

    const formatDateUK = (dateObj) => {
        if (!dateObj || isNaN(dateObj.getTime())) return '—';
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const getMonthShort = (dateObj) => {
        if (!dateObj || isNaN(dateObj.getTime())) return '';
        return dateObj.toLocaleString('en-US', { month: 'short' });
    };

    const startDateObj = startDateStr ? new Date(startDateStr) : null;
    const annivDateObj = annivDateStr ? new Date(annivDateStr) : null;

    let monthDiff = 0;
    if (startDateObj && annivDateObj && !isNaN(startDateObj) && !isNaN(annivDateObj)) {
        monthDiff = (annivDateObj.getFullYear() - startDateObj.getFullYear()) * 12 + (annivDateObj.getMonth() - startDateObj.getMonth());
    }

    const activeRule = RULES.find((r) => r.id === selectedRuleId) || RULES[0];

    // NRD Calculation:
    // Takes Anniversary Month & Year + Start Date Day as base, then adds the rule's months (+30m, +18m, or +6m)
    let nrdObj = null;
    if (startDateObj && annivDateObj && !isNaN(startDateObj) && !isNaN(annivDateObj)) {
        const hybridBaseDate = getHybridBaseDate(startDateObj, annivDateObj);
        nrdObj = addMonths(hybridBaseDate, activeRule.addMonths);
    } else if (startDateObj) {
        nrdObj = addMonths(startDateObj, activeRule.addMonths);
    }

    const handleCopyNrd = () => {
        if (!nrdObj) return;
        const text = formatDateUK(nrdObj);
        navigator.clipboard.writeText(text);
        setFeedback('Copied NRD!');
        setTimeout(() => setFeedback(''), 2000);
    };

    return (
        <div className="flex flex-col gap-5 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span>📅</span>
                        <span>Next Review Date (NRD)</span>
                    </h2>
                    {isAutoDetected && (
                        <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50">
                            ⚡ Auto-Detected
                        </span>
                    )}
                </div>

                {feedback && (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50">
                        ✓ {feedback}
                    </span>
                )}
            </div>

            {/* Input Date Controls Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Current Year</label>
                    <select
                        value={currentYearToggle}
                        onChange={(e) => setCurrentYearToggle(e.target.value)}
                        className="p-2.5 border rounded-xl text-xs font-bold text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                </div>

                {/* Manual Type + Calendar Selection for Start Date */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Start Date (DD/MM/YYYY)</label>
                    <div className="flex items-center gap-1.5">
                        <DateInputUK
                            valueIso={startDateStr}
                            onChangeIso={handleStartDateChange}
                            label="Start Date"
                        />
                        <span className="text-xs font-mono font-bold text-gray-400 dark:text-gray-500 min-w-[28px]">
                            {getMonthShort(startDateObj)}
                        </span>
                    </div>
                </div>

                {/* Manual Type + Calendar Selection for Anniversary Date */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Anniversary Date (DD/MM/YYYY)</label>
                    <div className="flex items-center gap-1.5">
                        <DateInputUK
                            valueIso={annivDateStr}
                            onChangeIso={handleAnnivDateChange}
                            label="Anniversary Date"
                        />
                        <span className="text-xs font-mono font-bold text-gray-400 dark:text-gray-500 min-w-[28px]">
                            {getMonthShort(annivDateObj)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Calculated Output Display Box */}
            <div className="p-4 bg-slate-900 text-white dark:bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Next Review Date (NRD)
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-extrabold text-red-400 font-mono tracking-wide">
                            {formatDateUK(nrdObj)}
                        </span>
                        <span className="text-xs font-bold text-amber-300">
                            ({getMonthShort(nrdObj)})
                        </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                        Diff of {monthDiff} months ({activeRule.label}: +{activeRule.addMonths} months)
                    </span>
                </div>

                <button
                    onClick={handleCopyNrd}
                    disabled={!nrdObj}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow-xs disabled:opacity-40"
                >
                    📋 Copy NRD
                </button>
            </div>

            {/* Interactive Rules Table */}
            <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rules Table
                </span>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                        <tr className="bg-slate-900 text-amber-400 font-bold border-b border-slate-800">
                            <th className="p-3">Rules</th>
                            <th className="p-3">Info Description</th>
                            <th className="p-3 text-center">Add (In Months)</th>
                            <th className="p-3 text-center">Life</th>
                            <th className="p-3 text-right">Select</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {RULES.map((rule) => {
                            const isSelected = rule.id === selectedRuleId;
                            return (
                                <tr
                                    key={rule.id}
                                    onClick={() => handleManualRuleSelect(rule.id)}
                                    className={`cursor-pointer transition ${
                                        isSelected
                                            ? 'bg-amber-300 text-slate-950 font-extrabold dark:bg-amber-400 dark:text-slate-950'
                                            : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <td className="p-3">{rule.label}</td>
                                    <td className="p-3">{rule.info}</td>
                                    <td className="p-3 text-center font-mono">{rule.addMonths}</td>
                                    <td className="p-3 text-center font-mono">{rule.lifeMonths}</td>
                                    <td className="p-3 text-right">
                                        <input
                                            type="radio"
                                            name="nrd_rule"
                                            checked={isSelected}
                                            onChange={() => handleManualRuleSelect(rule.id)}
                                            className="cursor-pointer"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}