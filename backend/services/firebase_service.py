"""
Firebase Service for Authentication and Firestore Database
Handles user authentication and CRUD operations for resources
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
import json

class FirebaseService:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not FirebaseService._initialized:
            self._initialize_firebase()
            FirebaseService._initialized = True
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if already initialized
            firebase_admin.get_app()
            print("✓ Firebase already initialized")
            self.db = firestore.client()
            self.enabled = True
        except ValueError:
            # Initialize Firebase
            cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')
            
            # Check if Firebase credentials are configured
            if not cred_path and not os.getenv('FIREBASE_PROJECT_ID'):
                print("⚠️  Firebase not configured - running without authentication/database")
                print("   To enable Firebase, follow the setup guide: SETUP_GUIDE.md")
                self.db = None
                self.enabled = False
                return
            
            try:
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                else:
                    # For development, use environment variables
                    cred_dict = {
                        "type": "service_account",
                        "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                        "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                        "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                        "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                        "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    }
                    cred = credentials.Certificate(cred_dict)
                
                firebase_admin.initialize_app(cred)
                self.db = firestore.client()
                self.enabled = True
                print("✓ Firebase initialized successfully")
            except Exception as e:
                print(f"⚠️  Firebase initialization failed: {str(e)}")
                print("   Running without authentication/database")
                print("   To enable Firebase, follow the setup guide: SETUP_GUIDE.md")
                self.db = None
                self.enabled = False
    
    # ==================== User Management ====================
    
    def verify_token(self, id_token: str) -> Optional[Dict]:
        """Verify Firebase ID token and return user info"""
        if not self.enabled:
            return None
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email'),
                'name': decoded_token.get('name'),
                'picture': decoded_token.get('picture')
            }
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None
    
    def get_or_create_user(self, user_info: Dict) -> Dict:
        """Get or create user document in Firestore"""
        if not self.enabled:
            return user_info
        user_ref = self.db.collection('users').document(user_info['uid'])
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Create new user
            user_data = {
                'uid': user_info['uid'],
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'picture': user_info.get('picture'),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            user_ref.set(user_data)
            return user_data
        else:
            return user_doc.to_dict()
    
    # ==================== Resource Management ====================
    
    def save_resource(self, user_id: str, resource_data: Dict) -> str:
        """
        Save a resource (lesson, worksheet, etc.) for a user
        Returns the resource ID
        """
        resource_ref = self.db.collection('resources').document()
        resource_id = resource_ref.id
        
        resource_data.update({
            'id': resource_id,
            'user_id': user_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'assigned_students': []  # List of student IDs
        })
        
        resource_ref.set(resource_data)
        return resource_id
    
    def get_resource(self, resource_id: str) -> Optional[Dict]:
        """Get a specific resource by ID"""
        resource_ref = self.db.collection('resources').document(resource_id)
        resource_doc = resource_ref.get()
        
        if resource_doc.exists:
            return resource_doc.to_dict()
        return None
    
    def update_resource(self, resource_id: str, updates: Dict) -> bool:
        """Update a resource"""
        try:
            resource_ref = self.db.collection('resources').document(resource_id)
            updates['updated_at'] = datetime.utcnow()
            resource_ref.update(updates)
            return True
        except Exception as e:
            print(f"Error updating resource: {e}")
            return False
    
    def delete_resource(self, resource_id: str) -> bool:
        """Delete a resource"""
        try:
            self.db.collection('resources').document(resource_id).delete()
            return True
        except Exception as e:
            print(f"Error deleting resource: {e}")
            return False
    
    def get_user_resources(self, user_id: str, resource_type: Optional[str] = None, 
                          limit: int = 50, offset: int = 0) -> List[Dict]:
        """
        Get all resources for a user, optionally filtered by type
        Supports pagination
        """
        query = self.db.collection('resources').where('user_id', '==', user_id)
        
        if resource_type:
            query = query.where('resource_type', '==', resource_type)
        
        query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
        query = query.limit(limit).offset(offset)
        
        docs = query.stream()
        return [doc.to_dict() for doc in docs]
    
    # ==================== Student Management ====================
    
    def add_student(self, user_id: str, student_data: Dict) -> str:
        """Add a student for a user"""
        student_ref = self.db.collection('students').document()
        student_id = student_ref.id
        
        student_data.update({
            'id': student_id,
            'user_id': user_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        })
        
        student_ref.set(student_data)
        return student_id
    
    def get_student(self, student_id: str) -> Optional[Dict]:
        """Get a specific student by ID"""
        student_ref = self.db.collection('students').document(student_id)
        student_doc = student_ref.get()
        
        if student_doc.exists:
            return student_doc.to_dict()
        return None
    
    def update_student(self, student_id: str, updates: Dict) -> bool:
        """Update a student"""
        try:
            student_ref = self.db.collection('students').document(student_id)
            updates['updated_at'] = datetime.utcnow()
            student_ref.update(updates)
            return True
        except Exception as e:
            print(f"Error updating student: {e}")
            return False
    
    def delete_student(self, student_id: str) -> bool:
        """Delete a student"""
        try:
            self.db.collection('students').document(student_id).delete()
            return True
        except Exception as e:
            print(f"Error deleting student: {e}")
            return False
    
    def get_user_students(self, user_id: str) -> List[Dict]:
        """Get all students for a user"""
        query = self.db.collection('students').where('user_id', '==', user_id)
        query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
        
        docs = query.stream()
        return [doc.to_dict() for doc in docs]
    
    # ==================== Assignment Management ====================
    
    def assign_resource_to_student(self, resource_id: str, student_id: str) -> bool:
        """Assign a resource to a student"""
        try:
            resource_ref = self.db.collection('resources').document(resource_id)
            resource_ref.update({
                'assigned_students': firestore.ArrayUnion([student_id]),
                'updated_at': datetime.utcnow()
            })
            return True
        except Exception as e:
            print(f"Error assigning resource: {e}")
            return False
    
    def unassign_resource_from_student(self, resource_id: str, student_id: str) -> bool:
        """Remove a resource assignment from a student"""
        try:
            resource_ref = self.db.collection('resources').document(resource_id)
            resource_ref.update({
                'assigned_students': firestore.ArrayRemove([student_id]),
                'updated_at': datetime.utcnow()
            })
            return True
        except Exception as e:
            print(f"Error unassigning resource: {e}")
            return False
    
    def get_student_resources(self, student_id: str) -> List[Dict]:
        """Get all resources assigned to a student"""
        query = self.db.collection('resources').where('assigned_students', 'array_contains', student_id)
        query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
        
        docs = query.stream()
        return [doc.to_dict() for doc in docs]


# Singleton instance
firebase_service = FirebaseService()
