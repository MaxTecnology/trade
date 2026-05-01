const CheckBoxInput = ({ label, name, text, value, onChange }) => {
    return (
        <>
            {label ? <label>{label}</label> : null}
            <div className="flex items-center gap-2">
                <input type="checkbox" name={name ? name : ''} className="form-check-input w-auto" value={value} onChange={onChange} />
                <p>{text}</p>
            </div>
        </>
    )
};

export default CheckBoxInput;
