import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const handleInputChange = (event, currency) => {
    const inputValue = event;
    // Remove caracteres não numéricos
    const numericValue = inputValue.replace(/[^0-9]/g, '');

    // Converte para número
    const numericAmount = parseFloat(numericValue);

    // Verifica se o valor é zero ou vazio
    const isZeroOrEmpty = numericAmount === 0 || isNaN(numericAmount);

    // Formata o valor para o formato de moeda brasileira (Real) com o símbolo da moeda passada
    const formattedValue = isZeroOrEmpty
        ? new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(0).replace('R$', currency)
        : new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        })
            .formatToParts(numericAmount / 100)
            .map((part) => (part.type === 'currency' ? currency : part.value))
            .join('');

    return formattedValue;
};


const FormInputMoney = ({ form, name, label, placeholder, required, type, className, divClassName, disabled, currency = 'RT$' }) => {
    return (<>
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className={cn("form-group", divClassName && divClassName)}>
                    <div className="flex gap-2 items-center">
                        <FormLabel className={cn("pl-2 text-md", required && "required", className && className)}>{label}</FormLabel>
                        <FormMessage />
                    </div>
                    <FormControl
                        onChange={
                            (e) => {
                                const { value } = e.target
                                form.setValue(name, handleInputChange(value, currency))
                            }
                        }
                    >
                        <Input disabled={disabled} type="text" className="mt-0" placeholder={placeholder} {...field} />
                    </FormControl>
                </FormItem>
            )}
        />
    </>);
};

export default FormInputMoney;
