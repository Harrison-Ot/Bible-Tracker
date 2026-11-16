import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
export const readingDayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
export default function ReadingDays({
    id,
    value,
    onChange,
    disabled = false,
    error,
}: {
    id: string;
    value: number[];
    onChange: (day: number, checked: boolean) => void;
    disabled?: boolean;
    error?: string;
}) {
    return (
        <fieldset
            disabled={disabled}
            aria-describedby={error ? `${id}-error` : undefined}
        >
            <legend className="mb-3 text-sm font-medium">Reading days</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {readingDayNames.map((day, index) => (
                    <label
                        htmlFor={`${id}-${index}`}
                        key={day}
                        className="bg-card flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
                    >
                        <Checkbox
                            id={`${id}-${index}`}
                            checked={value.includes(index)}
                            onCheckedChange={(checked) =>
                                onChange(index, checked === true)
                            }
                        />
                        {day}
                    </label>
                ))}
            </div>
            <InputError id={`${id}-error`} message={error} className="mt-2" />
        </fieldset>
    );
}
