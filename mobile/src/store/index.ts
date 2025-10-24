/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';

// Placeholder reducers - would be implemented based on app requirements
const placeholderReducer = (state = {}, action: any) => state;

export const store = configureStore({
  reducer: {
    user: placeholderReducer,
    launches: placeholderReducer,
    portfolio: placeholderReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
