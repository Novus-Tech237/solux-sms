"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { eventSchema, EventSchema } from "@/lib/formValidationSchemas";
import { createEvent, updateEvent } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const toDateTimeLocal = (value?: string | Date) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const EventForm = ({
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
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createEvent : updateEvent,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    formAction(formData);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Event has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new event" : "Update the event"}
      </h1>

      <div className="flex flex-col gap-6">

        {/* Row 1: Event Name */}
        <div className="flex flex-col gap-2 w-full">
          <InputField
            label="Event name"
            name="title"
            defaultValue={data?.title}
            register={register}
            error={errors?.title}
            className="md:w-full"
          />
          {data && (
            <InputField
              label="Id"
              name="id"
              defaultValue={String(data?.id)}
              register={register}
              error={errors?.id}
              hidden
            />
          )}
        </div>

        {/* Row 2: Dates & Recurrence */}
        <div className="flex flex-wrap gap-4 md:w-full">
          <InputField
            label="Start Date & Time"
            name="startTime"
            defaultValue={toDateTimeLocal(data?.startTime)}
            register={register}
            error={errors?.startTime}
            type="datetime-local"
          />
          <InputField
            label="End Date & Time"
            name="endTime"
            defaultValue={toDateTimeLocal(data?.endTime)}
            register={register}
            error={errors?.endTime}
            type="datetime-local"
          />
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Repetition Frequency</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              {...register("recurrence")}
              defaultValue={data?.recurrence || "NONE"}
            >
              <option value="NONE">Don&apos;t Repeat</option>
              <option value="DAILY">Every day</option>
              <option value="WEEKLY">Every week</option>
              <option value="MONTHLY">Every month</option>
              <option value="YEARLY">Every year</option>
            </select>
            {errors.recurrence?.message && (
              <p className="text-xs text-red-400">
                {errors.recurrence.message.toString()}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            {...register("description")}
            defaultValue={data?.description}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full min-h-[120px] resize-none"
            placeholder="Write event details..."
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">
              {errors.description.message.toString()}
            </p>
          )}
        </div>

      </div>

      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default EventForm;