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
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";

const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

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
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "school";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LessonSchema>({
    resolver: zodResolver(lessonSchema),
  });

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
    formAction({
      ...formData,
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

  const { subjects = [], classes = [], teachers = [], currentUserId, role } = relatedData || {};

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new lesson" : "Update the lesson"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Lesson name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
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
          defaultValue={data?.startTime}
          register={register}
          error={errors?.startTime}
          type="datetime-local"
        />
        <InputField
          label="End Time"
          name="endTime"
          defaultValue={data?.endTime}
          register={register}
          error={errors?.endTime}
          type="datetime-local"
        />
        <input type="hidden" {...register("pdfUrl")} value={uploadedPdfUrl || data?.pdfUrl || ""} />
        <input type="hidden" {...register("videoUrl")} value={uploadedVideoUrl || data?.videoUrl || ""} />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Lesson PDF</label>
          <CldUploadWidget
            uploadPreset={uploadPreset}
            options={{
              resourceType: "raw",
              maxFiles: 1,
              clientAllowedFormats: ["pdf"],
              folder: "school/lessons",
            }}
            onSuccess={(result: any, { widget }) => {
              const secureUrl = result?.info?.secure_url as string;
              if (secureUrl) {
                setUploadedPdfUrl(secureUrl);
                setValue("pdfUrl", secureUrl, { shouldValidate: true });
              }
              widget.close();
            }}
          >
            {({ open }) => (
              <div
                className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                onClick={() => open()}
              >
                <Image src="/upload.png" alt="" width={24} height={24} />
                <span>{uploadedPdfUrl || data?.pdfUrl ? "PDF uploaded" : "Upload lesson PDF"}</span>
              </div>
            )}
          </CldUploadWidget>
          {errors.pdfUrl?.message && (
            <p className="text-xs text-red-400">{errors.pdfUrl.message.toString()}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Lesson Video (optional)</label>
          <CldUploadWidget
            uploadPreset={uploadPreset}
            options={{
              resourceType: "video",
              maxFiles: 1,
              folder: "school/lessons",
            }}
            onSuccess={(result: any, { widget }) => {
              const secureUrl = result?.info?.secure_url as string;
              if (secureUrl) {
                setUploadedVideoUrl(secureUrl);
                setValue("videoUrl", secureUrl, { shouldValidate: true });
              }
              widget.close();
            }}
          >
            {({ open }) => (
              <div
                className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                onClick={() => open()}
              >
                <Image src="/upload.png" alt="" width={24} height={24} />
                <span>{uploadedVideoUrl || data?.videoUrl ? "Video uploaded" : "Upload lesson video"}</span>
              </div>
            )}
          </CldUploadWidget>
          {errors.videoUrl?.message && (
            <p className="text-xs text-red-400">{errors.videoUrl.message.toString()}</p>
          )}
        </div>

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

        {role === "admin" ? (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Teacher</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("teacherId")}
              defaultValue={data?.teacherId}
            >
              {teachers.map(
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
        ) : (
          <input type="hidden" {...register("teacherId")} value={currentUserId} />
        )}
      </div>

      {state.error && <span className="text-red-500">Something went wrong!</span>}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default LessonForm;
