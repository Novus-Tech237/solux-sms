"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import FormModal from "./FormModal";
import Image from "next/image";

const localizer = momentLocalizer(moment);

const BigCalendar = ({
  data,
  role,
  currentUserId,
  relatedData,
}: {
  data: { id: number; title: string; start: Date | string; end: Date | string; originalData?: any }[];
  role?: string;
  currentUserId?: string;
  relatedData?: any;
}) => {
  const [view, setView] = useState<View>(Views.WEEK);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.originalData);
  };

  // Convert serialized strings back to Date objects
  const calendarEvents = data.map((event) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }));

  // Filter unique lessons that have uploaded materials
  const uniqueMaterials = Array.from(
    new Map(
      data
        .filter((event) => event.originalData?.pdfUrl || event.originalData?.videoUrl)
        .map((event) => [event.id, event])
    ).values()
  );

  const materials = uniqueMaterials
    .map((event) => ({
      id: event.id,
      title: event.title,
      day: event.originalData?.day,
      pdfUrl: event.originalData?.pdfUrl,
      videoUrl: event.originalData?.videoUrl,
      startTime: new Date(event.start),
    }))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Group materials by day
  const groupedMaterials = materials.reduce((acc: any, material) => {
    const day = material.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(material);
    return acc;
  }, {});

  const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  // Custom styles for events based on course
  const eventPropGetter = (event: any) => {
    // Cohesive palette: light background, matching border, dark text
    const colors = [
      { bg: "#E0F2FE", border: "#38BDF8", text: "#0369A1" }, // Sky
      { bg: "#DCFCE7", border: "#4ADE80", text: "#15803D" }, // Green
      { bg: "#F3E8FF", border: "#C084FC", text: "#7E22CE" }, // Purple
      { bg: "#FEF3C7", border: "#FBBF24", text: "#B45309" }, // Amber
      { bg: "#FFE4E6", border: "#FB7185", text: "#BE123C" }, // Rose
      { bg: "#E0E7FF", border: "#818CF8", text: "#4338CA" }, // Indigo
      { bg: "#CCFBF1", border: "#2DD4BF", text: "#0F766E" }, // Teal
      { bg: "#FFEDD5", border: "#FB923C", text: "#C2410C" }, // Orange
      { bg: "#FCE7F3", border: "#F472B6", text: "#BE185D" }, // Pink
      { bg: "#F5F3FF", border: "#A78BFA", text: "#6D28D9" }, // Violet
      { bg: "#ECFDF5", border: "#34D399", text: "#047857" }, // Emerald
      { bg: "#FFF7ED", border: "#FDBA74", text: "#9A3412" }, // Orange-2
    ];

    // Consistently pick a color based on courseId for stability
    // Fallback to hashing the title if courseId is missing
    const courseId = event.originalData?.courseId;
    const title = event.originalData?.course?.name || event.title;
    
    let colorIndex = 0;
    if (courseId) {
      colorIndex = courseId % colors.length;
    } else {
      let hash = 0;
      for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
      }
      colorIndex = Math.abs(hash) % colors.length;
    }
    
    const color = colors[colorIndex];

    return {
      style: {
        backgroundColor: color.bg,
        borderLeft: `5px solid ${color.border}`,
        color: color.text,
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "600",
        padding: "4px 8px",
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
    };
  };

  return (
    <div className="flex flex-col gap-8 h-full min-h-[800px]">
      <div className="h-[600px] relative">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          views={["week", "day"]}
          view={view}
          style={{ height: "100%" }}
          onView={handleOnChangeView}
          onSelectEvent={handleSelectEvent}
          min={new Date(0, 0, 0, 8, 0, 0)}
          max={new Date(0, 0, 0, 20, 0, 0)}
          eventPropGetter={eventPropGetter}
        />
        {selectedEvent && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-md max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {role === "teacher" && selectedEvent.teacherId === currentUserId 
                    ? "Upload Lesson Content" 
                    : role === "admin" 
                    ? "Update Lesson" 
                    : "Lesson Materials"}
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-black text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Show materials in the modal regardless of role for quick access */}
              {(selectedEvent.pdfUrl || selectedEvent.videoUrl) ? (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">Available Materials</h3>
                  <div className="flex flex-wrap gap-4">
                    {selectedEvent.pdfUrl && (
                      <a
                        href={selectedEvent.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors font-medium text-sm"
                      >
                        <Image src="/assignment.png" alt="" width={18} height={18} />
                        View Lesson PDF
                      </a>
                    )}
                    {selectedEvent.videoUrl && (
                      <a
                        href={selectedEvent.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-md hover:bg-purple-100 transition-colors font-medium text-sm"
                      >
                        <Image src="/view.png" alt="" width={18} height={18} />
                        Watch Lesson Video
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                role === "student" && (
                  <div className="mb-8 p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Image src="/lesson.png" alt="" width={48} height={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-gray-400 text-sm">No materials have been uploaded for this lesson yet.</p>
                  </div>
                )
              )}

              {/* Only show FormModal if the user has permission to update */}
              {((role === "admin") || (role === "teacher" && selectedEvent.teacherId === currentUserId)) && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-6 uppercase tracking-wider">
                    {role === "admin" ? "Administrative Actions" : "Teacher Upload Form"}
                  </h3>
                  <FormModal
                    table="lesson"
                    type="update"
                    data={selectedEvent}
                    id={selectedEvent.id}
                    relatedData={relatedData}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Materials Section */}
      <div className="bg-white p-6 rounded-md shadow-sm">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Image src="/lesson.png" alt="" width={24} height={24} />
          Lesson Materials
        </h2>
        
        {materials.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No materials uploaded yet for this week.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayOrder.map((day) => {
              if (!groupedMaterials[day]) return null;
              return (
                <div key={day} className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-gray-400 border-b pb-1 uppercase tracking-wider">
                    {day}
                  </h3>
                  {groupedMaterials[day].map((item: any) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                      <p className="font-medium text-sm text-gray-800 mb-3">{item.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.pdfUrl && (
                          <a
                            href={item.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <Image src="/assignment.png" alt="" width={14} height={14} className="opacity-70" />
                            PDF
                          </a>
                        )}
                        {item.videoUrl && (
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-600 px-2.5 py-1.5 rounded-md hover:bg-purple-100 transition-colors"
                          >
                            <Image src="/view.png" alt="" width={14} height={14} className="opacity-70" />
                            Video
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BigCalendar;
