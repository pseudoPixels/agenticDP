import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Presentation, GraduationCap, Trash2, UserPlus, Users } from 'lucide-react';
import resourceService from '../services/resourceService';
import studentService from '../services/studentService';
import AssignModal from '../components/AssignModal';

const RESOURCE_TYPES = [
  { id: 'all', label: 'All Resources', icon: BookOpen },
  { id: 'lesson', label: 'Lessons', icon: BookOpen },
  { id: 'worksheet', label: 'Worksheets', icon: FileText },
  { id: 'presentation', label: 'Presentations', icon: Presentation },
  { id: 'curriculum', label: 'Curriculum', icon: GraduationCap },
];

function Library() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [resources, setResources] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    loadResources();
    loadStudents();
  }, [activeTab]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const type = activeTab === 'all' ? null : activeTab;
      const response = await resourceService.getUserResources(type);
      setResources(response.resources || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await studentService.getUserStudents();
      setStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await resourceService.deleteResource(resourceId);
      setResources(resources.filter(r => r.id !== resourceId));
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource');
    }
  };

  const handleOpenResource = (resource) => {
    // Navigate to the appropriate view based on resource type
    if (resource.resource_type === 'lesson') {
      navigate(`/lesson/${resource.id}`);
    }
    // Add more resource type handlers as needed
  };

  const handleAssign = (resource) => {
    setSelectedResource(resource);
    setShowAssignModal(true);
  };

  const handleAssignComplete = async (studentIds) => {
    try {
      // Assign to selected students
      for (const studentId of studentIds) {
        await resourceService.assignToStudent(selectedResource.id, studentId);
      }
      
      // Reload resources to update assignment info
      await loadResources();
      setShowAssignModal(false);
      setSelectedResource(null);
    } catch (error) {
      console.error('Error assigning resource:', error);
      alert('Failed to assign resource');
    }
  };

  const getResourceIcon = (type) => {
    const resourceType = RESOURCE_TYPES.find(t => t.id === type);
    const Icon = resourceType?.icon || BookOpen;
    return <Icon className="w-5 h-5" />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getAssignedStudentNames = (assignedStudents) => {
    if (!assignedStudents || assignedStudents.length === 0) return 'Not assigned';
    
    const names = assignedStudents
      .map(studentId => {
        const student = students.find(s => s.id === studentId);
        return student?.name || 'Unknown';
      })
      .slice(0, 2);
    
    if (assignedStudents.length > 2) {
      return `${names.join(', ')} +${assignedStudents.length - 2} more`;
    }
    return names.join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
              <p className="text-sm text-gray-600 mt-1">
                {resources.length} resource{resources.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Create New
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {RESOURCE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveTab(type.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === type.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner w-12 h-12"></div>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first {activeTab === 'all' ? 'resource' : activeTab} to get started
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Create New Resource
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Resource Header */}
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-white">
                      {getResourceIcon(resource.resource_type)}
                      <span className="text-xs font-medium uppercase">
                        {resource.resource_type}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssign(resource)}
                        className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                        title="Assign to student"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resource Content */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => handleOpenResource(resource)}
                >
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {resource.content?.subtitle || resource.content?.introduction?.text || 'No description'}
                  </p>
                  
                  {/* Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{getAssignedStudentNames(resource.assigned_students)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created {formatDate(resource.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignModal
          resource={selectedResource}
          students={students}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedResource(null);
          }}
          onAssign={handleAssignComplete}
        />
      )}
    </div>
  );
}

export default Library;
