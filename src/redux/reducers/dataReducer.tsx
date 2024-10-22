import {  GET_DATA_SUCCESS } from "../action";
import { GET_DATA_FETCH,GET_DATA_FAILURE } from "../action";

const SummaryDataReducer = (state:any = {},action:any) =>
{
    switch (action.type) {
        case GET_DATA_FETCH:
            return { ...state, loading: true, error: null };
        case GET_DATA_SUCCESS:
            return { ...state, loading: false, data: action.data };
        case GET_DATA_FAILURE:
            return { ...state, loading: false, error: action.error };
        default:
            return state;
    }
}
export default SummaryDataReducer;