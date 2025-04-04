from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from openhands.storage.files import FileStore
from openhands.storage.supabase_client import get_supabase_client


class SupabaseFileStore(FileStore):
    """
    Implementation of FileStore that uses Supabase as the storage backend.
    
    This class maps file operations to Supabase database operations.
    """
    
    def __init__(self, base_path: Optional[str] = None):
        """
        Initialize the Supabase file store.
        
        Args:
            base_path: Optional base path for organizing data in Supabase tables.
                       This is used to create a namespace for data.
        """
        self.base_path = base_path or "default"
        self.supabase = get_supabase_client()
        
        # Ensure tables exist
        self._init_tables()
    
    def _init_tables(self) -> None:
        """
        Initialize the necessary tables if they don't exist.
        
        Note: In a production environment, you would typically create tables
        through migrations rather than at runtime.
        """
        # This is a no-op since tables should be created in Supabase directly
        pass
    
    def _get_path_parts(self, path: str) -> tuple[str, str]:
        """
        Split a path into table name and record ID.
        
        Args:
            path: The path to split.
            
        Returns:
            A tuple of (table_name, record_id).
        """
        # Remove leading slash if present
        if path.startswith("/"):
            path = path[1:]
            
        # Split path into parts
        parts = path.split("/")
        
        # The first part is the table name, the rest is the record ID
        if len(parts) < 2:
            raise ValueError(f"Invalid path: {path}. Path must have at least two parts.")
        
        table_name = parts[0]
        record_id = "/".join(parts[1:])
        
        return table_name, record_id
    
    def read(self, path: str) -> str:
        """
        Read data from Supabase.
        
        Args:
            path: The path to read from.
            
        Returns:
            The data as a string.
            
        Raises:
            FileNotFoundError: If the data doesn't exist.
        """
        table_name, record_id = self._get_path_parts(path)
        
        # Query the table for the record
        response = (
            self.supabase.table(table_name)
            .select("content")
            .eq("id", record_id)
            .eq("namespace", self.base_path)
            .execute()
        )
        
        data = response.data
        
        if not data:
            raise FileNotFoundError(f"No data found at path: {path}")
        
        return data[0]["content"]
    
    def write(self, path: str, content: str) -> None:
        """
        Write data to Supabase.
        
        Args:
            path: The path to write to.
            content: The content to write.
        """
        table_name, record_id = self._get_path_parts(path)
        
        # Check if the record exists
        response = (
            self.supabase.table(table_name)
            .select("id")
            .eq("id", record_id)
            .eq("namespace", self.base_path)
            .execute()
        )
        
        data = {
            "id": record_id,
            "namespace": self.base_path,
            "content": content,
        }
        
        if response.data:
            # Update existing record
            self.supabase.table(table_name).update(data).eq("id", record_id).eq("namespace", self.base_path).execute()
        else:
            # Insert new record
            self.supabase.table(table_name).insert(data).execute()
    
    def delete(self, path: str) -> None:
        """
        Delete data from Supabase.
        
        Args:
            path: The path to delete.
        """
        try:
            table_name, record_id = self._get_path_parts(path)
            
            # Delete the record
            self.supabase.table(table_name).delete().eq("id", record_id).eq("namespace", self.base_path).execute()
        except ValueError:
            # If the path is invalid, try to delete all records with a path that starts with this path
            # This is to handle directory-like deletions
            for table in ["conversations", "settings", "files"]:
                self.supabase.table(table).delete().like("id", f"{path}%").eq("namespace", self.base_path).execute()
    
    def list(self, directory: str) -> List[str]:
        """
        List all paths in a directory.
        
        Args:
            directory: The directory to list.
            
        Returns:
            A list of paths.
            
        Raises:
            FileNotFoundError: If the directory doesn't exist.
        """
        try:
            table_name, prefix = self._get_path_parts(directory)
            
            # Query the table for records with the given prefix
            response = (
                self.supabase.table(table_name)
                .select("id")
                .like("id", f"{prefix}%")
                .eq("namespace", self.base_path)
                .execute()
            )
            
            data = response.data
            
            if not data:
                raise FileNotFoundError(f"No data found at directory: {directory}")
            
            # Reconstruct the full paths
            return [f"{table_name}/{record['id']}" for record in data]
        except ValueError:
            # If the directory is just a table name, list all records in that table
            table_name = directory.strip("/")
            
            response = (
                self.supabase.table(table_name)
                .select("id")
                .eq("namespace", self.base_path)
                .execute()
            )
            
            data = response.data
            
            if not data:
                raise FileNotFoundError(f"No data found in table: {table_name}")
            
            # Reconstruct the full paths
            return [f"{table_name}/{record['id']}" for record in data]