const PorcentagemInput = ({ reference, name, required }) => {

    return (
        <div className="relative">
            <input
                type="text"
                // value={value}
                style={{ paddingLeft: '20px' }}
                // onChange={handleChange}
                name={name}
                required={required}
                placeholder={reference ? 'RT$ 0.00' : '0.00'}
            />
            <p className="absolute top-[6px] left-[7px] text-lg">%</p>
        </div>
    );
};

export default PorcentagemInput;
