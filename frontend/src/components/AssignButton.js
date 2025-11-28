import React, { useState, useEffect } from 'react';
import { UserCheck, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import studentService from '../services/studentService';
import resourceService from '../services/resourceService';

const DEFAULT_STUDENT_NAME = 'My Student';

function AssignButton({ lesson, resourceId, onAssignmentChange }) {
  const { isAuthenticated, signIn } = useAuth();
  const [isAssigned, setIsAssigned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [defaultStudentId, setDefaultStudentId] = useState(null);

  const checkAssignmentStatus = async () => {
    try {
      // Get or create default student
      const response = await studentService.getUserStudents();
      let student = response.students?.find(s => s.name === DEFAULT_STUDENT_NAME);
      
      if (!student) {
        // Create default student
        const createResponse = await studentService.addStudent({
          name: DEFAULT_STUDENT_NAME,
          grade: 'N/A'
        });
        student = createResponse.student;
      }
      
      setDefaultStudentId(student.id);
      
      // Check if resource is assigned
      const resourceResponse = await resourceService.getResource(resourceId);
      if (resourceResponse.success) {
        const assignedStudents = resourceResponse.resource.assigned_students || [];
        const isCurrentlyAssigned = assignedStudents.includes(student.id);
        setIsAssigned(isCurrentlyAssigned);
      }
    } catch (error) {
      console.error('Error checking assignment status:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkAssignmentStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, resourceId]);

  const handleToggleAssignment = async () => {
    if (!isAuthenticated) {
      try {
        await signIn();
      } catch (error) {
        console.error('Authentication failed:', error);
        return;
      }
    }

    setLoading(true);
    try {
      if (isAssigned) {
        // Unassign
        await resourceService.unassignFromStudent(resourceId, defaultStudentId);
        setIsAssigned(false);
      } else {
        // Assign
        await resourceService.assignToStudent(resourceId, defaultStudentId);
        setIsAssigned(true);
      }
      
      // Notify parent component
      if (onAssignmentChange) {
        onAssignmentChange(isAssigned);
      }
    } catch (error) {
      console.error('Error toggling assignment:', error);
      alert('Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleAssignment}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
        isAssigned
          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
          : 'bg-white border-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isAssigned ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {isAssigned ? 'Assigned to Student' : 'Assign to Student'}
    </button>
  );
}

export default AssignButton;
