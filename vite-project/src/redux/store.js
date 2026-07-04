import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import enrollmentReducer from './slices/enrollmentSlice';
import aiReducer from './slices/aiSlice';
import notificationReducer from './slices/notificationSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    enrollments: enrollmentReducer,
    ai: aiReducer,
    notifications: notificationReducer,
  },
});
