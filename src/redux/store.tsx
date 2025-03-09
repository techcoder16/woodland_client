import {configureStore} from '@reduxjs/toolkit';

import { useDispatch } from 'react-redux';

// import userSlice from './dataStore/userSlice';

import vendorSlice from './dataStore/vendorSlice';
import propertySlice from './dataStore/propertySlice';

const rootStore  = configureStore({
    
    reducer:{
        vendors:vendorSlice,
        properties:propertySlice,
        
    }

});

export type RootState = ReturnType<typeof rootStore.getState>;
export type AppDispatch = typeof rootStore.dispatch;

export default rootStore;