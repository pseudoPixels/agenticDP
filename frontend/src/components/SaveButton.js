import React, { useState } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import resourceService from '../services/resourceService';

function SaveButton({ lesson, images, onSaved }) {
  const { isAuthenticated, signIn } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      try {
        await signIn();
      } catch (error) {
        console.error('Authentication failed:', error);
        return;
      }
    }

    // Save the lesson
    try {
      setSaving(true);
      
      const resourceData = {
        resource_type: 'lesson',
        title: lesson.title,
        content: lesson,
        images: images,
        topic: lesson.topic,
        version: lesson.version
      };

      const response = await resourceService.saveResource(resourceData);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      if (onSaved) {
        onSaved(response.resource_id);
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Failed to save lesson. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
          Save Lesson
        </>
      )}
    </button>
  );
}

export default SaveButton;
