"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { updateAllProgramSemesters } from "@/lib/actions";
import {
  bulkProgramSemesterSchema,
  BulkProgramSemesterSchema,
} from "@/lib/formValidationSchemas";
import InputField from "./InputField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

const BulkProgramSemesterButton = ({
  programCount,
}: {
  programCount: number;
}) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BulkProgramSemesterSchema>({
    resolver: zodResolver(bulkProgramSemesterSchema),
  });

  const [state, formAction] = useFormState(updateAllProgramSemesters, {
    success: false,
    error: false,
    message: "",
  });

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  useEffect(() => {
    if (state.success) {
      toast("All program semesters updated successfully!");
      setOpen(false);
      reset();
      router.refresh();
    } else if (state.error && state.message) {
      toast.error(state.message);
    }
  }, [state, router, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="rounded-md bg-lamaSky px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={programCount === 0}
        >
          Update All Semesters
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Update all program semesters</DialogTitle>
        <DialogDescription>
          This will set the same semester for every existing program.
        </DialogDescription>

        <form className="mt-4 flex flex-col gap-6" onSubmit={onSubmit}>
          <InputField
            label="Semester"
            name="semester"
            register={register}
            error={errors.semester}
            inputProps={{ placeholder: "e.g. Fall 2024" }}
            className="md:w-full"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white"
            >
              Save All
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkProgramSemesterButton;