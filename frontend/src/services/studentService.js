import axios from 'axios';
import authService from './authService';

class StudentService {
  /**
   * Add a new student
   */
  async addStudent(studentData) {
    const headers = await authService.getAuthHeader();
    const response = await axios.post('/api/students', studentData, { headers });
    return response.data;
  }

  /**
   * Get a specific student
   */
  async getStudent(studentId) {
    const headers = await authService.getAuthHeader();
    const response = await axios.get(`/api/students/${studentId}`, { headers });
    return response.data;
  }

  /**
   * Update a student
   */
  async updateStudent(studentId, updates) {
    const headers = await authService.getAuthHeader();
    const response = await axios.put(`/api/students/${studentId}`, updates, { headers });
    return response.data;
  }

  /**
   * Delete a student
   */
  async deleteStudent(studentId) {
    const headers = await authService.getAuthHeader();
    const response = await axios.delete(`/api/students/${studentId}`, { headers });
    return response.data;
  }

  /**
   * Get all students for the current user
   */
  async getUserStudents() {
    const headers = await authService.getAuthHeader();
    const response = await axios.get('/api/students', { headers });
    return response.data;
  }

  /**
   * Get all resources assigned to a student
   */
  async getStudentResources(studentId) {
    const headers = await authService.getAuthHeader();
    const response = await axios.get(`/api/students/${studentId}/resources`, { headers });
    return response.data;
  }
}

export const studentService = new StudentService();
export default studentService;
