"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (start: Date, end: Date) => void;
}

export function DatePickerModal({ isOpen, onClose, onApply }: DatePickerModalProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Initial state setup to highlight today or existing selection could go here

    if (!isOpen) return null;

    const handleDateClick = (date: Date) => {
        // Reset if we have a full range or just starting
        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null);
        } else {
            // We have start date, picking end date
            if (date < startDate) {
                // Picked date before start, user probably meant new start
                setStartDate(date);
            } else {
                setEndDate(date);
            }
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay }; // 0 = Sunday
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const generateCalendar = () => {
        const calendarDays = [];
        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="p-2" />);
        }
        // Days
        for (let i = 1; i <= days; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            let isSelected = false;
            let isRange = false;

            if (startDate && date.toDateString() === startDate.toDateString()) isSelected = true;
            if (endDate && date.toDateString() === endDate.toDateString()) isSelected = true;
            if (startDate && endDate && date > startDate && date < endDate) isRange = true;

            // Check if today
            const isToday = new Date().toDateString() === date.toDateString();

            calendarDays.push(
                <button
                    key={i}
                    onClick={() => handleDateClick(date)}
                    className={`
                        h-9 w-9 lg:h-10 lg:w-10 rounded-full flex items-center justify-center text-sm transition-colors
                        ${isSelected ? 'bg-[#16a34a] text-white font-bold hover:bg-[#15803d]' : ''}
                        ${isRange && !isSelected ? 'bg-green-50 text-[#16a34a]' : ''}
                        ${!isSelected && !isRange ? 'hover:bg-gray-100 text-gray-700' : ''}
                        ${isToday && !isSelected && !isRange ? 'border border-[#16a34a] text-[#16a34a] font-semibold' : ''}
                    `}
                >
                    {i}
                </button>
            );
        }
        return calendarDays;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b flex items-center justify-between">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                    <h2 className="font-semibold text-lg">Select Dates</h2>
                    <div className="w-9" /> {/* Spacer to balance X button */}
                </div>

                <div className="p-4">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <span className="font-bold text-base">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <span key={d} className="text-xs text-gray-400 font-semibold">{d}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {generateCalendar()}
                    </div>

                    {/* Quick Select Pills (Future improvement) */}
                    <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => {
                                const today = new Date();
                                const nextWeek = new Date();
                                nextWeek.setDate(today.getDate() + 7);
                                setStartDate(today);
                                setEndDate(nextWeek);
                            }}
                            className="px-3 py-1 rounded-full border border-gray-200 text-xs font-medium hover:bg-gray-50 whitespace-nowrap"
                        >
                            Next 7 Days
                        </button>
                        <button
                            onClick={() => {
                                const today = new Date();
                                const weekend = new Date(today);
                                weekend.setDate(today.getDate() + (6 - today.getDay())); // Saturday
                                const sunday = new Date(weekend);
                                sunday.setDate(weekend.getDate() + 1);
                                setStartDate(weekend);
                                setEndDate(sunday);
                            }}
                            className="px-3 py-1 rounded-full border border-gray-200 text-xs font-medium hover:bg-gray-50 whitespace-nowrap"
                        >
                            This Weekend
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <button
                        onClick={() => { setStartDate(null); setEndDate(null); }}
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 underline decoration-gray-300 underline-offset-4"
                    >
                        Clear
                    </button>
                    <Button
                        disabled={!startDate || !endDate}
                        onClick={() => onApply(startDate!, endDate!)}
                        className="bg-[#16a34a] hover:bg-[#15803d] text-white rounded-full px-6"
                    >
                        Apply Filter
                    </Button>
                </div>
            </div>
        </div>
    );
}
