export const GET_USER_FETCH = 'GET_USER_FETCH';

export const GET_USER_SUCCESS = 'GET_USER_SUCCESS';
export const GET_USER_FAILURE = 'GET_USER_FAILURE';
export const DELETE_USER = 'DELETE_USER';
export const DELETE_USER_SUCCESS = 'DELETE_USER_SUCCESS';
export const GET_DATA_FETCH = 'GET_DATA_FETCH';
export const GET_DATA_SUCCESS = 'GET_DATA_SUCCESS';
export const GET_DATA_FAILURE = 'GET_DATA_FAILURE';

export const getUserFetch = (payload:any) => ({
    type: GET_USER_FETCH,
    payload: payload
});


export const deleteUser = (payload:any) => ({
    type : DELETE_USER,
    payload: payload
});


export const getDataFetch = (payload:any) => ({
    type: GET_DATA_FETCH,
    payload: payload
});







