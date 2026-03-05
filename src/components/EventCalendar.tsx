"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, setValue] = useState<Value>(new Date());

  const router = useRouter();

  const handleChange = (next: Value) => {
    setValue(next);
    if (next instanceof Date) {
      router.push(`?date=${next.toISOString()}`);
    }
  };

  return <Calendar onChange={handleChange} value={value} />;
};

export default EventCalendar;
