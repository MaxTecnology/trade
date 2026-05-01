import { cn } from "@/lib/utils";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { useWatch } from "react-hook-form";
import { useEffect } from "react";

const FormCheckBox = ({ form, label, name, accordion, principal, father }) => {
    const fatherValue = useWatch({ control: form.control, name: father });

    useEffect(() => {
        if (fatherValue === true) {
            return form.setValue(name, true);
        }
        if (fatherValue === false) {
            return form.setValue(name, false);
        }
    }, [fatherValue, name, form]);

    return (
        <li className="flex items-center max-h-6">
            <FormField
                control={form.control}
                name={name}
                render={({ field }) => (
                    <FormItem className="form-group">
                        <div className={cn("flex items-center gap-1 text-center text-sm", accordion && "-mb-2")}>
                            <FormControl onClick={() => form.setValue(name, !field.value)}>
                                <input className="h-1 w-1" checked={field.value} type="checkbox" {...field} />
                            </FormControl>
                            <div>
                                <FormLabel className={cn("pl-2 text-md", principal && "text-base")}>{label}</FormLabel>
                            </div>
                        </div>
                    </FormItem>
                )}
            />
        </li>
    )
};

export default FormCheckBox;
