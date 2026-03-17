"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { LessonSchema, lessonSchema } from "@/lib/formValidationSchemas";
import { createLesson, updateLesson } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CloudinaryUploader from "../CloudinaryUploader";

const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const LessonForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
  });

  const selectedCourseId = watch("courseId");

  const { subjects = [], classes = [], teachers = [], currentUserId, role } = relatedData || {};

  const [filteredTeachers, setFilteredTeachers] = useState(teachers);

  useEffect(() => {
    if (selectedCourseId && relatedData?.courses) {
      const course = relatedData.courses.find((c: any) => c.id === Number(selectedCourseId));
      if (course?.teacherId) {
        setValue("teacherId", course.teacherId);
      }
    }
  }, [selectedCourseId, relatedData?.courses, setValue]);

  // Handle dynamic teacher list based on selected course's program if needed
  // But since relatedData already provides the initial list (filtered by program in program view),
  // and since the user can select ANY course in the admin view, we'll keep the list as is but auto-select.
  useEffect(() => {
    if (teachers) {
      setFilteredTeachers(teachers);
    }
  }, [teachers]);

  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string>(data?.pdfUrl || "");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>(data?.videoUrl || "");

  const [state, formAction] = useFormState(
    type === "create" ? createLesson : updateLesson,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    let finalName = formData.name;
    if (type === "create" && !finalName) {
      const selectedCourse = relatedData?.courses?.find(
        (c: any) => c.id === Number(formData.courseId)
      );
      finalName = selectedCourse ? `${selectedCourse.name} Lesson` : "Lesson";
    }

    formAction({
      ...formData,
      name: finalName,
      pdfUrl: uploadedPdfUrl || data?.pdfUrl || "",
      videoUrl: uploadedVideoUrl || data?.videoUrl || "",
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new lesson" : role === "teacher" ? "Upload Lesson Content" : "Update the lesson"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        {role === "admin" ? (
          <>
            {type === "update" && (
              <InputField
                label="Lesson name"
                name="name"
                defaultValue={data?.name}
                register={register}
                error={errors?.name}
              />
            )}
            <div className="flex flex-col gap-2 w-full md:w-1/4">
              <label className="text-xs text-gray-500">Day</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("day")}
                defaultValue={data?.day || "MONDAY"}
              >
                {days.map((day) => (
                  <option value={day} key={day}>
                    {day}
                  </option>
                ))}
              </select>
              {errors.day?.message && (
                <p className="text-xs text-red-400">{errors.day.message.toString()}</p>
              )}
            </div>
            <InputField
              label="Start Time"
              name="startTime"
              defaultValue={data?.startTime ? new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ""}
              register={register}
              error={errors?.startTime}
              type="time"
            />
            <InputField
              label="End Time"
              name="endTime"
              defaultValue={data?.endTime ? new Date(data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ""}
              register={register}
              error={errors?.endTime}
              type="time"
            />
          </>
        ) : (
          <>
            <input type="hidden" {...register("name")} value={data?.name || "Lesson"} />
            <input type="hidden" {...register("day")} value={data?.day || "MONDAY"} />
            <input type="hidden" {...register("startTime")} value={data?.startTime ? new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ""} />
            <input type="hidden" {...register("endTime")} value={data?.endTime ? new Date(data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ""} />
            <div className="w-full">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Lesson:</strong> {data?.name}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Time:</strong> {data?.day} {data?.startTime ? new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""} - {data?.endTime ? new Date(data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
              </p>
            </div>
          </>
        )}
        
        <input type="hidden" {...register("pdfUrl")} value={uploadedPdfUrl || data?.pdfUrl || ""} />
        <input type="hidden" {...register("videoUrl")} value={uploadedVideoUrl || data?.videoUrl || ""} />
        
        {/* ONLY SHOW PDF/VIDEO UPLOADS DURING UPDATE */}
        {type === "update" && (
          <>
            <div className="flex flex-col gap-2 w-full md:w-1/4">
              <label className="text-xs text-gray-500">Lesson PDF</label>
              <div className="flex flex-col gap-2">
                <CloudinaryUploader
                  resourceType="raw"
                  folder="school/lessons"
                  preset={uploadPreset}
                  onUpload={(url) => {
                    setUploadedPdfUrl(url);
                    setValue("pdfUrl", url, { shouldValidate: true });
                  }}
                >
                  <div className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer border p-2 rounded-md hover:bg-gray-50">
                    <Image src="/upload.png" alt="" width={24} height={24} />
                    <span>{uploadedPdfUrl ? "Change PDF" : "Upload lesson PDF"}</span>
                  </div>
                </CloudinaryUploader>
                
                {uploadedPdfUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <a href={uploadedPdfUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">
                      View Current
                    </a>
                    <button 
                      type="button" 
                      onClick={() => { setUploadedPdfUrl(""); setValue("pdfUrl", ""); }}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {errors.pdfUrl?.message && (
                <p className="text-xs text-red-400">{errors.pdfUrl.message.toString()}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full md:w-1/4">
              <label className="text-xs text-gray-500">Lesson Video (optional)</label>
              <div className="flex flex-col gap-2">
                <CloudinaryUploader
                  resourceType="video"
                  folder="school/lessons"
                  preset={uploadPreset}
                  acceptedTypes={["video/mp4", "video/webm", "video/ogg", "video/quicktime"]}
                  onUpload={(url) => {
                    setUploadedVideoUrl(url);
                    setValue("videoUrl", url, { shouldValidate: true });
                  }}
                >
                  <div className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer border p-2 rounded-md hover:bg-gray-50">
                    <Image src="/upload.png" alt="" width={24} height={24} />
                    <span>{uploadedVideoUrl ? "Change Video" : "Upload lesson video"}</span>
                  </div>
                </CloudinaryUploader>

                {uploadedVideoUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <a href={uploadedVideoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-500 hover:underline">
                      Watch Current
                    </a>
                    <button 
                      type="button" 
                      onClick={() => { setUploadedVideoUrl(""); setValue("videoUrl", ""); }}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {errors.videoUrl?.message && (
                <p className="text-xs text-red-400">{errors.videoUrl.message.toString()}</p>
              )}
            </div>
          </>
        )}

        {data && (
          <InputField
            label="Id"
            name="id"
            defaultValue={data?.id}
            register={register}
            error={errors?.id}
            hidden
          />
        )}

        {role === "admin" ? (
          <>
            <div className="flex flex-col gap-2 w-full md:w-1/4">
              <label className="text-xs text-gray-500">Course</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("courseId")}
                defaultValue={data?.courseId}
              >
                {(relatedData?.courses || []).map((course: { id: number; name: string }) => (
                  <option value={course.id} key={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              {errors.courseId?.message && (
                <p className="text-xs text-red-400">{errors.courseId.message.toString()}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full md:w-1/4">
              <label className="text-xs text-gray-500">Teacher</label>
              <select
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                {...register("teacherId")}
                defaultValue={data?.teacherId}
              >
                {filteredTeachers.map(
                  (teacher: { id: string; name: string; surname: string }) => (
                    <option value={teacher.id} key={teacher.id}>
                      {teacher.name} {teacher.surname}
                    </option>
                  )
                )}
              </select>
              {errors.teacherId?.message && (
                <p className="text-xs text-red-400">{errors.teacherId.message.toString()}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <input type="hidden" {...register("courseId")} value={data?.courseId} />
            <input type="hidden" {...register("teacherId")} value={currentUserId} />
          </>
        )}
      </div>

      {state.error && <span className="text-red-500">Something went wrong!</span>}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : role === "teacher" ? "Upload" : "Update"}
      </button>
    </form>
  );
};

export default LessonForm;
