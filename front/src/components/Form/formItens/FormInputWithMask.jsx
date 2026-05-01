import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import InputMask from 'react-input-mask';
const FormInputWithMask = ({ form, name, label, placeholder, required, mask, divClassName }) => {
    return (<>
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className={cn("form-group", divClassName && divClassName)}>
                    <div className="flex gap-2 items-center">
                        <FormLabel className={cn("pl-2 text-md", required && "required")}>
                            {label}
                        </FormLabel>
                        <FormMessage />
                    </div>
                    <FormControl>
                        <InputMask mask={mask} maskChar={null} {...field} >
                            {(inputProps) => <Input className="mt-0" placeholder={mask} {...inputProps} />}
                        </InputMask>
                    </FormControl>
                </FormItem>
            )}
        />
    </>);
};

export default FormInputWithMask;
