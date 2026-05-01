import SubCategoriesOptions from "@/components/Options/SubCategoriesOptions";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const FormSubcategoria = ({ form, name, label, required, placeholder, items, options }) => {
    const watch = form.watch("categoriaId")
    useEffect(() => {
        form.setValue("subcategoriaId", "null")
    }, [watch])
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
                            <option value={"null"} disabled>{watch !== "null" ? placeholder : "Selecione uma Categoria"}</option>
                            {items ? items.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            )) : null}
                            <SubCategoriesOptions filter={watch} />
                        </select>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    </>)
};

export default FormSubcategoria;
