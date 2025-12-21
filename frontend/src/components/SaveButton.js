import React, { useState } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import resourceService from '../services/resourceService';

function SaveButton({ lesson, images, resourceId, onSaved }) {
  const { isAuthenticated, signIn } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // Save or update the lesson
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
      
      if (resourceId) {
        // Update existing resource
        if (isAuthenticated) {
          // If authenticated, use regular update
          await resourceService.updateResource(resourceId, {
            content: lesson,
            images: images
          });
        } else {
          // If not authenticated, use anonymous save
          console.log(`SaveButton: Using anonymous save for existing ${resourceType} with ID: ${resourceId}`);
          console.log(`SaveButton: Title: ${lesson.title}`);
          console.log(`SaveButton: Images count: ${Object.keys(images).length}`);
          
          try {
            const response = await resourceService.saveAnonymousResource(
              resourceId,
              resourceType,
              lesson,
              images,
              lesson.title
            );
            console.log('Anonymous save response:', response);
          } catch (saveError) {
            console.error(`Error in anonymous save for ${resourceType}:`, saveError);
            throw new Error(`Failed to save ${resourceType}: ${saveError.message}`);
          }
        }
      } else {
        // Create new resource
        if (isAuthenticated) {
          // If authenticated, use regular save
          const resourceData = {
            resource_type: resourceType,
            title: lesson.title,
            content: lesson,
            images: images,
            topic: lesson.topic,
            version: lesson.version
          };

          const response = await resourceService.saveResource(resourceData);
          savedResourceId = response.resource_id;
        } else {
          // If not authenticated, use anonymous save with generated ID
          const tempId = lesson.id || `temp-${Date.now()}`;
          console.log(`SaveButton: Using anonymous save for new ${resourceType} with ID: ${tempId}`);
          console.log(`SaveButton: Title: ${lesson.title}`);
          console.log(`SaveButton: Images count: ${Object.keys(images).length}`);
          
          try {
            const response = await resourceService.saveAnonymousResource(
              tempId,
              resourceType,
              lesson,
              images,
              lesson.title
            );
            savedResourceId = tempId;
            console.log('Anonymous save response:', response);
          } catch (saveError) {
            console.error(`Error in anonymous save for new ${resourceType}:`, saveError);
            throw new Error(`Failed to save ${resourceType}: ${saveError.message}`);
          }
        }
        
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
          : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white'
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
