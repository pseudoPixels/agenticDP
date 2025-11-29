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
                project_id = None
                if cred_path:
                    # Get from credentials file
                    import json
                    with open(cred_path) as f:
                        cred_data = json.load(f)
                        project_id = cred_data.get('project_id')
                else:
                    # Get from environment variables
                    project_id = cred_dict.get('project_id')
                
                # Initialize with storage bucket
                if project_id:
                    # Try new Firebase Storage bucket format first, fallback to old format
                    storage_bucket = f'{project_id}.firebasestorage.app'
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': storage_bucket
                    })
                    print(f"✓ Firebase initialized with storage bucket: {storage_bucket}")
                else:
                    firebase_admin.initialize_app(cred)
                    print("⚠️  Firebase initialized without storage bucket (project_id not found)")
                
                self.db = firestore.client()
                
                # Try to get storage bucket and verify it exists
                try:
                    if project_id:
                        self.bucket = storage.bucket()
                        # Test if bucket actually exists by checking if we can access it
                        try:
                            self.bucket.exists()
                            print(f"✓ Storage bucket connected: {self.bucket.name}")
                        except Exception as e:
                            print(f"⚠️  Storage bucket '{self.bucket.name}' does not exist: {e}")
                            print(f"   Enable Firebase Storage at: https://console.firebase.google.com/project/{project_id}/storage")
                            self.bucket = None
                    else:
                        self.bucket = None
                        print("⚠️  Storage bucket not available (no project_id)")
                except Exception as e:
                    print(f"⚠️  Storage bucket error: {e}")
                    print("   Make sure Firebase Storage is enabled in your Firebase Console")
                    self.bucket = None
                
                self.enabled = True
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
        Returns the public URL with cache-busting timestamp
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
            
            # Make public and get URL with cache-busting timestamp
            blob.make_public()
            base_url = blob.public_url
            # Add timestamp to bust browser cache
            timestamp = int(datetime.utcnow().timestamp() * 1000)
            cache_busted_url = f"{base_url}?t={timestamp}"
            return cache_busted_url
        except Exception as e:
            print(f"Error uploading image: {e}")
            raise
    
    def upload_images(self, images: Dict, resource_id: str) -> Dict:
        """
        Upload multiple images and return URLs
        Raises exception if any upload fails
        """
        image_urls = {}
        failed_uploads = []
        
        for key, image_data in images.items():
            if image_data:
                try:
                    url = self.upload_image(image_data, resource_id, key)
                    image_urls[key] = url
                    print(f"  ✓ Uploaded {key}")
                except Exception as e:
                    print(f"  ✗ Failed to upload image {key}: {e}")
                    failed_uploads.append(key)
        
        # If any uploads failed, raise exception to trigger fallback
        if failed_uploads:
            raise Exception(f"Failed to upload {len(failed_uploads)} images: {', '.join(failed_uploads)}")
        
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
        
        # Handle images - ALWAYS use Firebase Storage (required)
        if 'images' in resource_data and resource_data['images']:
            if not self.bucket:
                raise Exception(
                    "Firebase Storage is required but not available. "
                    "Please enable Firebase Storage in your Firebase Console: "
                    f"https://console.firebase.google.com/project/{os.getenv('FIREBASE_PROJECT_ID', 'your-project')}/storage"
                )
            
            # Upload to Firebase Storage
            print(f"Uploading {len(resource_data['images'])} images to Firebase Storage...")
            image_urls = self.upload_images(resource_data['images'], resource_id)
            resource_data['images'] = image_urls  # Replace base64 with URLs
            print(f"✓ Images uploaded to Storage")
        
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
        
        # Ensure resource_type is set
        if 'resource_type' not in resource_data:
            print(f"WARNING: resource_type not provided, defaulting to 'lesson'")
            resource_data['resource_type'] = 'lesson'
        
        print(f"Saving resource with type: {resource_data.get('resource_type')}")
        resource_ref.set(resource_data)
        print(f"✓ Resource saved: {resource_id}")
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
            
            # Images are stored as URLs in Firebase Storage
            # No need to load from separate collection anymore
            
            return data
        return None
    
    def update_resource(self, resource_id: str, updates: Dict) -> bool:
        """Update a resource"""
        try:
            # Handle images - check if any are base64 and need uploading
            if 'images' in updates and updates['images']:
                images_to_upload = {}
                final_images = {}
                
                print(f"DEBUG: update_resource received {len(updates['images'])} images")
                for key, value in updates['images'].items():
                    if isinstance(value, str):
                        # Check if it's base64 data (starts with data:image)
                        if value.startswith('data:image'):
                            print(f"DEBUG: Image {key} is base64, will upload")
                            images_to_upload[key] = value
                        else:
                            # Already a URL, keep it
                            print(f"DEBUG: Image {key} is URL: {value[:100]}")
                            final_images[key] = value
                    else:
                        final_images[key] = value
                
                # Upload any base64 images to Storage
                if images_to_upload:
                    if not self.bucket:
                        raise Exception("Firebase Storage is required for image updates")
                    
                    print(f"Uploading {len(images_to_upload)} new images to Firebase Storage...")
                    uploaded_urls = self.upload_images(images_to_upload, resource_id)
                    final_images.update(uploaded_urls)
                    print(f"✓ Images uploaded to Storage")
                
                updates['images'] = final_images
            
            # Convert content to JSON string if needed
            if 'content' in updates and isinstance(updates['content'], dict):
                updates['content'] = json.dumps(updates['content'])
            
            resource_ref = self.db.collection('resources').document(resource_id)
            updates['updated_at'] = datetime.utcnow()
            resource_ref.update(updates)
            print(f"✓ Resource {resource_id} updated successfully")
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
        
        Note: To avoid composite index requirement, we fetch all user resources
        and filter by type in memory. This is fine for typical use cases.
        """
        # Query only by user_id and order by created_at (single field index exists by default)
        query = self.db.collection('resources').where('user_id', '==', user_id)
        query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
        
        # Fetch more than needed if filtering by type
        fetch_limit = limit * 3 if resource_type else limit
        query = query.limit(fetch_limit)
        
        docs = query.stream()
        resources = []
        
        for doc in docs:
            data = doc.to_dict()
            
            # Debug: Check resource_type field
            if 'resource_type' not in data:
                print(f"WARNING: Resource {doc.id} missing resource_type field!")
                # Set default to 'lesson' for backward compatibility
                data['resource_type'] = 'lesson'
            
            # Filter by resource_type in memory if specified
            if resource_type and data.get('resource_type') != resource_type:
                continue
            
            # Parse content JSON string back to object
            if 'content' in data and isinstance(data['content'], str):
                try:
                    data['content'] = json.loads(data['content'])
                except:
                    pass
            
            # Images are already URLs, no need to parse
            resources.append(data)
            
            # Stop if we have enough resources
            if len(resources) >= limit:
                break
        
        print(f"Found {len(resources)} resources for user {user_id} (type filter: {resource_type})")
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
