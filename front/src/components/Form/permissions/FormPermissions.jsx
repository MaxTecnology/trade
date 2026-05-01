import PermissionConta from "./PermissionConta";
import PermissionsOperacional from "./PermissionsOperacional";
import PermissionFinanceiro from "./PermissionFinanceiro";
import FormCheckBox from "../FormCheckBox";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const FormPermissions = ({ form }) => {
    return (
        <div className="w-full flex flex-col">
            <FormCheckBox label={"Selecionar Todas"} form={form} name={"todos"} principal />
            <div className="pl-8">
                <Accordion type="multiple">
                    <AccordionItem value="item-1">
                        <div className="flex">
                            <div className="flex items-center justify-center">
                                <FormCheckBox label={""} form={form} name={"conta"} accordion father={"todos"} />
                            </div>
                            <div className="w-full">
                                <AccordionTrigger>Conta</AccordionTrigger>
                            </div>
                        </div>
                        <AccordionContent>
                            <PermissionConta form={form} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <div className="flex">
                            <div className="flex items-center justify-center">
                                <FormCheckBox label={""} form={form} name={"financeiro"} father={"todos"} accordion />
                            </div>
                            <div className="w-full">
                                <AccordionTrigger>Financeiro</AccordionTrigger>
                            </div>
                        </div>
                        <AccordionContent>
                            <PermissionFinanceiro form={form} />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <div className="flex">
                            <div className="flex items-center justify-center">
                                <FormCheckBox label={""} form={form} name={"operacional"} father={"todos"} accordion />
                            </div>
                            <div className="w-full">
                                <AccordionTrigger>Operacional</AccordionTrigger>
                            </div>
                        </div>
                        <AccordionContent>
                            <PermissionsOperacional form={form} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div >
    )
};

export default FormPermissions;
