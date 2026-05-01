import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FormInput = ({ form, name, label, placeholder, required, type, className, divClassName, disabled, variant }) => {
    return (<>
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className={cn("form-group", divClassName && divClassName, type === "hidden" && "hidden")}>
                    <div className="flex gap-2 items-center">
                        <FormLabel
                            className={cn("pl-2 text-md", required && "required", className && className)}
                        >
                            {label}
                        </FormLabel>
                        {variant === "bottom" ? null : <FormMessage />}
                    </div>
                    {variant === "bottom" ? <FormMessage className="text-left" /> : null}
                    <FormControl>
                        <Input disabled={disabled} type={type ? type : "text"} className="mt-0" placeholder={placeholder} {...field} />
                    </FormControl>

                </FormItem>
            )}
        />
    </>);
};

export default FormInput;
