// src/components/DateRangePicker.jsx
import { useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

const DateRangePicker = ({ dateRange, onChange }) => {
  const [state, setState] = useState([
    {
      startDate: dateRange.start,
      endDate: dateRange.end,
      key: 'selection'
    }
  ]);

  const handleChange = (item) => {
    setState([item.selection]);
    onChange({
      start: item.selection.startDate,
      end: item.selection.endDate
    });
  };

  return (
    <div className="w-full md:w-auto">
      <DateRange
        editableDateInputs={true}
        onChange={handleChange}
        moveRangeOnFirstSelection={false}
        ranges={state}
        className="border border-gray-600 rounded-lg"
      />
    </div>
  );
};

export default DateRangePicker;