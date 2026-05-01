import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const handleInputChange = (event) => {
    const inputValue = event;
    // Remove caracteres não numéricos
    const numericValue = inputValue.replace(/[^0-9]/g, '');

    // Converte para número
    const numericAmount = parseFloat(numericValue);

    // Verifica se o valor é zero ou vazio
    const isZeroOrEmpty = numericAmount === 0 || isNaN(numericAmount);

    // Formata o valor para o formato de moeda brasileira (Real) com o símbolo "RT$"
    const formattedValue = isZeroOrEmpty
        ? new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(0).replace('R$', 'RT$')
        : new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        })
            .formatToParts(numericAmount / 100)
            .map((part) => (part.type === 'currency' ? 'RT$' : part.value)) // Substitui "R$" por "RT$"
            .join('');

    return formattedValue; // Retorna o valor formatado com "RT$"
};


const FormInputMoney = ({ form, name, label, placeholder, required, type, className, divClassName, disabled }) => {
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
                                form.setValue(name, handleInputChange(value))
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
