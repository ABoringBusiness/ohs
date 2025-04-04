"""Models for the AI Agent Marketplace."""

import datetime
import enum
import uuid
from typing import Dict, List, Optional, Set, Any, Union

from pydantic import BaseModel, Field, HttpUrl, validator


class PricingType(str, enum.Enum):
    """Type of agent pricing."""
    
    FREE = "free"
    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"


class ToolType(str, enum.Enum):
    """Type of tool that an agent can use."""
    
    CODE_INTERPRETER = "code_interpreter"
    WEB_SEARCH = "web_search"
    FILE_MANAGER = "file_manager"
    DATABASE = "database"
    API_CALLER = "api_caller"
    IMAGE_GENERATOR = "image_generator"
    CUSTOM = "custom"


class AgentCategory(str, enum.Enum):
    """Category of an agent."""
    
    CODING = "coding"
    WRITING = "writing"
    DESIGN = "design"
    DATA_ANALYSIS = "data_analysis"
    RESEARCH = "research"
    EDUCATION = "education"
    PRODUCTIVITY = "productivity"
    CREATIVE = "creative"
    BUSINESS = "business"
    OTHER = "other"


class AgentAuthor(BaseModel):
    """Author of an agent."""
    
    id: str
    name: str
    email: Optional[str] = None
    website: Optional[HttpUrl] = None


class AgentPricing(BaseModel):
    """Pricing information for an agent."""
    
    type: PricingType
    amount: Optional[float] = None
    currency: Optional[str] = None
    
    @validator("amount")
    def validate_amount(cls, v, values):
        """Validate that amount is provided for paid agents."""
        if values.get("type") != PricingType.FREE and v is None:
            raise ValueError("Amount is required for paid agents")
        return v
    
    @validator("currency")
    def validate_currency(cls, v, values):
        """Validate that currency is provided for paid agents."""
        if values.get("type") != PricingType.FREE and v is None:
            raise ValueError("Currency is required for paid agents")
        return v


class AgentUI(BaseModel):
    """UI customizations for an agent."""
    
    icon: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    description_markdown: Optional[str] = None
    examples: List[str] = Field(default_factory=list)


class AgentTool(BaseModel):
    """Tool configuration for an agent."""
    
    type: ToolType
    name: str
    description: str
    config: Dict[str, Any] = Field(default_factory=dict)
    required: bool = False


class AgentDefinition(BaseModel):
    """Definition of an AI agent."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    version: str
    author: AgentAuthor
    category: AgentCategory
    tags: List[str] = Field(default_factory=list)
    system_prompt: str
    knowledge_base: List[str] = Field(default_factory=list)
    tools: List[Union[str, AgentTool]] = Field(default_factory=list)
    ui: AgentUI = Field(default_factory=AgentUI)
    pricing: AgentPricing
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    published: bool = False
    downloads: int = 0
    rating: float = 0.0
    rating_count: int = 0
    
    def update(self, **kwargs):
        """Update the agent definition."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.datetime.utcnow()


class AgentReview(BaseModel):
    """Review of an agent."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    user_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    def update_comment(self, comment: str):
        """Update the review comment."""
        self.comment = comment
        self.updated_at = datetime.datetime.utcnow()


class AgentInstallation(BaseModel):
    """Installation of an agent by a user."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    user_id: str
    installed_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    last_used_at: Optional[datetime.datetime] = None
    usage_count: int = 0
    is_favorite: bool = False
    
    def record_usage(self):
        """Record usage of the agent."""
        self.last_used_at = datetime.datetime.utcnow()
        self.usage_count += 1


class UserAgentLibrary(BaseModel):
    """User's library of installed agents."""
    
    user_id: str
    active_agent_id: Optional[str] = None
    installations: Dict[str, AgentInstallation] = Field(default_factory=dict)
    
    def install_agent(self, agent_id: str) -> AgentInstallation:
        """Install an agent."""
        installation = AgentInstallation(agent_id=agent_id, user_id=self.user_id)
        self.installations[agent_id] = installation
        return installation
    
    def uninstall_agent(self, agent_id: str) -> bool:
        """Uninstall an agent."""
        if agent_id in self.installations:
            del self.installations[agent_id]
            if self.active_agent_id == agent_id:
                self.active_agent_id = None
            return True
        return False
    
    def set_active_agent(self, agent_id: str) -> bool:
        """Set the active agent."""
        if agent_id in self.installations or agent_id is None:
            self.active_agent_id = agent_id
            return True
        return False
    
    def get_installation(self, agent_id: str) -> Optional[AgentInstallation]:
        """Get an agent installation."""
        return self.installations.get(agent_id)
    
    def record_agent_usage(self, agent_id: str) -> bool:
        """Record usage of an agent."""
        installation = self.get_installation(agent_id)
        if installation:
            installation.record_usage()
            return True
        return False
    
    def set_favorite(self, agent_id: str, is_favorite: bool) -> bool:
        """Set an agent as a favorite."""
        installation = self.get_installation(agent_id)
        if installation:
            installation.is_favorite = is_favorite
            return True
        return False
    
    def get_favorites(self) -> List[AgentInstallation]:
        """Get favorite agent installations."""
        return [i for i in self.installations.values() if i.is_favorite]
    
    def get_recent(self, limit: int = 5) -> List[AgentInstallation]:
        """Get recently used agent installations."""
        sorted_installations = sorted(
            [i for i in self.installations.values() if i.last_used_at],
            key=lambda i: i.last_used_at,
            reverse=True,
        )
        return sorted_installations[:limit]
    
    def get_most_used(self, limit: int = 5) -> List[AgentInstallation]:
        """Get most used agent installations."""
        sorted_installations = sorted(
            self.installations.values(),
            key=lambda i: i.usage_count,
            reverse=True,
        )
        return sorted_installations[:limit]