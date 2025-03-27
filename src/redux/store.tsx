import {configureStore} from '@reduxjs/toolkit';

import { useDispatch } from 'react-redux';

// import userSlice from './dataStore/userSlice';

import vendorSlice from './dataStore/vendorSlice';
import propertySlice from './dataStore/propertySlice';
import tenantSlice from './dataStore/tenantSlice';
import propertyParty from './dataStore/partySlice';
import RentSlice from './dataStore/rentSlice';
import SupplierSlice from './dataStore/supplierSlice';
import managementAgreementSlice from './dataStore/managementAgreementSlice';
import tenancyAgreementSlice from './dataStore/tenancyAgreementSlice';
import transactionSlice from './dataStore/transactionSlice'
const rootStore  = configureStore({
    
    reducer:{
        vendors:vendorSlice,
        properties:propertySlice,
        tenants:tenantSlice,
        parties:propertyParty,
        selectedVendor:vendorSlice,
        rent:RentSlice,
        supplierData:SupplierSlice,
        managementAgreement:managementAgreementSlice,
        tenancyAgreement:tenancyAgreementSlice,
        transaction:transactionSlice
    }

});

export type RootState = ReturnType<typeof rootStore.getState>;
export type AppDispatch = typeof rootStore.dispatch;

export default rootStore;