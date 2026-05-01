import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import defaultImage from "@/assets/images/default_img.png"
import { Input } from "@/components/ui/input";
import { BiSolidImageAdd } from "react-icons/bi";
import { imageReferenceHandler } from "@/utils/functions/formHandler";
import { useEffect, useState } from "react";
import InputMask from 'react-input-mask';
const Form_Dados = ({ form, setImagem }) => {
    const [imagemReference, setImageReference] = useState(null)
    const watch = form.watch("imagem")
    useEffect(() => {
        if (watch && watch.length) {
            setImageReference(watch)
        } else {
            setImageReference(null)
        }
    }, [watch])
    return (
        <>
            <div className="formImage">
                <img src={imagemReference ? imagemReference : defaultImage} className="rounded float-left img-fluid" alt="..." id="imagem-selecionada" />
            </div>
            <FormField
                control={form.control}
                name="imagem"
                type="file"
                render={({ field }) => (
                    <FormItem className="form-group">
                        <div className="flex flex-col h-full">
                            <FormMessage />
                            <FormLabel className="pl-2 text-md inputLabel mt-auto">
                                <BiSolidImageAdd /> Selecione uma imagem
                            </FormLabel>
                        </div>
                        <FormControl
                            onChange={(event) => {
                                imageReferenceHandler(event, setImageReference, setImagem);
                            }}
                            type="file"
                        >
                            <Input type="file" {...field} accept="image/*" className="custom-file-input" />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                    <FormItem className="form-group">
                        <div className="flex gap-2 items-center">
                            <FormLabel className="required pl-2 text-md">Nome</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl>
                            <Input className="mt-0" placeholder="Nome..." {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                    <FormItem className="form-group">
                        <div className="flex gap-2 items-center">
                            <FormLabel className="required pl-2 text-md">Cpf</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl>
                            <InputMask mask="999.999.999-99" maskChar={null} {...field}
                                onChange={field.onChange} >
                                {(inputProps) => <Input className="mt-0" placeholder="999.999.999-99" {...inputProps} />}
                            </InputMask>
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem className="form-group">
                        <div className="flex gap-2 items-center">
                            <FormLabel className="required pl-2 text-md">E-mail</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl>
                            <Input className="mt-0" placeholder="@email.com..." {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                    <FormItem className="form-group">
                        <div className="flex gap-2 items-center items-center">
                            <FormLabel className="required pl-2 text-md">Senha</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl>
                            <Input className="mt-0" placeholder="Senha..." {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />
        </>
    )

};

export default Form_Dados;
