import {configureStore} from '@reduxjs/toolkit';
import summarySlice from './dataStore/dataSlice';
import { useDispatch } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import detailSlice from './dataStore/detailSlice';
import callsSlice from './dataStore/callsSlice';
import userSlice from './dataStore/userSlice';
import teamSlice from './dataStore/teamSlice';


const rootStore  = configureStore({
    
    reducer:{
        summary:summarySlice,
        details:detailSlice,
        calls:callsSlice,
        users:userSlice,
        teams:teamSlice
    }

});

export type RootState = ReturnType<typeof rootStore.getState>;
export type AppDispatch = typeof rootStore.dispatch;

export default rootStore;