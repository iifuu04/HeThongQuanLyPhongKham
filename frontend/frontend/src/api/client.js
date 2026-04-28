/**
 * API Client for Backend Integration
 * Handles all HTTP requests with authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_KEY = 'medsys_auth';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    const auth = localStorage.getItem(AUTH_KEY);
    return auth ? JSON.parse(auth).token : null;
  }

  setAuth(token, user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
  }

  getAuth() {
    const auth = localStorage.getItem(AUTH_KEY);
    return auth ? JSON.parse(auth) : null;
  }

  clearAuth() {
    localStorage.removeItem(AUTH_KEY);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  // Profiles
  async getProfiles() {
    return this.request('/profiles');
  }

  async getProfile(id) {
    return this.request(`/profiles/${id}`);
  }

  async createProfile(data) {
    return this.request('/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfile(id, data) {
    return this.request(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProfile(id) {
    return this.request(`/profiles/${id}`, { method: 'DELETE' });
  }

  // Patients
  async getPatients() {
    return this.request('/patients');
  }

  async getPatient(id) {
    return this.request(`/patients/${id}`);
  }

  async createPatient(data) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatient(id, data) {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Doctors
  async getDoctors() {
    return this.request('/doctors');
  }

  async getDoctor(id) {
    return this.request(`/doctors/${id}`);
  }

  async createDoctor(data) {
    return this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDoctor(id, data) {
    return this.request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Specialties
  async getSpecialties() {
    return this.request('/specialties');
  }

  async getSpecialty(id) {
    return this.request(`/specialties/${id}`);
  }

  async createSpecialty(data) {
    return this.request('/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSpecialty(id, data) {
    return this.request(`/specialties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSpecialty(id) {
    return this.request(`/specialties/${id}`, { method: 'DELETE' });
  }

  // Clinics
  async getClinics() {
    return this.request('/clinics');
  }

  async getClinic(id) {
    return this.request(`/clinics/${id}`);
  }

  async createClinic(data) {
    return this.request('/clinics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClinic(id, data) {
    return this.request(`/clinics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Shifts
  async getShifts() {
    return this.request('/shifts');
  }

  async getShift(id) {
    return this.request(`/shifts/${id}`);
  }

  async createShift(data) {
    return this.request('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShift(id, data) {
    return this.request(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteShift(id) {
    return this.request(`/shifts/${id}`, { method: 'DELETE' });
  }

  // Services
  async getServices() {
    return this.request('/services');
  }

  async getService(id) {
    return this.request(`/services/${id}`);
  }

  async createService(data) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id, data) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id) {
    return this.request(`/services/${id}`, { method: 'DELETE' });
  }

  // Work Schedules
  async getWorkSchedules(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/work-schedules${query ? `?${query}` : ''}`);
  }

  async getWorkSchedule(id) {
    return this.request(`/work-schedules/${id}`);
  }

  async createWorkSchedule(data) {
    return this.request('/work-schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkSchedule(id, data) {
    return this.request(`/work-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkSchedule(id) {
    return this.request(`/work-schedules/${id}`, { method: 'DELETE' });
  }

  // Appointments
  async getAppointments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/appointments${query ? `?${query}` : ''}`);
  }

  async getAppointment(id) {
    return this.request(`/appointments/${id}`);
  }

  async createAppointment(data) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointment(id, data) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelAppointment(id) {
    return this.request(`/appointments/${id}/cancel`, { method: 'PATCH' });
  }

  async checkInAppointment(id) {
    return this.request(`/appointments/${id}/check-in`, { method: 'PATCH' });
  }

  async updateAppointmentStatus(id, status) {
    return this.request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Appointment Requests
  async getAppointmentRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/appointment-requests${query ? `?${query}` : ''}`);
  }

  async getAppointmentRequest(id) {
    return this.request(`/appointment-requests/${id}`);
  }

  async createAppointmentRequest(data) {
    return this.request('/appointment-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveAppointmentRequest(id) {
    return this.request(`/appointment-requests/${id}/approve`, { method: 'PATCH' });
  }

  async rejectAppointmentRequest(id, reason) {
    return this.request(`/appointment-requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // Medical Records
  async getMedicalRecords(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/medical-records${query ? `?${query}` : ''}`);
  }

  async getMedicalRecord(id) {
    return this.request(`/medical-records/${id}`);
  }

  async getMedicalRecordByAppointment(appointmentId) {
    return this.request(`/medical-records/appointment/${appointmentId}`);
  }

  async getPatientHistory(patientId) {
    return this.request(`/medical-records/patient/${patientId}/history`);
  }

  async createMedicalRecord(data) {
    return this.request('/medical-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMedicalRecord(id, data) {
    return this.request(`/medical-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async finalizeMedicalRecord(id) {
    return this.request(`/medical-records/${id}/finalize`, { method: 'PATCH' });
  }

  // Bills
  async getBills(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/bills${query ? `?${query}` : ''}`);
  }

  async getBill(id) {
    return this.request(`/bills/${id}`);
  }

  async getBillDetail(id) {
    return this.request(`/bills/${id}/detail`);
  }

  async getBillsByPatient(patientId) {
    return this.request(`/bills/patient/${patientId}`);
  }

  async createBill(data) {
    return this.request('/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBill(id, data) {
    return this.request(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async confirmPayment(id, paymentMethod) {
    return this.request(`/bills/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentMethod }),
    });
  }

  async getBillItems(billId) {
    return this.request(`/bills/${billId}/items`);
  }

  async addBillItem(billId, data) {
    return this.request(`/bills/${billId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBillItem(itemId, data) {
    return this.request(`/bills/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBillItem(itemId) {
    return this.request(`/bills/items/${itemId}`, { method: 'DELETE' });
  }

  // Audit Logs
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs${query ? `?${query}` : ''}`);
  }

  async getAuditLogStats(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs/stats${query ? `?${query}` : ''}`);
  }

  async getRecentActivity(limit = 50) {
    return this.request(`/audit-logs/recent?limit=${limit}`);
  }
}

export const api = new ApiClient();
export default api;
