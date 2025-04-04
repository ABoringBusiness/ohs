"""Memory processor for the AI Memory Management System."""

import logging
import re
from typing import Dict, List, Optional, Set, Tuple, Any

from openhands.memory.models import MemoryItem, MemorySource, MemorySourceType

logger = logging.getLogger(__name__)


class MemoryProcessor:
    """Processor for analyzing and extracting information from conversations and documents."""
    
    def __init__(self):
        """Initialize the memory processor."""
        pass
    
    def extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts from text.
        
        Args:
            text: The text to extract concepts from.
            
        Returns:
            A list of key concepts.
        """
        # This is a simple implementation that extracts capitalized phrases
        # In a real implementation, this would use NLP techniques
        concepts = []
        
        # Extract capitalized phrases (potential named entities)
        capitalized_pattern = r'\b[A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*)*\b'
        capitalized_matches = re.findall(capitalized_pattern, text)
        concepts.extend([match for match in capitalized_matches if len(match) > 1])
        
        # Extract phrases that might be important (e.g., surrounded by quotes)
        quoted_pattern = r'"([^"]*)"'
        quoted_matches = re.findall(quoted_pattern, text)
        concepts.extend([match for match in quoted_matches if len(match) > 1])
        
        # Remove duplicates and sort
        return sorted(list(set(concepts)))
    
    def calculate_relevance_score(self, memory: MemoryItem, context: str) -> float:
        """Calculate the relevance score of a memory item for a given context.
        
        Args:
            memory: The memory item.
            context: The context to calculate relevance for.
            
        Returns:
            The relevance score (0.0 to 1.0).
        """
        # This is a simple implementation that uses text overlap
        # In a real implementation, this would use semantic similarity
        
        # If the memory is pinned, it's always highly relevant
        if memory.is_pinned:
            return 1.0
        
        # Calculate word overlap
        memory_words = set(memory.content.lower().split())
        context_words = set(context.lower().split())
        
        if not memory_words or not context_words:
            return 0.0
        
        # Calculate Jaccard similarity
        intersection = memory_words.intersection(context_words)
        union = memory_words.union(context_words)
        
        return len(intersection) / len(union)
    
    def extract_memories_from_conversation(self, conversation: List[Dict[str, Any]], source_id: str) -> List[MemoryItem]:
        """Extract memory items from a conversation.
        
        Args:
            conversation: The conversation messages.
            source_id: The ID of the conversation.
            
        Returns:
            A list of extracted memory items.
        """
        memories = []
        
        for message in conversation:
            # Skip system messages
            if message.get("role") == "system":
                continue
            
            content = message.get("content", "")
            if not content:
                continue
            
            # Extract key concepts
            concepts = self.extract_key_concepts(content)
            
            # Create a memory source
            source = MemorySource(
                type=MemorySourceType.CONVERSATION,
                identifier=source_id,
                metadata={
                    "message_id": message.get("id", ""),
                    "role": message.get("role", ""),
                    "timestamp": message.get("timestamp", ""),
                }
            )
            
            # Create a memory item
            memory = MemoryItem(
                content=content,
                source=source,
                tags=concepts,
            )
            
            memories.append(memory)
        
        return memories
    
    def extract_memories_from_document(self, document: str, source_id: str, metadata: Dict[str, Any] = None) -> List[MemoryItem]:
        """Extract memory items from a document.
        
        Args:
            document: The document content.
            source_id: The ID of the document.
            metadata: Additional metadata about the document.
            
        Returns:
            A list of extracted memory items.
        """
        memories = []
        
        # Split the document into paragraphs
        paragraphs = document.split("\n\n")
        
        for i, paragraph in enumerate(paragraphs):
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            # Extract key concepts
            concepts = self.extract_key_concepts(paragraph)
            
            # Create a memory source
            source = MemorySource(
                type=MemorySourceType.DOCUMENT,
                identifier=source_id,
                metadata={
                    "paragraph_index": i,
                    **(metadata or {}),
                }
            )
            
            # Create a memory item
            memory = MemoryItem(
                content=paragraph,
                source=source,
                tags=concepts,
            )
            
            memories.append(memory)
        
        return memories
    
    def extract_memories_from_code(self, code: str, source_id: str, language: str = None) -> List[MemoryItem]:
        """Extract memory items from code.
        
        Args:
            code: The code content.
            source_id: The ID of the code file.
            language: The programming language.
            
        Returns:
            A list of extracted memory items.
        """
        memories = []
        
        # Create a memory source
        source = MemorySource(
            type=MemorySourceType.CODE,
            identifier=source_id,
            metadata={
                "language": language,
            }
        )
        
        # Extract comments from the code
        comment_patterns = {
            "python": r'#\s*(.*?)$|"""(.*?)"""|\'\'\'(.*?)\'\'\'',
            "javascript": r'//\s*(.*?)$|/\*\*(.*?)\*/|/\*(.*?)\*/',
            "java": r'//\s*(.*?)$|/\*\*(.*?)\*/|/\*(.*?)\*/',
            "c": r'//\s*(.*?)$|/\*(.*?)\*/',
            "cpp": r'//\s*(.*?)$|/\*(.*?)\*/',
            "csharp": r'//\s*(.*?)$|/\*(.*?)\*/',
            "go": r'//\s*(.*?)$|/\*(.*?)\*/',
            "rust": r'//\s*(.*?)$|/\*(.*?)\*/',
            "php": r'//\s*(.*?)$|#\s*(.*?)$|/\*(.*?)\*/',
            "ruby": r'#\s*(.*?)$|=begin(.*?)=end',
        }
        
        # Use a default pattern if the language is not recognized
        pattern = comment_patterns.get(language.lower() if language else "", r'//\s*(.*?)$|#\s*(.*?)$|/\*(.*?)\*/|"""(.*?)"""')
        
        # Extract comments
        comments = []
        for match in re.finditer(pattern, code, re.MULTILINE | re.DOTALL):
            # Get the first non-None group
            comment = next((g for g in match.groups() if g is not None), "").strip()
            if comment:
                comments.append(comment)
        
        # Create a memory item for the comments
        if comments:
            comment_text = "\n".join(comments)
            concepts = self.extract_key_concepts(comment_text)
            
            memory = MemoryItem(
                content=comment_text,
                source=source,
                tags=concepts + ["comments"],
            )
            
            memories.append(memory)
        
        # Create a memory item for the code itself
        concepts = self.extract_key_concepts(code)
        
        memory = MemoryItem(
            content=code,
            source=source,
            tags=concepts + ["code"],
        )
        
        memories.append(memory)
        
        return memories
    
    def find_conflicts(self, memories: List[MemoryItem]) -> List[Tuple[MemoryItem, MemoryItem, float]]:
        """Find potentially conflicting memory items.
        
        Args:
            memories: The list of memory items to check.
            
        Returns:
            A list of tuples containing the conflicting memory items and their similarity score.
        """
        conflicts = []
        
        # This is a simple implementation that checks for high similarity but different content
        # In a real implementation, this would use more sophisticated conflict detection
        
        for i, memory1 in enumerate(memories):
            for j, memory2 in enumerate(memories[i+1:], i+1):
                # Skip if the memories are from the same source
                if memory1.source.identifier == memory2.source.identifier:
                    continue
                
                # Calculate similarity
                similarity = self._calculate_similarity(memory1.content, memory2.content)
                
                # If the memories are similar but not identical, they might conflict
                if 0.5 < similarity < 0.9:
                    conflicts.append((memory1, memory2, similarity))
        
        return conflicts
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate the similarity between two texts.
        
        Args:
            text1: The first text.
            text2: The second text.
            
        Returns:
            The similarity score (0.0 to 1.0).
        """
        # This is a simple implementation that uses Jaccard similarity
        # In a real implementation, this would use semantic similarity
        
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)