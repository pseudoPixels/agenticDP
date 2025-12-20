import axios from 'axios';
import authService from './authService';

class ResourceService {
  /**
   * Save a resource
   */
  async saveResource(resourceData) {
    const headers = await authService.getAuthHeader();
    const response = await axios.post('/api/resources', resourceData, { headers });
    return response.data;
  }
  
  /**
   * Save a resource anonymously (no auth required)
   * Used for saving generated resources before the user has logged in
   */
  async saveAnonymousResource(resourceId, resourceType, content, images, title) {
    const response = await axios.post(`/api/anonymous/save/${resourceType}/${resourceId}`, {
      content,
      images,
      title
    });
    return response.data;
  }

  /**
   * Get a specific resource
   */
  async getResource(resourceId) {
    const headers = await authService.getAuthHeader();
    const response = await axios.get(`/api/resources/${resourceId}`, { headers });
    return response.data;
  }

  /**
   * Update a resource
   */
  async updateResource(resourceId, updates) {
    const headers = await authService.getAuthHeader();
    const response = await axios.put(`/api/resources/${resourceId}`, updates, { headers });
    return response.data;
  }

  /**
   * Delete a resource
   */
  async deleteResource(resourceId) {
    const headers = await authService.getAuthHeader();
    const response = await axios.delete(`/api/resources/${resourceId}`, { headers });
    return response.data;
  }

  /**
   * Get all resources for the current user
   */
  async getUserResources(type = null, limit = 50, offset = 0) {
    const headers = await authService.getAuthHeader();
    const params = { limit, offset };
    if (type) params.type = type;
    
    const response = await axios.get('/api/resources', { headers, params });
    return response.data;
  }

  /**
   * Assign a resource to a student
   */
  async assignToStudent(resourceId, studentId) {
    const headers = await authService.getAuthHeader();
    const response = await axios.post(
      `/api/resources/${resourceId}/assign`,
      { student_id: studentId },
      { headers }
    );
    return response.data;
  }

  /**
   * Unassign a resource from a student
   */
  async unassignFromStudent(resourceId, studentId) {
    const headers = await authService.getAuthHeader();
    const response = await axios.post(
      `/api/resources/${resourceId}/unassign`,
      { student_id: studentId },
      { headers }
    );
    return response.data;
  }
}

export const resourceService = new ResourceService();
export default resourceService;
