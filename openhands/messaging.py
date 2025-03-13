from fastapi import APIRouter, Request, HTTPException
import logging
import requests

router = APIRouter()

@router.post("/webhooks/loopmessage")
async def loopmessage_webhook(request: Request):
    payload = await request.json()
    message = payload.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="No message provided")
    logging.info(f"Received loopmessage message: {message}")
    # TODO: dispatch message to active session
    return {"status": "received"}

@router.post("/webhooks/resend")
async def resend_webhook(request: Request):
    payload = await request.json()
    message = payload.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="No message provided")
    logging.info(f"Received resend message: {message}")
    # TODO: dispatch message to active session
    return {"status": "received"}

def send_loopmessage(api_url: str, api_key: str, to: str, message: str):
    headers = {"Authorization": f"Bearer {api_key}"}
    data = {"to": to, "message": message}
    response = requests.post(api_url, json=data, headers=headers)
    if response.status_code != 200:
        raise Exception("Failed to send loopmessage")
    return response.json()

def send_resend(api_url: str, api_key: str, to: str, subject: str, message: str):
    headers = {"Authorization": f"Bearer {api_key}"}
    data = {"to": to, "subject": subject, "message": message}
    response = requests.post(api_url, json=data, headers=headers)
    if response.status_code != 200:
        raise Exception("Failed to send email via Resend")
    return response.json()
