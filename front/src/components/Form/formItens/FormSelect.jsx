import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const FormSelect = ({ form, name, label, required, placeholder, items, options, empty }) => {
    return (<>
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="form-group position-relative">
                    <div className="flex gap-2 items-center">
                        <FormLabel className={cn("pl-2 text-md", required && "required")}>{label}</FormLabel>
                        <FormMessage />
                    </div>
                    <FormControl>
                        <select
                            {...field}
                            className="!mt-0"
                        >
                            <option value={empty ? "null" : ""} disabled>{placeholder}</option>
                            {items ? items.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            )) : null}
                            {options}
                        </select>
                    </FormControl>
                </FormItem>
            )}
        />
    </>)
};

export default FormSelect;
