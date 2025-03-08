import json
import os
from typing import Any, Literal

import requests
from pydantic import BaseModel

from openhands.core.logger import openhands_logger as logger
from openhands.storage.supabase import get_supabase_client


class FeedbackDataModel(BaseModel):
    version: str
    email: str
    polarity: Literal['positive', 'negative']
    feedback: Literal[
        'positive', 'negative'
    ]  # TODO: remove this, its here for backward compatibility
    permissions: Literal['public', 'private']
    trajectory: list[dict[str, Any]] | None


FEEDBACK_URL = 'https://share-od-trajectory-3u9bw9tx.uc.gateway.dev/share_od_trajectory'


def store_feedback(feedback: FeedbackDataModel) -> dict[str, str]:
    # Start logging
    feedback.feedback = feedback.polarity
    display_feedback = feedback.model_dump()
    if 'trajectory' in display_feedback:
        display_feedback['trajectory'] = (
            f"elided [length: {len(display_feedback['trajectory'])}"
        )
    if 'token' in display_feedback:
        display_feedback['token'] = 'elided'
    logger.debug(f'Got feedback: {display_feedback}')
    
    response_data = {}
    
    # Store in Supabase if enabled
    if os.environ.get("USE_SUPABASE_STORAGE", "").lower() == "true":
        try:
            client = get_supabase_client()
            data = {
                "version": feedback.version,
                "email": feedback.email,
                "polarity": feedback.polarity,
                "permissions": feedback.permissions,
                "trajectory": feedback.trajectory
            }
            
            supabase_response = client.table("feedback").insert(data).execute()
            response_data = {"status": "success", "id": supabase_response.data[0]["id"]}
            logger.debug(f"Stored feedback in Supabase: {response_data}")
        except Exception as e:
            logger.error(f"Failed to store feedback in Supabase: {e}")
    
    # Also send to original endpoint for backward compatibility
    try:
        original_response = requests.post(
            FEEDBACK_URL,
            headers={'Content-Type': 'application/json'},
            json=feedback.model_dump(),
        )
        
        if original_response.status_code != 200:
            logger.warning(f'Failed to store feedback in original endpoint: {original_response.text}')
        else:
            original_data = json.loads(original_response.text)
            logger.debug(f'Stored feedback in original endpoint: {original_data}')
            # If we didn't store in Supabase, use the original response
            if not response_data:
                response_data = original_data
    except Exception as e:
        logger.error(f"Failed to store feedback in original endpoint: {e}")
        if not response_data:
            raise ValueError(f'Failed to store feedback: {e}')
    
    return response_data
