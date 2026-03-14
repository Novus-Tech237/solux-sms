"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { examSchema, ExamSchema } from "@/lib/formValidationSchemas";
import { createExam, updateExam } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CloudinaryUploader from "../CloudinaryUploader";

const ExamForm = ({
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
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
  });

  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string>(data?.pdfUrl || "");

  // AFTER REACT 19 IT'LL BE USEACTIONSTATE

  const [state, formAction] = useFormState(
    type === "create" ? createExam : updateExam,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction({
      ...formData,
      pdfUrl: uploadedPdfUrl || data?.pdfUrl || "",
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Exam has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const { courses } = relatedData;

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new exam" : "Update the exam"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Exam title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />
        <InputField
          label="Start Date"
          name="startTime"
          defaultValue={data?.startTime}
          register={register}
          error={errors?.startTime}
          type="datetime-local"
        />
        <InputField
          label="End Date"
          name="endTime"
          defaultValue={data?.endTime}
          register={register}
          error={errors?.endTime}
          type="datetime-local"
        />
        <InputField
          label="Max Submissions (optional)"
          name="maxSubmissions"
          defaultValue={data?.maxSubmissions}
          register={register}
          error={errors?.maxSubmissions}
          type="number"
        />
        <input type="hidden" {...register("pdfUrl")} value={uploadedPdfUrl || data?.pdfUrl || ""} />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Exam PDF</label>
          <CloudinaryUploader
            resourceType="raw"
            folder="school/exams"
            preset={uploadPreset}
            onUpload={(url) => {
              setUploadedPdfUrl(url);
              setValue("pdfUrl", url, { shouldValidate: true });
            }}
          >
            <div className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer">
              <Image src="/upload.png" alt="" width={24} height={24} />
              <span>{uploadedPdfUrl || data?.pdfUrl ? "PDF uploaded" : "Upload exam PDF"}</span>
            </div>
          </CloudinaryUploader>
          {errors.pdfUrl?.message && (
            <p className="text-xs text-red-400">{errors.pdfUrl.message.toString()}</p>
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
            {courses.map((course: { id: number; name: string }) => (
              <option value={course.id} key={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          {errors.courseId?.message && (
            <p className="text-xs text-red-400">
              {errors.courseId.message.toString()}
            </p>
          )}
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ExamForm;
