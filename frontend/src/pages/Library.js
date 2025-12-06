import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Presentation, GraduationCap, Trash2, UserPlus, UserCheck, UserX, Users, Grid, List, Search, Calendar, Loader2 } from 'lucide-react';
import resourceService from '../services/resourceService';
import studentService from '../services/studentService';

const DEFAULT_STUDENT_NAME = 'My Student';

const RESOURCE_TYPES = [
  { id: 'all', label: 'All Resources', icon: BookOpen },
  { id: 'lesson', label: 'Lessons', icon: BookOpen },
  { id: 'worksheet', label: 'Worksheets', icon: FileText },
  { id: 'presentation', label: 'Presentations', icon: Presentation },
  // { id: 'curriculum', label: 'Curriculum', icon: GraduationCap },
];

function Library() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [resources, setResources] = useState([]);
  const [defaultStudentId, setDefaultStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigningResourceId, setAssigningResourceId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'title'

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
    } else if (resource.resource_type === 'worksheet') {
      navigate(`/worksheet/${resource.id}`);
    } else if (resource.resource_type === 'presentation') {
      navigate(`/presentation/${resource.id}`);
    }
  };

  const handleToggleAssignment = async (resource) => {
    if (!defaultStudentId) return;
    
    setAssigningResourceId(resource.id);
    try {
      const isAssigned = resource.assigned_students?.includes(defaultStudentId);
      
      if (isAssigned) {
        // Unassign
        await resourceService.unassignFromStudent(resource.id, defaultStudentId);
      } else {
        // Assign
        await resourceService.assignToStudent(resource.id, defaultStudentId);
      }
      
      // Reload resources to update assignment info
      await loadResources();
    } catch (error) {
      console.error('Error toggling assignment:', error);
      alert('Failed to update assignment');
    } finally {
      setAssigningResourceId(null);
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

  const isResourceAssigned = (resource) => {
    return resource.assigned_students?.includes(defaultStudentId);
  };

  // Filter and sort resources
  const filteredAndSortedResources = resources
    .filter(resource => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        resource.title?.toLowerCase().includes(query) ||
        resource.content?.subtitle?.toLowerCase().includes(query) ||
        resource.content?.topic?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
        const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
        return dateB - dateA;
      } else if (sortBy === 'oldest') {
        const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
        const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
        return dateA - dateB;
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAndSortedResources.length} resource{filteredAndSortedResources.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
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

      {/* Toolbar - Search, Sort, View Toggle */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner w-12 h-12"></div>
          </div>
        ) : filteredAndSortedResources.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No resources found' : 'No resources yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `No resources match "${searchQuery}"`
                : `Create your first ${activeTab === 'all' ? 'resource' : activeTab} to get started`}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Create New Resource
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedResources.map((resource) => (
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAssignment(resource);
                        }}
                        disabled={assigningResourceId === resource.id}
                        className="text-white hover:bg-white/20 p-1 rounded transition-colors disabled:opacity-50"
                        title={isResourceAssigned(resource) ? "Unassign from student" : "Assign to student"}
                      >
                        {assigningResourceId === resource.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isResourceAssigned(resource) ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(resource.id);
                        }}
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
                    {isResourceAssigned(resource) ? (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                          <UserCheck className="w-3 h-3" />
                          <span className="font-medium">Assigned</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <UserX className="w-3 h-3" />
                        <span>Not assigned</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Created {formatDate(resource.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredAndSortedResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white">
                    {getResourceIcon(resource.resource_type)}
                  </div>

                  {/* Content */}
                  <div 
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => handleOpenResource(resource)}
                  >
                    <h3 className="font-semibold text-gray-900 truncate">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {resource.content?.subtitle || resource.content?.introduction?.text || 'No description'}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    {isResourceAssigned(resource) ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                        <UserCheck className="w-3 h-3" />
                        <span className="font-medium">Assigned</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <UserX className="w-3 h-3" />
                        <span>Not assigned</span>
                      </div>
                    )}
                    <div className="whitespace-nowrap text-gray-500 text-xs">
                      {formatDate(resource.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAssignment(resource);
                      }}
                      disabled={assigningResourceId === resource.id}
                      className="text-emerald-600 hover:bg-emerald-50 p-2 rounded transition-colors disabled:opacity-50"
                      title={isResourceAssigned(resource) ? "Unassign from student" : "Assign to student"}
                    >
                      {assigningResourceId === resource.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isResourceAssigned(resource) ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(resource.id);
                      }}
                      className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Library;
