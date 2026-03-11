"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { programSchema, ProgramSchema } from "@/lib/formValidationSchemas";
import { createProgram, updateProgram } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ProgramForm = ({
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProgramSchema>({
    resolver: zodResolver(programSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createProgram : updateProgram,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(
        `Program has been ${type === "create" ? "created" : "updated"}!`
      );
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new program" : "Update the program"}
      </h1>

      <div className="flex flex-wrap gap-4 w-full">
        <InputField
          label="Program name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
          className="flex-1"
        />
        <InputField
          label="Semester"
          name="semester"
          defaultValue={data?.semester}
          register={register}
          error={errors?.semester}
          inputProps={{ placeholder: "e.g. Fall 2024" }}
          className="flex-1"
        />
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
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            {...register("description")}
            defaultValue={data?.description || ""}
            placeholder="Brief description of the program"
            className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full dark:bg-gray-700 dark:text-gray-100"
            rows={3}
          />
          {errors?.description?.message && (
            <p className="text-xs text-red-400 dark:text-red-300">
              {errors.description.message.toString()}
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

export default ProgramForm;