import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';

function AssignModal({ resource, students, onClose, onAssign }) {
  const [selectedStudents, setSelectedStudents] = useState(
    resource.assigned_students || []
  );

  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleAssign = () => {
    onAssign(selectedStudents);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Assign to Students</h3>
            <p className="text-sm text-gray-600 mt-1">{resource.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {students.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No students added yet</p>
              <p className="text-sm text-gray-500">
                Go to Settings to add students first
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const isSelected = selectedStudents.includes(student.id);
                return (
                  <button
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">{student.name}</div>
                      {(student.grade || student.age) && (
                        <div className="text-sm text-gray-600 mt-1">
                          {student.grade && `Grade: ${student.grade}`}
                          {student.grade && student.age && ' • '}
                          {student.age && `Age: ${student.age}`}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="bg-emerald-500 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={students.length === 0}
            className="flex-1 btn-primary"
          >
            Assign ({selectedStudents.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignModal;
