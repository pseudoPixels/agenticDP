import React, { useState } from 'react';
import { Save, Check, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import resourceService from '../services/resourceService';

function SaveButton({ lesson, images, resourceId, onSaved }) {
  const { isAuthenticated, signIn, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Main handler for the save button click
  const handleSave = async () => {
    // If not authenticated, prompt for login
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    
    // Otherwise, proceed with saving
    await saveResource();
  };

  // Handle login request
  const handleLogin = async () => {
    try {
      setSaving(true);
      await signIn();
      // After successful login, we'll save the resource
      await saveResource();
    } catch (error) {
      console.error('Error during login:', error);
      alert('Login failed. Please try again.');
      setSaving(false);
    }
  };

  // Function to save the resource
  const saveResource = async () => {
    try {
      setSaving(true);
      
      // Determine content type
      const contentType = lesson.contentType || 'lesson';
      const resourceType = contentType === 'presentation' ? 'presentation' 
                         : contentType === 'worksheet' ? 'worksheet' 
                         : 'lesson';
      
      // Log save attempt
      console.log(`SaveButton: Attempting to save ${resourceType} with ID: ${resourceId || 'new'}`);
      console.log(`SaveButton: User authenticated: ${isAuthenticated}`);
      console.log(`SaveButton: Images being saved:`, Object.keys(images));
      
      let savedResourceId = resourceId;
      
      // When the user clicks save, we want to save it to their account
      // regardless of whether it was temporary before
      const userId = user?.uid || 'anonymous';
      console.log(`SaveButton: User ID for save: ${userId}`);
      
      if (resourceId) {
        // This is an existing resource that might be temporary
        // When user hits save, we want to save it properly to their account
        console.log(`SaveButton: Saving ${resourceType} with ID: ${resourceId} to user account`);
        
        // First, check if this is a temporary resource
        const resourceData = {
          resource_type: resourceType,
          title: lesson.title,
          content: lesson,
          images: images,
          is_temporary: false // Mark as permanent
        };
        
        // Use the proper save method based on whether user is authenticated
        const response = await resourceService.saveResource(resourceData, resourceId);
        console.log('Save response:', response);
      } else {
        // Create new resource
        // Always use regular save since user must be authenticated
        const resourceData = {
          resource_type: resourceType,
          title: lesson.title,
          content: lesson,
          images: images,
          topic: lesson.topic,
          version: lesson.version,
          is_temporary: false // Mark as permanent
        };

        const response = await resourceService.saveResource(resourceData);
        savedResourceId = response.resource_id;
        console.log(`SaveButton: Created new resource with ID: ${savedResourceId}`);
        
        if (onSaved && savedResourceId) {
          onSaved(savedResourceId);
        }
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      // Determine content type for error message
      const contentType = lesson.contentType || 'lesson';
      const resourceTypeName = contentType === 'presentation' ? 'presentation' 
                            : contentType === 'worksheet' ? 'worksheet' 
                            : 'lesson';
      
      console.error(`Error saving ${resourceTypeName}:`, error);
      alert(`Failed to save ${resourceTypeName}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const contentType = lesson?.contentType || 'lesson';
  const saveLabel = contentType === 'presentation' ? 'Save Presentation' 
                  : contentType === 'worksheet' ? 'Save Worksheet' 
                  : 'Save Lesson';

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
        saved
          ? 'bg-green-500 text-white'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {saving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : saved ? (
        <>
          <Check className="w-4 h-4" />
          Saved!
        </>
      ) : !isAuthenticated ? (
        <>
          <LogIn className="w-4 h-4" />
          Save
        </>
      ) : (
        <>
          <Save className="w-4 h-4" />
          {saveLabel}
        </>
      )}
    </button>
  );
}

export default SaveButton;
