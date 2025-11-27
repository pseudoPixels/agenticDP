import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import studentService from '../services/studentService';
import AssignModal from './AssignModal';

function AssignButton({ lesson, resourceId }) {
  const { isAuthenticated, signIn } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStudents();
    }
  }, [isAuthenticated]);

  const loadStudents = async () => {
    try {
      const response = await studentService.getUserStudents();
      setStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleClick = async () => {
    if (!isAuthenticated) {
      try {
        await signIn();
      } catch (error) {
        console.error('Authentication failed:', error);
        return;
      }
    }

    setShowModal(true);
  };

  const handleAssign = async (studentIds) => {
    // Assignment logic is handled in the modal
    setShowModal(false);
  };

  const resource = {
    id: resourceId,
    title: lesson?.title || 'Untitled Lesson',
    assigned_students: []
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50 rounded-lg font-semibold transition-all"
      >
        <UserPlus className="w-4 h-4" />
        Assign to Student
      </button>

      {showModal && (
        <AssignModal
          resource={resource}
          students={students}
          onClose={() => setShowModal(false)}
          onAssign={handleAssign}
        />
      )}
    </>
  );
}

export default AssignButton;
