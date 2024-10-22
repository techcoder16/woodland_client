import { combineReducers, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";
import { configureStore, Tuple } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger';
import userSaga from './sagas/userSagas';
import UserDataReducer from "./reducers/userReducer";
import SummaryDataReducer from "./reducers/dataReducer";
const sagaMiddleware = createSagaMiddleware();
const rootReducer = combineReducers({ 
 
    SummaryDataReducer

});
const logger = createLogger();


 export const store = configureStore({
    reducer: rootReducer,
    middleware: () => new Tuple(sagaMiddleware, logger),
  })
  sagaMiddleware.run(userSaga);
  