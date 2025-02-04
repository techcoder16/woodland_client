import {configureStore} from '@reduxjs/toolkit';
import summarySlice from './dataStore/dataSlice';
import { useDispatch } from 'react-redux';

// import userSlice from './dataStore/userSlice';

import vendorSlice from './dataStore/vendorSlice';


const rootStore  = configureStore({
    
    reducer:{
        vendors:vendorSlice,
        
    }

});

export type RootState = ReturnType<typeof rootStore.getState>;
export type AppDispatch = typeof rootStore.dispatch;

export default rootStore;