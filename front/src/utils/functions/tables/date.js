export const filterStart = (row, columnId, filterStatuses) => {
    const cellDate = Date.parse(row.getValue(columnId));
    const filterDate = Date.parse(filterStatuses);
    if (cellDate >= filterDate) {
        return true;
    }
    return false
};
export const filterEnd = (row, columnId, filterStatuses) => {
    const cellDate = Date.parse(row.getValue(columnId));
    const filterDate = Date.parse(filterStatuses);
    if (cellDate >= filterDate) {
        return false;
    }
    return true
};