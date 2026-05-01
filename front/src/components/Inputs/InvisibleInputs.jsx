const InvisibleInputs = () => {
    return <>
        <input readOnly style={{ display: "none" }} type="number" name="reputacao" value={0} />
        {/* <input readOnly style={{ display: "none" }} type="number" name="saldoPermuta" value={0} /> */}
        <input readOnly style={{ display: "none" }} type="text" name="tipoDeMoeda" value="BRL" />
        <input readOnly style={{ display: "none" }} type="text" name="statusConta" value={true} />
    </>
};

export default InvisibleInputs;
