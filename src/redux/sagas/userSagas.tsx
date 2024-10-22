import { takeEvery, call, put } from 'redux-saga/effects';
import { GET_DATA_FETCH, GET_DATA_SUCCESS, GET_DATA_FAILURE } from '../action';
import getApi from '../../helper/getApi';
import deleteApi from '../../helper/deleteApi';
import { DEFAULT_COOKIE_GETTER } from '../../helper/Cookie';

// Helper function for fetching summary data
async function summaryFetch(query:any) {
    try {
        const activationToken = await DEFAULT_COOKIE_GETTER("access_token");
        const headers = {
            "Authorization": 'Bearer ' + activationToken,
            "Accept": "*/*",
            "Access-Control-Allow-Origin": true
        };

        const data = await getApi('data/summary', JSON.stringify(query.payload), headers);
        return data;
    } catch (error) {
        console.error("Error in summaryFetch: ", error);
        throw error;
    }
}


// Saga to handle data summary fetch
function* workDataSummaryFetch(payload:any):any {
    try {
      
        const data = yield call(summaryFetch, payload);
        
        yield put({ type: GET_DATA_SUCCESS, data });
        
    } catch (error) {
        console.error("Error in workDataSummaryFetch: ", error);
        yield put({ type: GET_DATA_FAILURE, error });
    }
}

// Root saga
function* userSaga() {
    yield takeEvery(GET_DATA_FETCH, workDataSummaryFetch);
}

export default userSaga;
