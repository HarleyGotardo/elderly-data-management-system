import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const SeniorCitizenForm = ({ seniorId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    // Core IDs
    osca_id: '',
    ncsc_rrn: '',
    
    // Personal Information
    last_name: '',
    first_name: '',
    middle_name: '',
    ext_name: '',
    date_of_birth: '',
    sex: '',
    civil_status: '',
    citizenship: 'Filipino',
    
    // Vulnerable Sector
    is_ip: false,
    ip_group: '',
    is_pwd: false,
    pwd_type: '',
    
    // Location
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    house_number: '',
    street: '',
    
    // Relationships
    spouse_name: '',
    rep_1_name: '',
    rep_1_relationship: '',
    rep_2_name: '',
    rep_2_relationship: '',
    rep_3_name: '',
    rep_3_relationship: '',
    beneficiary_primary: '',
    beneficiary_contingent: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState(null);

  useEffect(() => {
    if (seniorId) {
      setIsEditing(true);
      fetchSeniorCitizen();
    }
  }, [seniorId]);

  useEffect(() => {
    // Calculate age when date of birth changes
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [formData.date_of_birth]);

  const fetchSeniorCitizen = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI.request({
        method: 'GET',
        path: `/senior-citizens/${seniorId}`
      });
      
      if (response.data && response.data.success) {
        setFormData({
          ...formData,
          ...Object.fromEntries(
            Object.entries(response.data.data).map(([key, value]) => [
              key,
              // Keep lgu_id as number, convert others to string
              (key === 'lgu_id' || key === 'is_ip' || key === 'is_pwd') 
                ? (value === null || value === undefined ? (key === 'lgu_id' ? 1 : 0) : Number(value))
                : (value === null || value === undefined ? '' : String(value))
            ])
          )
        });
      } else {
        setErrors({ general: response.data?.message || 'Failed to fetch senior citizen data' });
      }
    } catch (err) {
      setErrors({ general: 'Failed to fetch senior citizen data' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    console.log('Validating form:', formData);
    
    // Core IDs
    if (!formData.osca_id || formData.osca_id.trim() === '') {
      newErrors.osca_id = 'OSCA ID is required';
    } else if (formData.osca_id.length < 5 || formData.osca_id.length > 50) {
      newErrors.osca_id = 'OSCA ID must be between 5 and 50 characters';
    }
    
    if (formData.ncsc_rrn && (formData.ncsc_rrn.length < 5 || formData.ncsc_rrn.length > 50)) {
      newErrors.ncsc_rrn = 'NCSC RRN must be between 5 and 50 characters';
    }
    
    // Personal Information
    if (!formData.last_name || formData.last_name.trim() === '') {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2 || formData.last_name.length > 100) {
      newErrors.last_name = 'Last name must be between 2 and 100 characters';
    }
    
    if (!formData.first_name || formData.first_name.trim() === '') {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2 || formData.first_name.length > 100) {
      newErrors.first_name = 'First name must be between 2 and 100 characters';
    }
    
    if (formData.middle_name && formData.middle_name.length > 100) {
      newErrors.middle_name = 'Middle name must not exceed 100 characters';
    }
    
    if (formData.ext_name && formData.ext_name.length > 20) {
      newErrors.ext_name = 'Extension name must not exceed 20 characters';
    }
    
    // Date of Birth
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      // Check format
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(formData.date_of_birth)) {
        newErrors.date_of_birth = 'Invalid date format';
      } else {
        // Check age
        const birthDate = new Date(formData.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 60) {
          newErrors.date_of_birth = 'Applicant must be 60 years or older';
        }
      }
    }
    
    // Sex
    if (!formData.sex || formData.sex === '') {
      newErrors.sex = 'Sex is required';
    } else if (!['Male', 'Female'].includes(formData.sex)) {
      newErrors.sex = 'Invalid sex value';
    }
    
    // Civil Status
    if (!formData.civil_status || formData.civil_status === '') {
      newErrors.civil_status = 'Civil status is required';
    } else if (!['Single', 'Married', 'Widowed', 'Separated', 'Legally Separated'].includes(formData.civil_status)) {
      newErrors.civil_status = 'Invalid civil status value';
    }
    
    // Citizenship
    if (!formData.citizenship || formData.citizenship === '') {
      newErrors.citizenship = 'Citizenship is required';
    } else if (!['Filipino', 'Dual'].includes(formData.citizenship)) {
      newErrors.citizenship = 'Invalid citizenship value';
    }
    
    // Location fields
    if (!formData.region || formData.region.trim() === '') {
      newErrors.region = 'Region is required';
    } else if (formData.region.length > 100) {
      newErrors.region = 'Region must not exceed 100 characters';
    }
    
    if (!formData.province || formData.province.trim() === '') {
      newErrors.province = 'Province is required';
    } else if (formData.province.length > 100) {
      newErrors.province = 'Province must not exceed 100 characters';
    }
    
    if (!formData.municipality || formData.municipality.trim() === '') {
      newErrors.municipality = 'Municipality is required';
    } else if (formData.municipality.length > 100) {
      newErrors.municipality = 'Municipality must not exceed 100 characters';
    }
    
    if (!formData.barangay || formData.barangay.trim() === '') {
      newErrors.barangay = 'Barangay is required';
    } else if (formData.barangay.length > 100) {
      newErrors.barangay = 'Barangay must not exceed 100 characters';
    }
    
    if (formData.house_number && formData.house_number.length > 50) {
      newErrors.house_number = 'House number must not exceed 50 characters';
    }
    
    if (formData.street && formData.street.length > 100) {
      newErrors.street = 'Street must not exceed 100 characters';
    }
    
    // Relationships
    if (formData.spouse_name && formData.spouse_name.length > 255) {
      newErrors.spouse_name = 'Spouse name must not exceed 255 characters';
    }
    
    // Vulnerable Sector
    if (formData.is_ip && !formData.ip_group.trim()) {
      newErrors.ip_group = 'IP group is required when IP is checked';
    }
    
    if (formData.is_pwd && !formData.pwd_type.trim()) {
      newErrors.pwd_type = 'PWD type is required when PWD is checked';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, isEditing:', isEditing, 'seniorId:', seniorId);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      setLoading(true);
      console.log('Sending request:', {
        method: isEditing ? 'PUT' : 'POST',
        path: isEditing ? `/senior-citizens/${seniorId}` : '/senior-citizens'
      });
      
      const requestData = {
        method: isEditing ? 'PUT' : 'POST',
        path: isEditing ? `/senior-citizens/${seniorId}` : '/senior-citizens',
        body: {
          ...formData,
          // Convert boolean fields
          is_ip: formData.is_ip ? 1 : 0,
          is_pwd: formData.is_pwd ? 1 : 0,
          // Ensure lgu_id is a number
          lgu_id: Number(formData.lgu_id || 1)
        }
      };

      const response = await window.electronAPI.request(requestData);
      console.log('API Response:', response);
      
      if (response.data && response.data.success) {
        // Show success message with SweetAlert
        await Swal.fire({
          icon: 'success',
          title: isEditing ? 'Updated Successfully!' : 'Created Successfully!',
          text: isEditing ? 'Senior citizen has been updated.' : 'New senior citizen has been created.',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
        
        if (onSave) {
          onSave(response.data.data);
        } else {
          // Default behavior: redirect to list
          window.location.href = '#/senior-citizens';
        }
      } else {
        // Show error message
        console.log('Error response data:', response.data);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data?.message || 'Failed to save senior citizen',
          confirmButtonColor: '#3085d6'
        });
        
        if (response.data && response.data.data && typeof response.data.data === 'object') {
          // Validation errors from server
          setErrors(response.data.data);
        } else {
          setErrors({ general: response.data?.message || 'Failed to save senior citizen' });
        }
      }
    } catch (err) {
      setErrors({ general: 'Failed to save senior citizen' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.location.href = '#/senior-citizens';
    }
  };

  if (loading && isEditing) {
    return <div className="loading">Loading senior citizen data...</div>;
  }

  return (
    <div className="senior-citizen-form">
      <div className="form-header">
        <div className="breadcrumb">
          <a href="#/dashboard">Dashboard</a> / <a href="#/senior-citizens">Senior Citizens Registry</a> / {isEditing ? 'Edit Senior Citizen' : 'Add New Senior Citizen'}
        </div>
        <h2>{isEditing ? 'Edit Senior Citizen' : 'Add New Senior Citizen'}</h2>
        <p>{isEditing ? 'Update the information below to modify the senior citizen record.' : 'Fill out the form below to register a new senior citizen.'}</p>
      </div>
      
      {/* General Error */}
      {errors.general && (
        <div className="error">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Core IDs Section */}
        <div className="form-section">
          <h3>Identification</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="osca_id">OSCA ID Number *</label>
              <input
                type="text"
                id="osca_id"
                name="osca_id"
                value={formData.osca_id}
                onChange={handleChange}
                disabled={loading}
                className={errors.osca_id ? 'error' : ''}
              />
              {errors.osca_id && <span className="error-message">{errors.osca_id}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="ncsc_rrn">NCSC RRN</label>
              <input
                type="text"
                id="ncsc_rrn"
                name="ncsc_rrn"
                value={formData.ncsc_rrn}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="last_name">Last Name *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={loading}
                className={errors.last_name ? 'error' : ''}
              />
              {errors.last_name && <span className="error-message">{errors.last_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="first_name">First Name *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={loading}
                className={errors.first_name ? 'error' : ''}
              />
              {errors.first_name && <span className="error-message">{errors.first_name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="middle_name">Middle Name</label>
              <input
                type="text"
                id="middle_name"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ext_name">Extension Name</label>
              <input
                type="text"
                id="ext_name"
                name="ext_name"
                value={formData.ext_name}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g., Jr., Sr., III"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth *</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                disabled={loading}
                className={errors.date_of_birth ? 'error' : ''}
              />
              {errors.date_of_birth && <span className="error-message">{errors.date_of_birth}</span>}
              {calculatedAge !== null && calculatedAge !== undefined && (
                <span className="age-display">Age: {calculatedAge} years old</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sex">Sex *</label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                disabled={loading}
                className={errors.sex ? 'error' : ''}
              >
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.sex && <span className="error-message">{errors.sex}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="civil_status">Civil Status *</label>
              <select
                id="civil_status"
                name="civil_status"
                value={formData.civil_status}
                onChange={handleChange}
                disabled={loading}
                className={errors.civil_status ? 'error' : ''}
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
                <option value="Legally Separated">Legally Separated</option>
              </select>
              {errors.civil_status && <span className="error-message">{errors.civil_status}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="citizenship">Citizenship *</label>
              <select
                id="citizenship"
                name="citizenship"
                value={formData.citizenship}
                onChange={handleChange}
                disabled={loading}
                className={errors.citizenship ? 'error' : ''}
              >
                <option value="Filipino">Filipino</option>
                <option value="Dual">Dual</option>
              </select>
              {errors.citizenship && <span className="error-message">{errors.citizenship}</span>}
            </div>
          </div>
        </div>

        {/* Vulnerable Sector Section */}
        <div className="form-section">
          <h3>Vulnerable Sector</h3>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_ip"
                checked={formData.is_ip}
                onChange={handleChange}
                disabled={loading}
              />
              Indigenous People
            </label>
            {formData.is_ip && (
              <div className="form-group">
                <label htmlFor="ip_group">IP Group</label>
                <input
                  type="text"
                  id="ip_group"
                  name="ip_group"
                  value={formData.ip_group}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.ip_group ? 'error' : ''}
                  placeholder="e.g., Igorot, Aeta, Lumad"
                />
                {errors.ip_group && <span className="error-message">{errors.ip_group}</span>}
              </div>
            )}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_pwd"
                checked={formData.is_pwd}
                onChange={handleChange}
                disabled={loading}
              />
              Person with Disability
            </label>
            {formData.is_pwd && (
              <div className="form-group">
                <label htmlFor="pwd_type">PWD Type</label>
                <input
                  type="text"
                  id="pwd_type"
                  name="pwd_type"
                  value={formData.pwd_type}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.pwd_type ? 'error' : ''}
                  placeholder="e.g., Visual, Mobility, Hearing"
                />
                {errors.pwd_type && <span className="error-message">{errors.pwd_type}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className="form-section">
          <h3>Address</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="region">Region *</label>
              <input
                type="text"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                disabled={loading}
                className={errors.region ? 'error' : ''}
              />
              {errors.region && <span className="error-message">{errors.region}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="province">Province *</label>
              <input
                type="text"
                id="province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                disabled={loading}
                className={errors.province ? 'error' : ''}
              />
              {errors.province && <span className="error-message">{errors.province}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="municipality">Municipality/City *</label>
              <input
                type="text"
                id="municipality"
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                disabled={loading}
                className={errors.municipality ? 'error' : ''}
              />
              {errors.municipality && <span className="error-message">{errors.municipality}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="barangay">Barangay *</label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                disabled={loading}
                className={errors.barangay ? 'error' : ''}
              />
              {errors.barangay && <span className="error-message">{errors.barangay}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="house_number">House Number</label>
              <input
                type="text"
                id="house_number"
                name="house_number"
                value={formData.house_number}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="street">Street</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Relationships Section */}
        <div className="form-section">
          <h3>Relationships</h3>
          
          <div className="form-group">
            <label htmlFor="spouse_name">Spouse Name</label>
            <input
              type="text"
              id="spouse_name"
              name="spouse_name"
              value={formData.spouse_name}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <h4>Authorized Representatives (Maximum of 3)</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rep_1_name">Representative 1 Name</label>
              <input
                type="text"
                id="rep_1_name"
                name="rep_1_name"
                value={formData.rep_1_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rep_1_relationship">Relationship</label>
              <input
                type="text"
                id="rep_1_relationship"
                name="rep_1_relationship"
                value={formData.rep_1_relationship}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g., Son, Daughter, Spouse"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rep_2_name">Representative 2 Name</label>
              <input
                type="text"
                id="rep_2_name"
                name="rep_2_name"
                value={formData.rep_2_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rep_2_relationship">Relationship</label>
              <input
                type="text"
                id="rep_2_relationship"
                name="rep_2_relationship"
                value={formData.rep_2_relationship}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g., Son, Daughter, Spouse"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rep_3_name">Representative 3 Name</label>
              <input
                type="text"
                id="rep_3_name"
                name="rep_3_name"
                value={formData.rep_3_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rep_3_relationship">Relationship</label>
              <input
                type="text"
                id="rep_3_relationship"
                name="rep_3_relationship"
                value={formData.rep_3_relationship}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g., Son, Daughter, Spouse"
              />
            </div>
          </div>

          <h4>Beneficiaries</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="beneficiary_primary">Primary Beneficiary</label>
              <input
                type="text"
                id="beneficiary_primary"
                name="beneficiary_primary"
                value={formData.beneficiary_primary}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="beneficiary_contingent">Contingent Beneficiary</label>
              <input
                type="text"
                id="beneficiary_contingent"
                name="beneficiary_contingent"
                value={formData.beneficiary_contingent}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="primary"
          >
            {loading ? 'Saving...' : (isEditing ? 'Update Senior Citizen' : 'Create Senior Citizen')}
          </button>
        </div>
      </form>

      <style>{`
        .senior-citizen-form {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          background: linear-gradient(135deg, #e8f4fc 0%, #cce5ff 50%, #b3d9ff 100%);
          min-height: 100vh;
        }
        
        .form-header {
          background: white;
          padding: 20px;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 30px;
          border: 1px solid #dee2e6;
        }
        
        .form-header h2 {
          margin: 0 0 10px 0;
          color: #1e3a8a;
          font-size: 24px;
          font-weight: 700;
        }
        
        .form-header .breadcrumb {
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        .form-header .breadcrumb a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        .form-header .breadcrumb a:hover {
          text-decoration: underline;
        }
        
        .form-header p {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }

        .form-section {
          background: white;
          padding: 25px;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 25px;
          border: 1px solid #dee2e6;
        }

        .form-section h3 {
          margin: 0 0 20px 0;
          color: #1e3a8a;
          font-size: 18px;
          font-weight: 600;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
        }

        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          flex: 1;
          margin-bottom: 20px;
          min-width: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #495057;
          font-size: 14px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 15px;
          border: 1px solid #dee2e6;
          border-radius: 0;
          font-size: 14px;
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          transition: all 0.2s ease;
          background: white;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1);
          color: #495057;
          box-sizing: border-box;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        
        .form-group input:disabled,
        .form-group select:disabled {
          background: #f8f9fa;
          color: #6c757d;
          cursor: not-allowed;
        }

        .form-group .required {
          color: #dc3545;
          margin-left: 4px;
        }

        .form-group .error {
          border-color: #dc3545;
          background: #fff5f5;
        }

        .error-message {
          display: block;
          color: #721c24;
          font-size: 13px;
          margin-top: 5px;
          font-weight: 500;
        }

        .age-display {
          display: block;
          color: #155724;
          font-size: 13px;
          margin-top: 5px;
          font-weight: 600;
          background: #d4edda;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #c3e6cb;
        }

        .checkbox-group {
          margin-bottom: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          font-weight: 500;
          margin-bottom: 10px;
          color: #495057;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin-right: 10px;
          transform: scale(1.2);
        }

        .error {
          color: #721c24;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          padding: 15px;
          border-radius: 0;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 30px;
          padding: 20px;
          background: white;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #dee2e6;
        }

        .form-actions button {
          padding: 12px 30px;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          min-width: 120px;
        }
        
        .form-actions button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        
        .form-actions button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }

        .form-actions button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          transform: none;
        }

        .form-actions button[type="button"] {
          background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
          color: white;
          border: 1px solid #545b62;
        }

        .form-actions button[type="button"]:hover:not(:disabled) {
          background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
        }

        .form-actions button.primary {
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          color: white;
          border: 1px solid #2c5aa0;
        }

        .form-actions button.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #357abd 0%, #2968a3 100%);
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #1e3a8a;
          background: white;
          border-radius: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #dee2e6;
        }

        @media (max-width: 768px) {
          .senior-citizen-form {
            padding: 10px;
          }
          
          .form-row {
            flex-direction: column;
            gap: 0;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .form-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SeniorCitizenForm;
