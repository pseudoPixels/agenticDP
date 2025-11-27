"""
Firebase Service for Authentication and Firestore Database
Handles user authentication and CRUD operations for resources
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
import json
import base64
import uuid

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
                
                # Get project ID for storage bucket
                project_id = cred_dict.get('project_id') if not cred_path else None
                if not project_id and cred_path:
                    # Try to get from credentials file
                    import json
                    with open(cred_path) as f:
                        cred_data = json.load(f)
                        project_id = cred_data.get('project_id')
                
                # Initialize with storage bucket
                if project_id:
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': f'{project_id}.appspot.com'
                    })
                else:
                    firebase_admin.initialize_app(cred)
                
                self.db = firestore.client()
                self.bucket = storage.bucket() if project_id else None
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
    
    # ==================== Image Storage ====================
    
    def upload_image(self, image_data: str, resource_id: str, image_key: str) -> str:
        """
        Upload base64 image to Firebase Storage
        Returns the public URL
        """
        if not self.enabled or not self.bucket:
            raise Exception("Firebase Storage not enabled")
        
        try:
            # Remove data:image prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Create unique filename
            filename = f"resources/{resource_id}/{image_key}.png"
            
            # Upload to storage
            blob = self.bucket.blob(filename)
            blob.upload_from_string(image_bytes, content_type='image/png')
            
            # Make public and get URL
            blob.make_public()
            return blob.public_url
        except Exception as e:
            print(f"Error uploading image: {e}")
            raise
    
    def upload_images(self, images: Dict, resource_id: str) -> Dict:
        """
        Upload multiple images and return URLs
        """
        image_urls = {}
        for key, image_data in images.items():
            if image_data:
                try:
                    url = self.upload_image(image_data, resource_id, key)
                    image_urls[key] = url
                except Exception as e:
                    print(f"Failed to upload image {key}: {e}")
                    image_urls[key] = None
        return image_urls
    
    # ==================== Resource Management ====================
    
    def save_resource(self, user_id: str, resource_data: Dict) -> str:
        """
        Save a resource (lesson, worksheet, etc.) for a user
        Returns the resource ID
        """
        if not self.enabled:
            raise Exception("Firebase is not enabled")
        
        resource_ref = self.db.collection('resources').document()
        resource_id = resource_ref.id
        
        # Upload images to Firebase Storage and get URLs
        if 'images' in resource_data and resource_data['images']:
            print(f"Uploading {len(resource_data['images'])} images to Firebase Storage...")
            image_urls = self.upload_images(resource_data['images'], resource_id)
            resource_data['images'] = image_urls  # Replace base64 with URLs
        
        # Convert content to JSON string if it's too complex
        if 'content' in resource_data and isinstance(resource_data['content'], dict):
            resource_data['content'] = json.dumps(resource_data['content'])
        
        resource_data.update({
            'id': resource_id,
            'user_id': user_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'assigned_students': []  # List of student IDs
        })
        
        resource_ref.set(resource_data)
        print(f"✓ Resource saved with {len(resource_data.get('images', {}))} images")
        return resource_id
    
    def get_resource(self, resource_id: str) -> Optional[Dict]:
        """Get a specific resource by ID"""
        resource_ref = self.db.collection('resources').document(resource_id)
        resource_doc = resource_ref.get()
        
        if resource_doc.exists:
            data = resource_doc.to_dict()
            # Parse content JSON string back to object
            if 'content' in data and isinstance(data['content'], str):
                try:
                    data['content'] = json.loads(data['content'])
                except:
                    pass
            # Images are already URLs, no need to parse
            return data
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
        resources = []
        for doc in docs:
            data = doc.to_dict()
            # Parse content JSON string back to object
            if 'content' in data and isinstance(data['content'], str):
                try:
                    data['content'] = json.loads(data['content'])
                except:
                    pass
            # Images are already URLs, no need to parse
            resources.append(data)
        return resources
    
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
