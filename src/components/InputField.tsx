import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
  className,
}: InputFieldProps) => {
  return (
    <div className={hidden ? "hidden" : `flex flex-col gap-2 w-full md:w-1/4 ${className ?? ""}`}>
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      <input
        type={type}
        {...register(name)}
        className="ring-[1.5px] ring-gray-300 dark:ring-gray-600 p-2 rounded-md text-sm w-full dark:bg-gray-700 dark:text-gray-100"
        {...inputProps}
        defaultValue={defaultValue}
      />
      {error?.message && (
        <p className="text-xs text-red-400 dark:text-red-300">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;