import api from './axios';

export const loginStaff = async (institutionId, email, password) => {
  const response = await api.post('/auth/staff/login', { institution_id: institutionId, email, password });
  localStorage.setItem('access_token', response.data.access_token);
  return response.data;
};

export const loginStudent = async (institutionId, email, deviceToken) => {
  const response = await api.post('/auth/student/login', { institution_id: institutionId, email, device_token: deviceToken });
  localStorage.setItem('access_token', response.data.access_token);
  return response.data;
};

export const loginStudentPassword = async (institutionId, email, password) => {
  const response = await api.post('/auth/student/password-login', { institution_id: institutionId, email, password });
  localStorage.setItem('access_token', response.data.access_token);
  return response.data;
};

export const loginTeacher = async (institutionId, email, password) => {
  const response = await api.post('/auth/teacher/login', { institution_id: institutionId, email, password });
  localStorage.setItem('access_token', response.data.access_token);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
};
