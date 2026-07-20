import api from './axios';

export const listControlUsers = () => api.get('/admin/list');
export const appointMaster = (payload) => api.post('/admin/appoint-master', payload);
export const appointAdmin = (payload) => api.post('/admin/appoint-admin', payload);
export const appointHOD = (payload) => api.post('/admin/appoint-hod', payload);
export const appointStaff = (payload) => api.post('/admin/appoint-staff', payload);
export const deleteControlUser = (userId) => api.delete(`/admin/control-user/${userId}`);
